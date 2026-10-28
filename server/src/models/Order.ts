import { Schema, model, type Model, type Types } from 'mongoose';
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../utils/constants.js';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  image: string;
  price: number;
  qty: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  itemsPrice: number;
  totalPrice: number;
  status: (typeof ORDER_STATUSES)[number];
  paymentMethod: (typeof PAYMENT_METHODS)[number];
  paymentStatus: (typeof PAYMENT_STATUSES)[number];
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
  paymentExpiresAt?: Date;
  paidAt?: Date;
  refundedAt?: Date;
  stockRestored: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder, Model<IOrder>>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        qty: { type: Number, required: true, min: 1 },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    itemsPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpayRefundId: { type: String },
    paymentExpiresAt: { type: Date },
    paidAt: { type: Date },
    refundedAt: { type: Date },
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ razorpayOrderId: 1 });

export const Order = model<IOrder, Model<IOrder>>('Order', orderSchema);
