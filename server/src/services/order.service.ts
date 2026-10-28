import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import { env, razorpayEnabled } from '../config/env.js';
import { RESERVATION_MINUTES } from '../utils/constants.js';
import { razorpayService } from './razorpay.service.js';
import type { IShippingAddress } from '../models/Order.js';

interface CreateInput {
  items: { productId: string; qty: number }[];
  shippingAddress: IShippingAddress;
  paymentMethod: 'COD' | 'RAZORPAY';
}

export async function createOrder(userId: string, input: CreateInput) {
  const isRazorpay = input.paymentMethod === 'RAZORPAY';
  if (isRazorpay && !razorpayEnabled) throw new ApiError(400, 'Online payment is not available');

  const map = new Map<string, number>();
  for (const it of input.items) map.set(it.productId, (map.get(it.productId) ?? 0) + it.qty);
  const unique = [...map.entries()].map(([productId, qty]) => ({ productId, qty }));

  const products = await Product.find({ _id: { $in: unique.map((u) => u.productId) } });
  if (products.length !== unique.length) throw new ApiError(400, 'One or more products not found');

  const decremented: { id: string; qty: number }[] = [];
  const snapshots: { product: (typeof products)[number]; qty: number }[] = [];
  try {
    for (const u of unique) {
      const product = products.find((p) => String(p._id) === u.productId)!;
      if (product.stock < u.qty) throw new ApiError(400, `Insufficient stock for ${product.name}`);
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: u.qty } },
        { $inc: { stock: -u.qty } },
        { returnDocument: 'after' },
      );
      if (!updated) throw new ApiError(400, `Insufficient stock for ${product.name}`);
      decremented.push({ id: String(product._id), qty: u.qty });
      snapshots.push({ product: updated, qty: u.qty });
    }
  } catch (err) {
    await Promise.all(decremented.map((d) => Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } })));
    throw err;
  }

  const items = snapshots.map((s) => ({
    product: s.product._id,
    name: s.product.name,
    image: s.product.image,
    price: s.product.price,
    qty: s.qty,
  }));
  const itemsPrice = Math.round(items.reduce((sum, i) => sum + i.price * i.qty, 0) * 100) / 100;
  const totalPrice = itemsPrice;

  const order = await Order.create({
    user: userId,
    items,
    shippingAddress: input.shippingAddress,
    itemsPrice,
    totalPrice,
    paymentMethod: input.paymentMethod,
    paymentStatus: isRazorpay ? 'pending' : 'cod',
    status: isRazorpay ? 'pending_payment' : 'pending',
    stockRestored: false,
    ...(isRazorpay ? { paymentExpiresAt: new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000) } : {}),
  }).catch(async (err: unknown) => {
    await Promise.all(decremented.map((d) => Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } })));
    throw err;
  });

  if (isRazorpay) {
    try {
      const rzOrder = await razorpayService.createOrder(totalPrice, String(order._id));
      order.razorpayOrderId = rzOrder.id;
      await order.save();
      return {
        order,
        payment: {
          keyId: env.RAZORPAY_KEY_ID!,
          razorpayOrderId: rzOrder.id,
          amount: Math.round(totalPrice * 100),
          currency: 'INR',
        },
      };
    } catch {
      order.status = 'cancelled';
      order.paymentStatus = 'failed';
      order.stockRestored = true;
      await order.save();
      await Promise.all(decremented.map((d) => Product.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } })));
      throw new ApiError(502, 'Payment gateway unavailable; order cancelled');
    }
  }

  return { order };
}

export async function verifyPayment(
  userId: string,
  orderId: string,
  payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
) {
  const order = await Order.findById(orderId);
  if (!order || String(order.user) !== userId) throw new ApiError(404, 'Order not found');
  if (order.paymentMethod !== 'RAZORPAY') throw new ApiError(400, 'Not a Razorpay order');
  if (order.razorpayOrderId !== payload.razorpay_order_id) throw new ApiError(400, 'Order mismatch');

  if (order.paymentStatus === 'paid') {
    if (order.razorpayPaymentId === payload.razorpay_payment_id) return order;
    throw new ApiError(409, 'Payment already recorded');
  }

  const valid = razorpayService.verifySignature(
    payload.razorpay_order_id,
    payload.razorpay_payment_id,
    payload.razorpay_signature,
  );
  if (!valid) throw new ApiError(400, 'Invalid payment signature');

  if (order.status === 'cancelled') {
    let refundFailed = false;
    try {
      const refundId = await razorpayService.refund(payload.razorpay_payment_id, Math.round(order.totalPrice * 100));
      order.razorpayPaymentId = payload.razorpay_payment_id;
      order.razorpayRefundId = refundId;
      order.paymentStatus = 'refunded';
      order.refundedAt = new Date();
      await order.save();
    } catch {
      order.razorpayPaymentId = payload.razorpay_payment_id;
      order.paymentStatus = 'paid';
      await order.save();
      refundFailed = true;
    }
    if (refundFailed) {
      throw new ApiError(502, 'Payment received after the reservation expired, but the automatic refund failed. Please contact support.');
    }
    throw new ApiError(409, 'Payment received after the reservation expired; a refund was issued.');
  }

  if (order.status !== 'pending_payment') throw new ApiError(409, 'Order not awaiting payment');

  order.razorpayPaymentId = payload.razorpay_payment_id;
  order.paymentStatus = 'paid';
  order.status = 'pending';
  order.paidAt = new Date();
  order.paymentExpiresAt = undefined;
  await order.save();
  return order;
}

