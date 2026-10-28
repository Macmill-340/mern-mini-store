import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDate, shortId } from '../utils/format';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { getErrorMessage } from '../utils/errors';
import { STATUS_LABEL, PAYMENT_LABEL } from '../utils/constants';
import { toast } from 'react-hot-toast';
import type { Order } from '../types';

const STATUS_TONE: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending_payment: 'warning',
  pending: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'danger',
};

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get(`/orders/${id}`)
      .then((r) => setOrder(r.data.order))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const isAdmin = user?.role === 'admin';
  const isOwner = order && (typeof order.user === 'string' ? order.user === user?.id : order.user?._id === user?.id);

  const cancel = async () => {
    if (!order) return;
    if (!window.confirm('Cancel this order?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/orders/${order._id}/cancel`);
      toast.success('Order cancelled');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const cancelPayment = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      await api.post(`/orders/${order._id}/cancel-payment`);
      toast.success('Payment cancelled');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (status: 'shipped' | 'delivered' | 'cancelled') => {
    if (!order) return;
    if (status === 'cancelled' && !window.confirm('Cancel and refund (if paid online)?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/orders/${order._id}/status`, { status });
      toast.success('Status updated');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader />;
  if (error || !order) return <div className="mx-auto max-w-6xl px-4 py-8 text-red-600">{error || 'Not found'}</div>;

  const canCancel = isOwner && order.status === 'pending';
  const isPendingPayment = order.status === 'pending_payment';

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <Link to={isAdmin ? '/admin/orders' : '/orders'} className="text-sm text-zinc-500 hover:text-emerald-600">← Back to orders</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{shortId(order._id)}</h1>
        <div className="flex gap-2">
          <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
          <Badge tone="info">{PAYMENT_LABEL[order.paymentStatus]}</Badge>
        </div>
      </div>
      <p className="text-sm text-zinc-500">Placed {formatDate(order.createdAt)}</p>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold">Items</h2>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex gap-4 rounded-xl border border-zinc-200 p-4">
              <img src={item.image} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-zinc-500">{formatINR(item.price)} × {item.qty}</p>
              </div>
              <p className="font-semibold">{formatINR(item.price * item.qty)}</p>
            </div>
          ))}
          <div className="rounded-xl border border-zinc-200 p-4">
            <h2 className="text-lg font-semibold">Shipping address</h2>
            <p className="mt-2 text-sm text-zinc-600">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.address}<br />
              {order.shippingAddress.city} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.phone}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold">Summary</h2>
          <div className="flex justify-between text-sm"><span>Items</span><span>{formatINR(order.itemsPrice)}</span></div>
          <div className="flex justify-between text-sm"><span>Shipping</span><span>Free</span></div>
          <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-bold"><span>Total</span><span>{formatINR(order.totalPrice)}</span></div>
          <div className="text-sm text-zinc-500">Payment: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay'}</div>
          {order.razorpayPaymentId && <div className="text-xs text-zinc-400">Payment ID: {order.razorpayPaymentId}</div>}
          {order.razorpayRefundId && <div className="text-xs text-zinc-400">Refund ID: {order.razorpayRefundId}</div>}

          <div className="space-y-2 pt-2">
            {isPendingPayment && isOwner && (
              <Button className="w-full" variant="danger" loading={actionLoading} onClick={cancelPayment}>Cancel payment</Button>
            )}
            {canCancel && (
              <Button className="w-full" variant="danger" loading={actionLoading} onClick={cancel}>Cancel order</Button>
            )}
            {isAdmin && order.status === 'pending' && (
              <>
                <Button className="w-full" loading={actionLoading} onClick={() => updateStatus('shipped')}>Mark shipped</Button>
                <Button className="w-full" variant="danger" loading={actionLoading} onClick={() => updateStatus('cancelled')}>Cancel & refund</Button>
              </>
            )}
            {isAdmin && order.status === 'shipped' && (
              <Button className="w-full" loading={actionLoading} onClick={() => updateStatus('delivered')}>Mark delivered</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
