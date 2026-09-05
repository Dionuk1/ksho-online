import * as XLSX from "xlsx";
import { orderTotal, type Order } from "./orders";

export function exportOrdersToExcel(orders: Order[], filename = "ksho-orders.xlsx") {
  const rows = orders.map((o) => ({
    "Order Date": o.date,
    Product: o.productName,
    Category: o.category,
    Platform: o.platform,
    Quantity: o.quantity,
    "Original Price": o.price,
    Shipping: o.shipping,
    Discount: o.discount,
    "Final Total": orderTotal(o),
    "Payment Method": o.paymentMethod,
    Status: o.status,
    "Order ID": o.orderId ?? "",
    "Tracking Number": o.tracking ?? "",
    URL: o.url ?? "",
    Notes: o.notes ?? "",
  }));

  const totals = orders.reduce(
    (acc, o) => {
      acc.total += orderTotal(o);
      acc.shipping += o.shipping;
      acc.discount += o.discount;
      acc.items += o.quantity;
      return acc;
    },
    { total: 0, shipping: 0, discount: 0, items: 0 },
  );

  const byPlatform = new Map<string, number>();
  const byPayment = new Map<string, number>();
  const byCategory = new Map<string, number>();
  for (const o of orders) {
    const t = orderTotal(o);
    byPlatform.set(o.platform, (byPlatform.get(o.platform) ?? 0) + t);
    byPayment.set(o.paymentMethod, (byPayment.get(o.paymentMethod) ?? 0) + t);
    byCategory.set(o.category, (byCategory.get(o.category) ?? 0) + t);
  }

  const summary: (string | number)[][] = [
    ["KSHO — Expense Summary"],
    ["Generated", new Date().toLocaleString()],
    [],
    ["Total orders", orders.length],
    ["Total items", totals.items],
    ["Total spending", round(totals.total)],
    ["Total shipping", round(totals.shipping)],
    ["Total discounts", round(totals.discount)],
    ["Average order value", orders.length ? round(totals.total / orders.length) : 0],
    [],
    ["Spending by platform", ""],
    ...[...byPlatform.entries()].map(([k, v]) => [k, round(v)]),
    [],
    ["Spending by payment method", ""],
    ...[...byPayment.entries()].map(([k, v]) => [k, round(v)]),
    [],
    ["Spending by category", ""],
    ...[...byCategory.entries()].map(([k, v]) => [k, round(v)]),
  ];

  const wb = XLSX.utils.book_new();
  const wsOrders = XLSX.utils.json_to_sheet(rows);
  wsOrders["!cols"] = [
    { wch: 12 }, { wch: 32 }, { wch: 14 }, { wch: 14 }, { wch: 9 },
    { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 16 },
    { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 28 }, { wch: 30 },
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary["!cols"] = [{ wch: 28 }, { wch: 16 }];

  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");
  XLSX.writeFile(wb, filename);
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
