import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import configRoutes from './routes/config.routes.js';
import { errorHandler } from './middleware/error.js';

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/config', configRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);

export default app;
