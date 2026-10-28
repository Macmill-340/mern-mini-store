import { Router } from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { productSchema, productUpdateSchema } from '../validators/product.js';
import { statusUpdateSchema, adminOrderQuerySchema } from '../validators/order.js';
import * as admin from '../controllers/admin.controller.js';

const r = Router();
r.use(protect, adminOnly);
r.get('/stats', admin.stats);
r.get('/products', admin.listProducts);
r.post('/products', validate(productSchema), admin.createProduct);
r.put('/products/:id', validate(productUpdateSchema), admin.updateProduct);
r.delete('/products/:id', admin.deleteProduct);
r.get('/orders', validate(adminOrderQuerySchema, 'query'), admin.listOrders);
r.patch('/orders/:id/status', validate(statusUpdateSchema), admin.updateOrderStatus);
export default r;
