import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

function setCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already registered');
  const user = await User.create({ name, email, password, role: 'user' });
  const token = signToken(String(user._id), user.role);
  setCookie(res, token);
  res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid credentials');
  const token = signToken(String(user._id), user.role);
  setCookie(res, token);
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response) {
  const u = req.user!;
  res.json({ user: { id: u._id, name: u.name, email: u.email, role: u.role } });
}
