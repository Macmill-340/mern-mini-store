import { z } from 'zod';
import { CATEGORIES } from '../utils/constants.js';

const productFields = {
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(2000),
  price: z.number().min(1).transform((v) => Math.round(v * 100) / 100),
  image: z.string().url(),
  category: z.enum(CATEGORIES),
  stock: z.number().int().min(0),
  featured: z.boolean().optional(),
};

export const productSchema = z.object({
  ...productFields,
  featured: productFields.featured.default(false),
});

export const productUpdateSchema = z.object(productFields).partial();

export const productQuerySchema = z.object({
  keyword: z.string().trim().max(60).optional(),
  category: z.enum([...CATEGORIES, 'All']).optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'name']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(48).optional(),
});