export async function cancelPayment(userId: string, orderId: string) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, user: userId, status: 'pending_payment', stockRestored: false },
    { status: 'cancelled', paymentStatus: 'failed', stockRestored: true },
    { returnDocument: 'after' },
  );
  if (!order) {
    const existing = await Order.findById(orderId);
    if (existing && String(existing.user) === userId && existing.status === 'cancelled') return existing;
    throw new ApiError(409, 'Cannot cancel this payment');
  }
  await Promise.all(order.items.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: i.qty } })));
  return order;
}

export async function cancelOrder(userId: string, orderId: string, isAdmin: boolean) {
  const filter: Record<string, unknown> = { _id: orderId, status: 'pending', stockRestored: false };
  if (!isAdmin) filter.user = userId;
  const order = await Order.findOne(filter);
  if (!order) throw new ApiError(404, 'Order not found or not cancellable');

  if (order.paymentMethod === 'RAZORPAY' && order.paymentStatus === 'paid' && order.razorpayPaymentId) {
    try {
      const refundId = await razorpayService.refund(order.razorpayPaymentId, Math.round(order.totalPrice * 100));
      order.razorpayRefundId = refundId;
      order.paymentStatus = 'refunded';
      order.refundedAt = new Date();
    } catch {
      throw new ApiError(502, 'Refund failed; order not cancelled');
    }
  } else if (order.paymentMethod === 'RAZORPAY') {
    order.paymentStatus = 'failed';
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: 'pending', stockRestored: false },
    {
      status: 'cancelled',
      stockRestored: true,
      paymentStatus: order.paymentStatus,
      razorpayRefundId: order.razorpayRefundId,
      refundedAt: order.refundedAt,
    },
    { returnDocument: 'after' },
  );
  if (!updated) throw new ApiError(409, 'Order already updated');

  await Promise.all(order.items.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: i.qty } })));
  return updated;
}

export async function updateStatus(orderId: string, newStatus: 'shipped' | 'delivered' | 'cancelled') {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  const allowed: Record<string, string[]> = {
    pending: ['shipped', 'cancelled'],
    shipped: ['delivered'],
  };
  if (!allowed[order.status]?.includes(newStatus)) {
    throw new ApiError(400, `Cannot transition from ${order.status} to ${newStatus}`);
  }

  if (newStatus === 'cancelled' && order.paymentMethod === 'RAZORPAY' && order.paymentStatus === 'paid' && order.razorpayPaymentId) {
    try {
      const refundId = await razorpayService.refund(order.razorpayPaymentId, Math.round(order.totalPrice * 100));
      order.razorpayRefundId = refundId;
      order.paymentStatus = 'refunded';
      order.refundedAt = new Date();
    } catch {
      throw new ApiError(502, 'Refund failed; status not changed');
    }
  } else if (newStatus === 'cancelled' && order.paymentMethod === 'RAZORPAY') {
    order.paymentStatus = 'failed';
  }

  order.status = newStatus;
  if (newStatus === 'cancelled') order.stockRestored = true;
  await order.save();

  if (newStatus === 'cancelled') {
    await Promise.all(order.items.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: i.qty } })));
  }
  return order;
}

export async function expireStalePayments() {
  const stale = await Order.find({ status: 'pending_payment', paymentExpiresAt: { $lt: new Date() }, stockRestored: false });
  for (const order of stale) {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: 'pending_payment', stockRestored: false },
      { status: 'cancelled', paymentStatus: 'failed', stockRestored: true },
      { returnDocument: 'after' },
    );
    if (updated) {
      await Promise.all(updated.items.map((i) => Product.findByIdAndUpdate(i.product, { $inc: { stock: i.qty } })));
    }
  }
}
