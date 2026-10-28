import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../../api/client';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/errors';
import { formatINR } from '../../utils/format';
import { toast } from 'react-hot-toast';
import type { Product } from '../../types';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/admin/products')
      .then((r) => setProducts(r.data.products))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Deleted');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  if (loading) return <PageLoader />;
  if (error) return <div className="mx-auto max-w-6xl px-4 py-8 text-red-600">{error}</div>;

  const filtered = products.filter((p) => {
    const term = keyword.trim().toLowerCase();
    return !term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link to="/admin/products/new"><Button>Add product</Button></Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by name or category..."
          aria-label="Search products"
          className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {products.length === 0 ? (
        <EmptyState title="No products" description="Create your first product." actionLabel="Add product" onAction={() => (window.location.href = '/admin/products/new')} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching products" description="Try a different search term." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left">
              <tr>
                <th className="p-3">Image</th>
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id} className="border-t border-zinc-100">
                  <td className="p-3"><img src={p.image} alt={p.name} className="h-12 w-12 rounded object-cover" /></td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">{p.category}</td>
                  <td className="p-3">{formatINR(p.price)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Link to={`/admin/products/${p._id}/edit`}><Button variant="secondary" className="px-2 py-1 text-xs">Edit</Button></Link>
                      <Button variant="danger" className="px-2 py-1 text-xs" onClick={() => remove(p._id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
