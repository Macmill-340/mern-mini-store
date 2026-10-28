import { ProductCard } from './ProductCard';
import type { Product } from '../../types';

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => <ProductCard key={p._id} product={p} />)}
    </div>
  );
}
