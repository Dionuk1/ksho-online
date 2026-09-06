import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { orderTotal, type Order } from "./orders";
import type { OpExpense, RevenueEntry } from "./finance";

export type ReportPayload = {
  rangeLabel: string;
  orders: Order[];
  expenses: OpExpense[];
  revenue: RevenueEntry[];
  monthly: {
    month: string;
    spending: number;
    revenue: number;
    costs: number;
    profit: number;
  }[];
};

const r2 = (n: number) => Math.round(n * 100) / 100;
const eur = (n: number) => `EUR ${r2(n).toFixed(2)}`;

export function buildSummary({ orders, expenses, revenue }: ReportPayload) {
  const spending = orders.reduce((s, o) => s + orderTotal(o), 0);
  const productCosts = orders.reduce((s, o) => s + o.price * o.quantity, 0);
  const shipping = orders.reduce((s, o) => s + o.shipping, 0);
  const discounts = orders.reduce((s, o) => s + o.discount, 0);
  const grossRevenue = revenue.reduce((s, e) => s + e.revenue, 0);
  const collected = revenue.filter((e) => e.collected).reduce((s, e) => s + e.revenue, 0);
  const pending = grossRevenue - collected;
  const revProductCosts = revenue.reduce((s, e) => s + e.productCost, 0);
  const revShipping = revenue.reduce((s, e) => s + e.shippingCost, 0);
  const opex = expenses.reduce((s, e) => s + e.amount, 0);
  const gross = grossRevenue - revProductCosts - revShipping;
  const net = gross - opex;
  return {
    spending,
    productCosts,
    shipping,
    discounts,
    orderCount: orders.length,
    avgOrder: orders.length ? spending / orders.length : 0,
    grossRevenue,
    collected,
    pending,
    revProductCosts,
    revShipping,
    opex,
    gross,
    net,
    margin: grossRevenue > 0 ? (net / grossRevenue) * 100 : 0,
  };
}

export function exportReportToExcel(payload: ReportPayload, filename = "ksho-report.xlsx") {
  const s = buildSummary(payload);
  const wb = XLSX.utils.book_new();

  const summary: (string | number)[][] = [
    ["KSHO — Raport financiar"],
    ["Periudha", payload.rangeLabel],
    ["Gjeneruar", new Date().toLocaleString()],
    [],
    ["SHPENZIMET PERSONALE"],
    ["Shpenzimet totale", r2(s.spending)],
    ["Kostot e produkteve", r2(s.productCosts)],
    ["Kostot e transportit", r2(s.shipping)],
    ["Zbritjet totale", r2(s.discounts)],
    ["Numri i porosive", s.orderCount],
    ["Shpenzimi mesatar / porosi", r2(s.avgOrder)],
    [],
    ["FINANCAT"],
    ["Xhiroja bruto", r2(s.grossRevenue)],
    ["Të arkëtuara", r2(s.collected)],
    ["Në pritje arkëtimi", r2(s.pending)],
    ["Kostot e produkteve", r2(s.revProductCosts)],
    ["Kostot e postës", r2(s.revShipping)],
    ["Shpenzime operative", r2(s.opex)],
    ["Fitimi bruto", r2(s.gross)],
    ["Fitimi neto real", r2(s.net)],
    ["Marzhi neto %", r2(s.margin)],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary["!cols"] = [{ wch: 30 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Financial Summary");

  const wsMonthly = XLSX.utils.json_to_sheet(
    payload.monthly.map((m) => ({
      Muaji: m.month,
      "Shpenzime personale": r2(m.spending),
      Xhiro: r2(m.revenue),
      Kosto: r2(m.costs),
      "Fitim neto": r2(m.profit),
    })),
  );
  wsMonthly["!cols"] = [{ wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsMonthly, "Monthly Summary");

  const wsOrders = XLSX.utils.json_to_sheet(
    payload.orders.map((o) => ({
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
      Tracking: o.tracking ?? "",
      Notes: o.notes ?? "",
    })),
  );
  XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

  const wsOpex = XLSX.utils.json_to_sheet(
    payload.expenses.map((e) => ({
      Date: e.date,
      Description: e.description,
      Category: e.category,
      Amount: e.amount,
      Notes: e.notes ?? "",
    })),
  );
  XLSX.utils.book_append_sheet(wb, wsOpex, "Operational Expenses");

  const wsRevenue = XLSX.utils.json_to_sheet(
    payload.revenue.map((e) => ({
      Date: e.date,
      Description: e.description,
      Source: e.source,
      Revenue: e.revenue,
      "Product Cost": e.productCost,
      "Shipping Cost": e.shippingCost,
      "Gross Profit": r2(e.revenue - e.productCost - e.shippingCost),
      Collected: e.collected ? "Yes" : "No",
    })),
  );
  XLSX.utils.book_append_sheet(wb, wsRevenue, "Revenue");

  XLSX.writeFile(wb, filename);
}

export function exportReportToPdf(payload: ReportPayload, filename = "ksho-report.pdf") {
  const s = buildSummary(payload);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const brand: [number, number, number] = [214, 40, 40];

  doc.setFillColor(...brand);
  doc.rect(0, 0, 595, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("KSHO — Raport Financiar", 40, 34);
  doc.setFontSize(10);
  doc.text(`Periudha: ${payload.rangeLabel}`, 40, 52);
  doc.text(`Gjeneruar: ${new Date().toLocaleString()}`, 380, 52);
  doc.setTextColor(20, 20, 20);

  autoTable(doc, {
    startY: 92,
    head: [["Shpenzimet personale", "Vlera"]],
    body: [
      ["Shpenzimet totale", eur(s.spending)],
      ["Kostot e produkteve", eur(s.productCosts)],
      ["Kostot e transportit", eur(s.shipping)],
      ["Zbritjet totale", eur(s.discounts)],
      ["Numri i porosive", String(s.orderCount)],
      ["Shpenzimi mesatar / porosi", eur(s.avgOrder)],
    ],
    headStyles: { fillColor: brand },
    styles: { fontSize: 10 },
  });

  autoTable(doc, {
    head: [["Financat", "Vlera"]],
    body: [
      ["Xhiroja bruto", eur(s.grossRevenue)],
      ["Të arkëtuara", eur(s.collected)],
      ["Në pritje arkëtimi", eur(s.pending)],
      ["Kostot e produkteve", eur(s.revProductCosts)],
      ["Kostot e postës", eur(s.revShipping)],
      ["Shpenzime operative", eur(s.opex)],
      ["Fitimi bruto", eur(s.gross)],
      ["Fitimi neto real", eur(s.net)],
      ["Marzhi neto", `${r2(s.margin).toFixed(1)}%`],
    ],
    headStyles: { fillColor: [237, 137, 54] },
    styles: { fontSize: 10 },
  });

  if (payload.monthly.length) {
    autoTable(doc, {
      head: [["Muaji", "Shpenzime", "Xhiro", "Kosto", "Fitim neto"]],
      body: payload.monthly.map((m) => [
        m.month,
        eur(m.spending),
        eur(m.revenue),
        eur(m.costs),
        eur(m.profit),
      ]),
      headStyles: { fillColor: [30, 41, 82] },
      styles: { fontSize: 9 },
    });
  }

  doc.save(filename);
}
