import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message, errors: err.errors });
  }
  if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
    return res.status(409).json({ message: 'Duplicate value' });
  }
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'ValidationError') {
    const errors: Record<string, string> = {};
    const e = err as unknown as { errors: Record<string, { message: string }> };
    for (const [k, v] of Object.entries(e.errors)) errors[k] = v.message;
    return res.status(422).json({ message: 'Validation failed', errors });
  }
  if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  console.error(err);
  res.status(500).json({ message: env.NODE_ENV === 'production' ? 'Internal server error' : String(err) });
}
