export type Category = 'Electronics' | 'Apparel' | 'Home' | 'Accessories' | 'Books';

export type OrderStatus = 'pending_payment' | 'pending' | 'shipped' | 'delivered' | 'cancelled';

export type PaymentMethod = 'COD' | 'RAZORPAY';

export type PaymentStatus = 'cod' | 'pending' | 'paid' | 'failed' | 'refunded';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  stock: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  qty: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

export interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  qty: number;
}

export interface OrderUser {
  _id: string;
  name: string;
  email: string;
}

export interface Order {
  _id: string;
  user: string | OrderUser;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  itemsPrice: number;
  totalPrice: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
  paymentExpiresAt?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pages: number;
  total: number;
}

export interface ApiErrorShape {
  message: string;
  errors?: Record<string, string>;
}

export interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface StoreConfig {
  currency: string;
  razorpayEnabled: boolean;
  razorpayKeyId?: string;
}
