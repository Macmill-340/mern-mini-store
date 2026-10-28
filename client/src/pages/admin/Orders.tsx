import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { PageLoader } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/product/Pagination';
import { getErrorMessage } from '../../utils/errors';
import { formatINR, formatDate, shortId } from '../../utils/format';
import { STATUS_LABEL, PAYMENT_LABEL } from '../../utils/constants';
import type { Order } from '../../types';

const STATUSES = ['all', 'pending_payment', 'pending', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ status, limit: '20', page: String(page) });
    api
      .get(`/admin/orders?${params}`)
      .then((r) => {
        setOrders(r.data.orders);
        setPages(r.data.pages);
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, page]);

  if (loading) return <PageLoader />;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-8 text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter orders by status" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All' : STATUS_LABEL[s] ?? s}</option>)}
        </select>
      </div>

      {orders.length === 0 ? (
        <p className="text-zinc-500">No orders.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Total</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const u = typeof o.user === 'string' ? null : o.user;
                return (
                  <tr key={o._id} className="border-t border-zinc-100">
                    <td className="p-3 font-medium">{shortId(o._id)}</td>
                    <td className="p-3">{u?.name ?? '—'}</td>
                    <td className="p-3">{formatDate(o.createdAt)}</td>
                    <td className="p-3"><Badge tone="info">{PAYMENT_LABEL[o.paymentStatus]}</Badge></td>
                    <td className="p-3"><Badge tone={o.status === 'cancelled' ? 'danger' : o.status === 'delivered' ? 'success' : 'neutral'}>{STATUS_LABEL[o.status]}</Badge></td>
                    <td className="p-3 font-semibold">{formatINR(o.totalPrice)}</td>
                    <td className="p-3"><Link to={`/orders/${o._id}`} className="text-emerald-600 hover:underline">View</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} onChange={setPage} />
    </div>
  );
}
