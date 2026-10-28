import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/User.js';
import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';

export async function protect(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.token as string | undefined;
    if (!token) throw new ApiError(401, 'Not authenticated');
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) throw new ApiError(401, 'User not found');
    req.user = user;
    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(401, 'Not authenticated'));
  }
}

export function adminOnly(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return next(new ApiError(403, 'Admin only'));
  next();
}
