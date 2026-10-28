import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

if (
  (env.RAZORPAY_KEY_ID && !env.RAZORPAY_KEY_SECRET) ||
  (!env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)
) {
  console.error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set together');
  process.exit(1);
}

export const razorpayEnabled = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
