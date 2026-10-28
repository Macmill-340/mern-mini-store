import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

interface JwtPayload {
  sub: string;
  role: string;
}

export function signToken(userId: string, role: string) {
  return jwt.sign({ sub: userId, role } satisfies JwtPayload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
