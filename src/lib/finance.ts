export const OPEX_CATEGORIES = [
  "Advertising",
  "Hosting",
  "Domain",
  "Packaging",
  "Delivery",
  "Platform Fees",
  "Other",
] as const;

export const REVENUE_SOURCES = ["Dyqani Online", "Porosi Private"] as const;

export type OpexCategory = (typeof OPEX_CATEGORIES)[number];
export type RevenueSource = (typeof REVENUE_SOURCES)[number];

export type OpExpense = {
  id: string;
  description: string;
  category: OpexCategory;
  amount: number;
  date: string; // yyyy-mm-dd
  notes?: string;
  createdAt: string;
};

export type RevenueEntry = {
  id: string;
  description: string;
  source: RevenueSource;
  revenue: number;
  productCost: number;
  shippingCost: number;
  collected: boolean;
  date: string; // yyyy-mm-dd
  notes?: string;
  createdAt: string;
};

const OPEX_KEY = "ksho.opex.v1";
const REVENUE_KEY = "ksho.revenue.v1";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const loadOpExpenses = () => read<OpExpense>(OPEX_KEY);
export const saveOpExpenses = (v: OpExpense[]) => write(OPEX_KEY, v);
export const loadRevenue = () => read<RevenueEntry>(REVENUE_KEY);
export const saveRevenue = (v: RevenueEntry[]) => write(REVENUE_KEY, v);

export function grossProfit(entries: RevenueEntry[]) {
  return entries.reduce((s, e) => s + e.revenue - e.productCost - e.shippingCost, 0);
}
