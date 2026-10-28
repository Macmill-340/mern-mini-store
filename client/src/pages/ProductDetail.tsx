import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { QuantityStepper } from '../components/ui/QuantityStepper';
import { Button } from '../components/ui/Button';
import { getErrorMessage } from '../utils/errors';
import { toast } from 'react-hot-toast';
import type { Product } from '../types';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then((r) => setProduct(r.data.product))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (error || !product) return <div className="mx-auto max-w-6xl px-4 py-8"><EmptyState title="Product not found" description={error} /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="text-sm text-zinc-500 hover:text-emerald-600">← Back to shop</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div className="space-y-4">
          <span className="text-xs font-medium uppercase text-zinc-500">{product.category}</span>
          <h1 className="text-3xl font-bold text-zinc-900">{product.name}</h1>
          <p className="text-2xl font-bold text-emerald-600">{formatINR(product.price)}</p>
          <p className="text-zinc-600">{product.description}</p>
          <p className="text-sm text-zinc-500">Stock: {product.stock}</p>
          {product.stock > 0 ? (
            <div className="flex items-center gap-3">
              <QuantityStepper value={qty} max={product.stock} onChange={setQty} />
              <Button onClick={() => { addItem(product, qty); toast.success('Added to cart'); }}>Add to cart</Button>
            </div>
          ) : (
            <Button disabled>Out of stock</Button>
          )}
        </div>
      </div>
    </div>
  );
}
