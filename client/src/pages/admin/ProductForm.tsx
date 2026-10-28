import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { Input, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { toast } from 'react-hot-toast';
import { CATEGORIES } from '../../utils/constants';

const empty = { name: '', description: '', price: '', image: '', category: 'Electronics', stock: '', featured: false };

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/products/${id}`)
      .then((r) => {
        const p = r.data.product;
        setForm({
          name: p.name,
          description: p.description,
          price: String(p.price),
          image: p.image,
          category: p.category,
          stock: String(p.stock),
          featured: p.featured,
        });
      })
      .catch((e) => toast.error(getErrorMessage(e)))
      .finally(() => setInitialLoading(false));
  }, [id, isEdit]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const body = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      image: form.image,
      category: form.category,
      stock: Number(form.stock),
      featured: form.featured,
    };
    try {
      if (isEdit) await api.put(`/admin/products/${id}`, body);
      else await api.post('/admin/products', body);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate('/admin/products');
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-10 text-center">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{isEdit ? 'Edit product' : 'New product'}</h1>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
        <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} error={errors.description} rows={4} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Price (INR)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} error={errors.price} required min={1} step="0.01" />
          <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} error={errors.stock} required min={0} />
        </div>
        <Input label="Image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} error={errors.image} required />
        {form.image && (
          <div className="overflow-hidden rounded-lg border border-zinc-200">
            <img src={form.image} alt="preview" className="h-48 w-full object-cover" onLoad={(e) => (e.currentTarget.style.display = 'block')} onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>
        )}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {CATEGORIES.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          Featured
        </label>
        <div className="flex gap-2">
          <Button type="submit" loading={loading}>{isEdit ? 'Save changes' : 'Create product'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
