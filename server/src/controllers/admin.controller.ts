import type { Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { updateStatus } from '../services/order.service.js';

export async function stats(_req: Request, res: Response) {
  const [products, orders, customers, recent, valueAgg] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments({ status: { $ne: 'cancelled' } }),
    User.countDocuments({ role: 'user' }),
    Order.find({ status: { $ne: 'pending_payment' } }).sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    Order.aggregate([{ $match: { status: { $nin: ['cancelled', 'pending_payment'] } } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
  ]);
  res.json({ stats: { products, orders, customers, orderValue: valueAgg[0]?.total ?? 0 }, recentOrders: recent });
}

export async function listProducts(_req: Request, res: Response) {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ products });
}

export async function createProduct(req: Request, res: Response) {
  const product = await Product.create(req.body);
  res.status(201).json({ product });
}

export async function updateProduct(req: Request, res: Response) {
  const product = await Product.findByIdAndUpdate(String(req.params.id), req.body, { returnDocument: 'after', runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ product });
}

export async function deleteProduct(req: Request, res: Response) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ message: 'Deleted' });
}

export async function listOrders(req: Request, res: Response) {
  const q = req.query as Record<string, string | undefined>;
  const filter: Record<string, unknown> = {};
  if (q.status && q.status !== 'all') filter.status = q.status;
  const lim = Math.min(Number(q.limit) || 20, 100);
  const pg = Math.max(Number(q.page) || 1, 1);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim).populate('user', 'name email'),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, page: pg, pages: Math.ceil(total / lim) || 1, total });
}

export async function updateOrderStatus(req: Request, res: Response) {
  const order = await updateStatus(String(req.params.id), req.body.status);
  res.json({ order });
}
