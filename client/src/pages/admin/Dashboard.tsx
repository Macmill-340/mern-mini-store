import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { PageLoader } from '../../components/ui/Spinner';
import { formatINR, formatDate, shortId } from '../../utils/format';
import { STATUS_LABEL, PAYMENT_LABEL } from '../../utils/constants';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/errors';
import type { Order } from '../../types';

export default function Dashboard() {
  const [data, setData] = useState<{ stats: { products: number; orders: number; customers: number; orderValue: number }; recentOrders: Order[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((r) => setData(r.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-8 text-red-600">{error}</div>;
  if (!data) return <PageLoader />;

  const cards = [
    { label: 'Products', value: data.stats.products },
    { label: 'Orders', value: data.stats.orders },
    { label: 'Customers', value: data.stats.customers },
    { label: 'Order value', value: formatINR(data.stats.orderValue) },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-zinc-200 p-6">
            <p className="text-sm text-zinc-500">{c.label}</p>
            <p className="mt-2 text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm text-emerald-600 hover:underline">View all</Link>
        </div>
        <div className="space-y-2">
          {data.recentOrders.map((o) => (
            <Link key={o._id} to={`/orders/${o._id}`} className="flex items-center justify-between rounded-lg border border-zinc-100 p-3 hover:bg-zinc-50">
              <div>
                <p className="font-medium">{shortId(o._id)}</p>
                <p className="text-xs text-zinc-500">{formatDate(o.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone="info">{PAYMENT_LABEL[o.paymentStatus]}</Badge>
                <Badge tone="neutral">{STATUS_LABEL[o.status]}</Badge>
                <span className="font-semibold">{formatINR(o.totalPrice)}</span>
              </div>
            </Link>
          ))}
          {data.recentOrders.length === 0 && <p className="text-sm text-zinc-500">No orders yet.</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/admin/products"><Button>Manage products</Button></Link>
        <Link to="/admin/orders"><Button variant="secondary">Manage orders</Button></Link>
      </div>
    </div>
  );
}
