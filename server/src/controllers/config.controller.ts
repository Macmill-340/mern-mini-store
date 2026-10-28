import type { Request, Response } from 'express';
import { env, razorpayEnabled } from '../config/env.js';

export function getConfig(_req: Request, res: Response) {
  res.json({
    currency: 'INR',
    razorpayEnabled,
    razorpayKeyId: razorpayEnabled ? env.RAZORPAY_KEY_ID : undefined,
  });
}
