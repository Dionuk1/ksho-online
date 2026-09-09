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
export const CURRENCIES = ["EUR", "USD"] as const;
export const REFUND_STATUSES = ["none", "pending", "received"] as const;

export type Platform = (typeof PLATFORMS)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type OrderStatus = (typeof STATUSES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type RefundStatus = (typeof REFUND_STATUSES)[number];

/** Albanian display labels. Stored values stay in English so existing data is untouched. */
export const PLATFORM_LABELS: Record<Platform, string> = {
  AliExpress: "AliExpress",
  GjirafaMall: "GjirafaMall",
  Facebook: "Facebook",
  Other: "Tjetër",
};
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  Card: "Kartelë",
  "Apple Pay": "Apple Pay",
  Cash: "Para në dorë",
};
export const STATUS_LABELS: Record<OrderStatus, string> = {
  Ordered: "E porositur",
  "In Transit": "Në rrugë",
  Received: "E pranuar",
  Cancelled: "E anuluar",
  Returned: "E kthyer",
};
export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  Electronics: "Elektronikë",
  Clothing: "Veshje",
  Home: "Shtëpi",
  Tools: "Vegla",
  Beauty: "Bukuri",
  Sports: "Sport",
  Toys: "Lodra",
  Other: "Tjetër",
};
export const REFUND_LABELS: Record<RefundStatus, string> = {
  none: "Pa kthim",
  pending: "Refund në pritje",
  received: "Refund i pranuar",
};

/** Generic label lookup that falls back to the raw value (e.g. custom categories). */
export function label(value: string): string {
  const all: Record<string, string> = {
    ...PLATFORM_LABELS,
    ...PAYMENT_LABELS,
    ...STATUS_LABELS,
    ...CATEGORY_LABELS,
  };
  return all[value] ?? value;
}

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
  currency?: Currency; // missing = EUR (legacy orders)
  refundStatus?: RefundStatus; // missing = none
  refundAmount?: number; // amount actually refunded when status = received
  orderId?: string;
  url?: string;
  tracking?: string;
  notes?: string;
  createdAt: string;
};

export function orderCurrency(o: { currency?: Currency }): Currency {
  return o.currency ?? "EUR";
}

export function orderTotal(o: {
  price: number;
  quantity: number;
  shipping: number;
  discount: number;
}) {
  const total = o.price * o.quantity + o.shipping - o.discount;
  return Math.round(total * 100) / 100;
}

/** Refunded amount that actually came back (only when the refund is received). */
export function refundedAmount(o: Pick<Order, "refundStatus" | "refundAmount">) {
  if (o.refundStatus !== "received") return 0;
  return Math.max(0, o.refundAmount ?? 0);
}

/** Real expense after an accepted refund. The original total is never modified. */
export function realTotal(o: Order) {
  const t = orderTotal(o) - refundedAmount(o);
  return Math.round(Math.max(0, t) * 100) / 100;
}

export function formatCurrency(n: number, currency: Currency = "EUR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Sum of real totals split per currency (no conversion ever happens). */
export function sumByCurrency(orders: Order[], pick: (o: Order) => number = realTotal) {
  const out: Record<Currency, number> = { EUR: 0, USD: 0 };
  for (const o of orders) out[orderCurrency(o)] += pick(o);
  return out;
}

/** "€425.00" plus " + $30.00" when USD orders exist. */
export function formatMixed(sums: Record<Currency, number>) {
  const parts = [formatCurrency(sums.EUR, "EUR")];
  if (sums.USD) parts.push(formatCurrency(sums.USD, "USD"));
  return parts.join(" + ");
}

const MONTHS_SQ = ["jan", "shk", "mar", "pri", "maj", "qer", "kor", "gsh", "sht", "tet", "nën", "dhj"];

export function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  if (Number.isNaN(date.getTime())) return d;
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS_SQ[date.getMonth()]} ${date.getFullYear()}`;
}

export function isSafeUrl(url?: string): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
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
