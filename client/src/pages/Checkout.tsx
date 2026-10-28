import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useRazorpay } from '../hooks/useRazorpay';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatINR } from '../utils/format';
import { getErrorMessage, getFieldErrors } from '../utils/errors';
import { toast } from 'react-hot-toast';
import type { StoreConfig, ShippingAddress } from '../types';

const empty: ShippingAddress = { fullName: '', phone: '', address: '', city: '', postalCode: '' };

export default function Checkout() {
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const { openCheckout, loading: rzLoading } = useRazorpay();
  const navigate = useNavigate();
  const [form, setForm] = useState<ShippingAddress>({ ...empty, fullName: user?.name ?? '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('COD');
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/config').then((r) => setConfig(r.data)).catch(() => setConfig({ currency: 'INR', razorpayEnabled: false }));
  }, []);

  useEffect(() => {
    if (user?.name) setForm((f) => ({ ...f, fullName: f.fullName || user.name }));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        shippingAddress: form,
        paymentMethod,
      };
      const r = await api.post('/orders', payload);
      const order = r.data.order;

      if (paymentMethod === 'COD') {
        clear();
        toast.success('Order placed');
        navigate(`/orders/${order._id}`);
        return;
      }

      const payment = r.data.payment;
      try {
        const response = await openCheckout({
          key: payment.keyId,
          amount: payment.amount,
          currency: payment.currency,
          name: 'MERN Store',
          description: `Order ${order._id.slice(-8).toUpperCase()}`,
          order_id: payment.razorpayOrderId,
          prefill: { name: form.fullName, email: user?.email, contact: form.phone },
          theme: { color: '#059669' },
          onDismiss: async () => {
            try { await api.post(`/orders/${order._id}/cancel-payment`); } catch { /* ignore */ }
          },
        });

        await api.post(`/orders/${order._id}/verify-payment`, {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        clear();
        toast.success('Payment successful');
        navigate(`/orders/${order._id}`);
      } catch (err) {
        try { await api.post(`/orders/${order._id}/cancel-payment`); } catch { /* ignore */ }
        toast.error(getErrorMessage(err, 'Payment failed'));
      }
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return <div className="mx-auto max-w-6xl px-4 py-8"><p className="text-zinc-600">Your cart is empty.</p></div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-zinc-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Shipping address</h2>
            <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName || errors['shippingAddress.fullName']} required />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone || errors['shippingAddress.phone']} required />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={errors.address || errors['shippingAddress.address']} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} error={errors.city || errors['shippingAddress.city']} required />
              <Input label="Postal code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} error={errors.postalCode || errors['shippingAddress.postalCode']} required />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 p-6 space-y-3">
            <h2 className="text-lg font-semibold">Payment method</h2>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3">
              <input type="radio" name="pm" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
              <div>
                <p className="font-medium">Cash on Delivery</p>
                <p className="text-xs text-zinc-500">Pay when you receive the order.</p>
              </div>
            </label>
            {config?.razorpayEnabled && (
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 p-3">
                <input type="radio" name="pm" checked={paymentMethod === 'RAZORPAY'} onChange={() => setPaymentMethod('RAZORPAY')} />
                <div>
                  <p className="font-medium">UPI / Card (Razorpay)</p>
                  <p className="text-xs text-zinc-500">Test mode · UPI, cards, netbanking.</p>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between">
                <span>{i.name} × {i.qty}</span>
                <span>{formatINR(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-zinc-200 pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <Button type="submit" className="mt-4 w-full" loading={submitting || rzLoading}>
            {paymentMethod === 'COD' ? 'Place order (COD)' : 'Pay now'}
          </Button>
        </div>
      </form>
    </div>
  );
}
