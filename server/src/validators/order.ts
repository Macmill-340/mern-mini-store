import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../utils/constants.js';

const shippingSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^\+?[0-9]{8,15}$/),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(12),
});

export const createOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1), qty: z.number().int().min(1).max(99) }))
    .min(1)
    .max(20),
  shippingAddress: shippingSchema,
  paymentMethod: z.enum(PAYMENT_METHODS),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['shipped', 'delivered', 'cancelled']),
});

export const adminOrderQuerySchema = z.object({
  status: z.enum(['all', ...ORDER_STATUSES]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
