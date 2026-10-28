export const CATEGORIES = ['All', 'Electronics', 'Apparel', 'Home', 'Accessories', 'Books'] as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name' },
] as const;

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  pending: 'Pending',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const PAYMENT_LABEL: Record<string, string> = {
  cod: 'COD',
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
};
