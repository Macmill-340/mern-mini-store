import { Router } from 'express';
import { getConfig } from '../controllers/config.controller.js';

const r = Router();
r.get('/', getConfig);
export default r;
