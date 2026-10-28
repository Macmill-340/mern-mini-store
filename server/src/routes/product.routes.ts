import { Router } from 'express';
import { list, detail } from '../controllers/product.controller.js';
import { validate } from '../middleware/validate.js';
import { productQuerySchema } from '../validators/product.js';

const r = Router();
r.get('/', validate(productQuerySchema, 'query'), list);
r.get('/:id', detail);
export default r;
