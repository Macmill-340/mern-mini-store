import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import type { Product } from '../../types';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:shadow-md">
      <Link to={`/products/${product._id}`} className="block">
        <div className="aspect-square overflow-hidden bg-zinc-100">
          <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-zinc-500">{product.category}</span>
          {product.stock === 0 && <Badge tone="danger">Out of stock</Badge>}
          {product.stock > 0 && product.stock <= 5 && <Badge tone="warning">Low stock</Badge>}
        </div>
        <Link to={`/products/${product._id}`} className="line-clamp-2 font-medium text-zinc-900 hover:text-emerald-600">{product.name}</Link>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-900">{formatINR(product.price)}</span>
          <Button variant="secondary" className="px-2 py-1" aria-label={`Add ${product.name} to cart`} disabled={product.stock === 0} onClick={() => { addItem(product, 1); toast.success('Added to cart'); }}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
