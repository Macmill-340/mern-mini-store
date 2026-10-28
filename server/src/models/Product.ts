import { Schema, model } from 'mongoose';
import { CATEGORIES } from '../utils/constants.js';

export interface IProduct {
  name: string;
  description: string;
  price: number;
  image: string;
  category: (typeof CATEGORIES)[number];
  stock: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    price: { type: Number, required: true, min: 1 },
    image: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: CATEGORIES },
    stock: { type: Number, required: true, min: 0, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

productSchema.index({ category: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

export const Product = model<IProduct>('Product', productSchema);
