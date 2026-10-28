import type { Request, Response } from 'express';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createOrder,
  verifyPayment,
  cancelPayment,
  cancelOrder,
} from '../services/order.service.js';

export async function create(req: Request, res: Response) {
  const result = await createOrder(String(req.user!._id), req.body);
  res.status(201).json(result);
}

export async function verify(req: Request, res: Response) {
  const order = await verifyPayment(String(req.user!._id), String(req.params.id), req.body);
  res.json({ order });
}

export async function cancelPay(req: Request, res: Response) {
  const order = await cancelPayment(String(req.user!._id), String(req.params.id));
  res.json({ order });
}

export async function mine(req: Request, res: Response) {
  const orders = await Order.find({ user: String(req.user!._id) }).sort({ createdAt: -1 });
  res.json({ orders });
}

export async function detail(req: Request, res: Response) {
  const order = await Order.findById(String(req.params.id)).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');
  const isOwner = String((order.user as { _id?: unknown })?._id ?? order.user) === String(req.user!._id);
  if (!isOwner && req.user!.role !== 'admin') throw new ApiError(403, 'Forbidden');
  res.json({ order });
}

export async function cancel(req: Request, res: Response) {
  const order = await cancelOrder(String(req.user!._id), String(req.params.id), req.user!.role === 'admin');
  res.json({ order });
}
