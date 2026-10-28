import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';

const client =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;

export const razorpayService = {
  async createOrder(amount: number, receipt: string) {
    if (!client) throw new Error('Razorpay not configured');
    return client.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt, notes: { receipt } });
  },

  verifySignature(orderId: string, paymentId: string, signature: string) {
    if (!env.RAZORPAY_KEY_SECRET) return false;
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  },

  async refund(paymentId: string, amountPaise: number) {
    if (!client) throw new Error('Razorpay not configured');
    const r = await client.payments.refund(paymentId, { amount: amountPaise });
    return r.id as string;
  },
};
