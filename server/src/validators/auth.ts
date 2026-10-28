import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(72),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1).max(72),
});
