import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { getErrorMessage } from '../utils/errors';
import { formatINR, formatDate, shortId } from '../utils/format';
import { STATUS_LABEL, PAYMENT_LABEL } from '../utils/constants';
import type { Order } from '../types';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/orders/mine')
      .then((r) => setOrders(r.data.orders))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-8 text-red-600">{error}</div>;
  if (orders.length === 0) return <div className="mx-auto max-w-6xl px-4 py-8"><EmptyState title="No orders yet" description="Your orders will appear here." /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold">My orders</h1>
      {orders.map((o) => (
        <Link key={o._id} to={`/orders/${o._id}`} className="block rounded-xl border border-zinc-200 p-4 transition hover:shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{shortId(o._id)}</p>
              <p className="text-sm text-zinc-500">{formatDate(o.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="info">{PAYMENT_LABEL[o.paymentStatus] ?? o.paymentStatus}</Badge>
              <Badge tone={o.status === 'cancelled' ? 'danger' : o.status === 'delivered' ? 'success' : 'neutral'}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
              <span className="font-bold">{formatINR(o.totalPrice)}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
