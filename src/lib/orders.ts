export const PLATFORMS = ["AliExpress", "GjirafaMall", "Facebook", "Other"] as const;
export const PAYMENT_METHODS = ["Card", "Apple Pay", "Cash"] as const;
export const STATUSES = ["Ordered", "In Transit", "Received", "Cancelled", "Returned"] as const;
export const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home",
  "Tools",
  "Beauty",
  "Sports",
  "Toys",
  "Other",
] as const;

export type Platform = (typeof PLATFORMS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type OrderStatus = (typeof STATUSES)[number];

export type Order = {
  id: string;
  platform: Platform;
  productName: string;
  category: string;
  quantity: number;
  price: number;
  shipping: number;
  discount: number;
  date: string; // yyyy-mm-dd
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  orderId?: string;
  url?: string;
  tracking?: string;
  notes?: string;
  createdAt: string;
};

export function orderTotal(o: {
  price: number;
  quantity: number;
  shipping: number;
  discount: number;
}) {
  const total = o.price * o.quantity + o.shipping - o.discount;
  return Math.round(total * 100) / 100;
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

export function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const KEY = "ksho.orders.v1";

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(orders));
}
