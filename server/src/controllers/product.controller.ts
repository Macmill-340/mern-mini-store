import type { Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

export async function list(req: Request, res: Response) {
  const q = req.query as Record<string, string | undefined>;
  const filter: Record<string, unknown> = {};
  if (q.keyword) {
    const safe = q.keyword.slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: { $regex: safe, $options: 'i' } }, { description: { $regex: safe, $options: 'i' } }];
  }
  if (q.category && q.category !== 'All') filter.category = q.category;
  const lim = Math.min(Number(q.limit) || 12, 48);
  const pg = Math.max(Number(q.page) || 1, 1);
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    name: { name: 1 },
  };
  const sortSpec = sortMap[q.sort ?? 'newest'] ?? { createdAt: -1 };
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortSpec).skip((pg - 1) * lim).limit(lim),
    Product.countDocuments(filter),
  ]);
  res.json({ products, page: pg, pages: Math.ceil(total / lim) || 1, total });
}

export async function detail(req: Request, res: Response) {
  const p = await Product.findById(req.params.id);
  if (!p) throw new ApiError(404, 'Product not found');
  res.json({ product: p });
}
