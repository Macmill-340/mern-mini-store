import { Router } from 'express';
import { register, login, logout, me } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const r = Router();
r.post('/register', authLimiter, validate(registerSchema), register);
r.post('/login', authLimiter, validate(loginSchema), login);
r.post('/logout', logout);
r.get('/me', protect, me);
export default r;
