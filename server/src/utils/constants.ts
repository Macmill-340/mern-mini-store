export const CATEGORIES = ['Electronics', 'Apparel', 'Home', 'Accessories', 'Books'] as const;
export type Category = (typeof CATEGORIES)[number];

export const ORDER_STATUSES = ['pending_payment', 'pending', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['COD', 'RAZORPAY'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['cod', 'pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const RESERVATION_MINUTES = 15;
export const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
