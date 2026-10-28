import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/format';
import { EmptyState } from '../components/ui/EmptyState';
import { QuantityStepper } from '../components/ui/QuantityStepper';
import { Button } from '../components/ui/Button';

export default function Cart() {
  const { items, setQty, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <EmptyState title="Your cart is empty" description="Add some products to get started." actionLabel="Shop now" onAction={() => (window.location.href = '/')} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Cart</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 rounded-xl border border-zinc-200 p-4">
              <img src={item.image} alt={item.name} className="h-20 w-20 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-medium text-zinc-900">{item.name}</p>
                <p className="text-sm text-zinc-500">{formatINR(item.price)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <QuantityStepper value={item.qty} max={item.stock} onChange={(n) => setQty(item.productId, n)} />
                  <button onClick={() => removeItem(item.productId)} aria-label={`Remove ${item.name} from cart`} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {item.qty === item.stock && <p className="mt-1 text-xs text-amber-600">Max stock reached</p>}
              </div>
              <div className="font-semibold">{formatINR(item.price * item.qty)}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div className="mt-1 flex justify-between text-sm"><span>Shipping</span><span>Free</span></div>
          <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4 text-lg font-bold"><span>Total</span><span>{formatINR(subtotal)}</span></div>
          <Link to="/checkout" className="mt-4 block">
            <Button className="w-full">Proceed to checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
