import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, verifyPaymentSchema } from '../validators/order.js';
import { create, verify, cancelPay, mine, detail, cancel } from '../controllers/order.controller.js';

const r = Router();
r.use(protect);
r.post('/', validate(createOrderSchema), create);
r.get('/mine', mine);
r.get('/:id', detail);
r.post('/:id/verify-payment', validate(verifyPaymentSchema), verify);
r.post('/:id/cancel-payment', cancelPay);
r.patch('/:id/cancel', cancel);
export default r;
