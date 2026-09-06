import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  ComposedChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Banknote,
  Coins,
  CreditCard,
  FileDown,
  FileSpreadsheet,
  Package,
  Pencil,
  Percent,
  Plus,
  Receipt,
  ShoppingBag,
  TicketPercent,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { OpExpenseDialog } from "@/components/OpExpenseDialog";
import { RevenueDialog } from "@/components/RevenueDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate, orderTotal } from "@/lib/orders";
import { useOrders } from "@/lib/use-orders";
import { useOpExpenses, useRevenue } from "@/lib/use-finance";
import { inRange } from "@/lib/date-range";
import type { OpExpense, RevenueEntry } from "@/lib/finance";
import { buildSummary, exportReportToExcel, exportReportToPdf } from "@/lib/export-reports";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Raportet — KSHO Online Expense Tracker" },
      {
        name: "description",
        content:
          "Analiza e shpenzimeve online, xhiroja, kostot operative dhe fitimi neto real sipas periudhës së zgjedhur.",
      },
      { property: "og:title", content: "Raportet — KSHO Online Expense Tracker" },
      {
        property: "og:description",
        content: "Analiza mujore e shpenzimeve, xhiros dhe fitimit neto real në KSHO.",
      },
    ],
  }),
  component: ReportsPage,
});

type Preset = "today" | "week" | "month" | "lastMonth" | "all" | "custom";

const PRESET_LABELS: Record<Preset, string> = {
  today: "Sot",
  week: "Këtë Javë",
  month: "Këtë Muaj",
  lastMonth: "Muajin e Kaluar",
  all: "Të Gjitha",
  custom: "Periudhë e zgjedhur",
};

function iso(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

function presetRange(p: Preset): { from?: string; to?: string } {
  const now = new Date();
  const today = iso(now);
  switch (p) {
    case "today":
      return { from: today, to: today };
    case "week": {
      const day = (now.getDay() + 6) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      return { from: iso(start), to: today };
    }
    case "month":
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    case "lastMonth":
      return {
        from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    default:
      return {};
  }
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  const names = [
    "Jan",
    "Shk",
    "Mar",
    "Pri",
    "Maj",
    "Qer",
    "Kor",
    "Gsh",
    "Sht",
    "Tet",
    "Nën",
    "Dhj",
  ];
  return `${names[Number(m) - 1]} ${y.slice(2)}`;
};

function ReportsPage() {
  const { orders, loading: ordersLoading } = useOrders();
  const { expenses, deleteExpense } = useOpExpenses();
  const { revenue, deleteRevenue } = useRevenue();

  const [preset, setPreset] = useState<Preset>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [opexOpen, setOpexOpen] = useState(false);
  const [editingOpex, setEditingOpex] = useState<OpExpense | null>(null);
  const [deletingOpex, setDeletingOpex] = useState<OpExpense | null>(null);
  const [revOpen, setRevOpen] = useState(false);
  const [editingRev, setEditingRev] = useState<RevenueEntry | null>(null);
  const [deletingRev, setDeletingRev] = useState<RevenueEntry | null>(null);

  const range = preset === "custom" ? { from, to } : presetRange(preset);
  const rangeLabel =
    preset === "all"
      ? "Të gjitha të dhënat"
      : `${range.from ? formatDate(range.from) : "…"} – ${range.to ? formatDate(range.to) : "…"}`;

  const f = <T extends { date: string }>(items: T[]) =>
    items.filter((i) => inRange(i.date, range.from || undefined, range.to || undefined));

  const fOrders = useMemo(() => f(orders), [orders, range.from, range.to]);
  const fExpenses = useMemo(() => f(expenses), [expenses, range.from, range.to]);
  const fRevenue = useMemo(() => f(revenue), [revenue, range.from, range.to]);

  const s = useMemo(
    () =>
      buildSummary({
        rangeLabel,
        orders: fOrders,
        expenses: fExpenses,
        revenue: fRevenue,
        monthly: [],
      }),
    [fOrders, fExpenses, fRevenue, rangeLabel],
  );

  const groupBy = (key: (o: (typeof fOrders)[number]) => string) => {
    const map = new Map<string, number>();
    for (const o of fOrders) map.set(key(o), (map.get(key(o)) ?? 0) + orderTotal(o));
    return [...map.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  };

  const byPlatform = useMemo(() => groupBy((o) => o.platform), [fOrders]);
  const byCategory = useMemo(() => groupBy((o) => o.category), [fOrders]);
  const byPayment = useMemo(() => groupBy((o) => o.paymentMethod), [fOrders]);

  const monthly = useMemo(() => {
    const map = new Map<
      string,
      { month: string; spending: number; revenue: number; costs: number; profit: number }
    >();
    const get = (k: string) => {
      if (!map.has(k))
        map.set(k, { month: k, spending: 0, revenue: 0, costs: 0, profit: 0 });
      return map.get(k)!;
    };
    for (const o of fOrders) get(o.date.slice(0, 7)).spending += orderTotal(o);
    for (const e of fRevenue) {
      const row = get(e.date.slice(0, 7));
      row.revenue += e.revenue;
      row.costs += e.productCost + e.shippingCost;
    }
    for (const e of fExpenses) get(e.date.slice(0, 7)).costs += e.amount;
    return [...map.values()]
      .map((r) => ({
        ...r,
        spending: Math.round(r.spending * 100) / 100,
        revenue: Math.round(r.revenue * 100) / 100,
        costs: Math.round(r.costs * 100) / 100,
        profit: Math.round((r.revenue - r.costs) * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [fOrders, fRevenue, fExpenses]);

  const composition = [
    { name: "Produkte", value: Math.round(s.productCosts * 100) / 100 },
    { name: "Transport", value: Math.round(s.shipping * 100) / 100 },
    { name: "Zbritje", value: Math.round(s.discounts * 100) / 100 },
  ];
  const shippingPct = s.spending > 0 ? (s.shipping / s.spending) * 100 : 0;

  const bySource = useMemo(() => {
    const map = new Map<string, { revenue: number; profit: number; count: number }>();
    for (const e of fRevenue) {
      const row = map.get(e.source) ?? { revenue: 0, profit: 0, count: 0 };
      row.revenue += e.revenue;
      row.profit += e.revenue - e.productCost - e.shippingCost;
      row.count += 1;
      map.set(e.source, row);
    }
    return [...map.entries()].map(([name, v]) => ({ name, ...v }));
  }, [fRevenue]);

  const payload = {
    rangeLabel,
    orders: fOrders,
    expenses: fExpenses,
    revenue: fRevenue,
    monthly,
  };

  const hasAnything = fOrders.length + fExpenses.length + fRevenue.length > 0;

  if (ordersLoading) {
    return (
      <AppShell title="Raportet">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Raportet"
      subtitle="Analiza e shpenzimeve, xhiros dhe fitimit real sipas periudhës."
    >
      <div className="space-y-6">
        {/* Date filter */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap gap-2">
              {(["today", "week", "month", "lastMonth", "all"] as Preset[]).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={preset === p ? "default" : "outline"}
                  onClick={() => setPreset(p)}
                >
                  {PRESET_LABELS[p]}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="rep-from">Nga</Label>
                <Input
                  id="rep-from"
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPreset("custom");
                  }}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="rep-to">Deri</Label>
                <Input
                  id="rep-to"
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPreset("custom");
                  }}
                />
              </div>
              <div className="flex items-end">
                <p className="rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Periudha: </span>
                  <span className="font-medium">{rangeLabel}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportReportToExcel(payload);
                  toast.success("Raporti Excel u shkarkua");
                }}
                disabled={!hasAnything}
              >
                <FileSpreadsheet className="size-4" /> Eksporto Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  exportReportToPdf(payload);
                  toast.success("Raporti PDF u shkarkua");
                }}
                disabled={!hasAnything}
              >
                <FileDown className="size-4" /> Eksporto PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expense summary */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Përmbledhja e shpenzimeve</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Shpenzimet totale"
              value={formatCurrency(s.spending)}
              icon={Wallet}
              tone="primary"
            />
            <StatCard
              label="Kostot e produkteve"
              value={formatCurrency(s.productCosts)}
              icon={Package}
            />
            <StatCard
              label="Kostot e transportit"
              value={formatCurrency(s.shipping)}
              icon={Truck}
              tone="info"
            />
            <StatCard
              label="Zbritjet totale"
              value={formatCurrency(s.discounts)}
              icon={TicketPercent}
              tone="success"
            />
            <StatCard label="Numri i porosive" value={String(s.orderCount)} icon={ShoppingBag} />
            <StatCard
              label="Shpenzimi mesatar / porosi"
              value={formatCurrency(s.avgOrder)}
              icon={BarChart3}
            />
          </div>
        </section>

        {/* Expense analytics */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Analiza e shpenzimeve</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Shpenzimet sipas muajve" empty={monthly.length === 0}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthly.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} width={44} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="spending" name="Shpenzime" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Shpenzimet sipas platformës" empty={byPlatform.length === 0}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byPlatform} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byPlatform.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Shpenzimet sipas kategorisë" empty={byCategory.length === 0}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCategory} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={11}
                    width={84}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" name="Shpenzime" fill="var(--chart-2)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Shpenzimet sipas mënyrës së pagesës" empty={byPayment.length === 0}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={byPayment}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                  >
                    {byPayment.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard
              title="Produktet vs transporti vs zbritjet"
              empty={fOrders.length === 0}
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={composition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} width={44} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="value" name="Vlera" radius={[6, 6, 0, 0]}>
                    {composition.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="text-base">
                  Transporti si përqindje e shpenzimeve totale
                </CardTitle>
              </CardHeader>
              <CardContent>
                {fOrders.length === 0 ? (
                  <EmptyChart />
                ) : (
                  <div className="space-y-3">
                    <p className="text-4xl font-bold tracking-tight">{shippingPct.toFixed(1)}%</p>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, shippingPct)}%`,
                          backgroundImage: "var(--gradient-brand)",
                        }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(s.shipping)} transport nga {formatCurrency(s.spending)}{" "}
                      shpenzime totale.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Financial overview */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Pasqyra financiare</h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingRev(null);
                setRevOpen(true);
              }}
            >
              <Plus className="size-4" /> Shto të ardhura
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Xhiroja bruto"
              value={formatCurrency(s.grossRevenue)}
              icon={Banknote}
              tone="primary"
            />
            <StatCard label="Kostot e postës" value={formatCurrency(s.revShipping)} icon={Truck} />
            <StatCard
              label="Kostot e produkteve"
              value={formatCurrency(s.revProductCosts)}
              icon={Package}
            />
            <StatCard label="Shpenzime operative" value={formatCurrency(s.opex)} icon={Receipt} />
            <StatCard
              label="Fitimi neto real"
              value={formatCurrency(s.net)}
              icon={Coins}
              tone="success"
              hint="Xhiro − produkte − postë − operative"
            />
            <StatCard
              label="Marzhi neto"
              value={`${s.margin.toFixed(1)}%`}
              icon={Percent}
              tone="info"
            />
            <StatCard
              label="Të arkëtuara"
              value={formatCurrency(s.collected)}
              icon={CreditCard}
              tone="success"
            />
            <StatCard
              label="Në pritje arkëtimi"
              value={formatCurrency(s.pending)}
              icon={CreditCard}
            />
            <StatCard label="Fitimi bruto" value={formatCurrency(s.gross)} icon={BarChart3} />
          </div>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Të ardhurat e regjistruara</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fRevenue.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nuk ka të dhëna për këtë periudhë.</p>
              ) : (
                fRevenue
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((e) => (
                    <div
                      key={e.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-secondary-foreground">
                            {e.source}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 ${
                              e.collected
                                ? "bg-success/15 text-success"
                                : "bg-warning/20 text-warning-foreground"
                            }`}
                          >
                            {e.collected ? "E arkëtuar" : "Në pritje"}
                          </span>
                          <span>{formatDate(e.date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatCurrency(e.revenue)}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Ndrysho"
                          onClick={() => {
                            setEditingRev(e);
                            setRevOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Fshi"
                          onClick={() => setDeletingRev(e)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </section>

        {/* Operational expenses */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Shpenzimet Operative</h2>
            <Button
              size="sm"
              onClick={() => {
                setEditingOpex(null);
                setOpexOpen(true);
              }}
            >
              <Plus className="size-4" /> Shto Shpenzim
            </Button>
          </div>
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="space-y-3 pt-6">
              {fExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nuk ka të dhëna për këtë periudhë.</p>
              ) : (
                fExpenses
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((e) => (
                    <div
                      key={e.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.description}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-muted px-2 py-0.5">{e.category}</span>
                          <span>{formatDate(e.date)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatCurrency(e.amount)}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Ndrysho"
                          onClick={() => {
                            setEditingOpex(e);
                            setOpexOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Fshi"
                          onClick={() => setDeletingOpex(e)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </section>

        {/* Monthly analytics */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Xhiroja dhe fitimi sipas muajve</h2>
          <ChartCard title="Xhiro vs kosto vs fitim neto" empty={monthly.length === 0}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={monthly.map((m) => ({ ...m, label: monthLabel(m.month) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} width={44} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="revenue" name="Xhiro" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="costs" name="Kosto" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Fitim neto"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base">Bilanci mujor</CardTitle>
            </CardHeader>
            <CardContent>
              {monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nuk ka të dhëna për këtë periudhë.</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 pr-3">Muaji</th>
                        <th className="py-2 pr-3 text-right">Xhiro</th>
                        <th className="py-2 pr-3 text-right">Kosto</th>
                        <th className="py-2 text-right">Fitim neto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthly.map((m) => (
                        <tr key={m.month} className="border-b border-border/60 last:border-0">
                          <td className="py-2 pr-3 font-medium">{monthLabel(m.month)}</td>
                          <td className="py-2 pr-3 text-right">{formatCurrency(m.revenue)}</td>
                          <td className="py-2 pr-3 text-right">{formatCurrency(m.costs)}</td>
                          <td
                            className={`py-2 text-right font-semibold ${
                              m.profit < 0 ? "text-destructive" : "text-success"
                            }`}
                          >
                            {formatCurrency(m.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Revenue source */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Burimi i të Ardhurave</h2>
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="space-y-3 pt-6">
              {bySource.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nuk ka të dhëna për këtë periudhë.</p>
              ) : (
                bySource.map((r) => {
                  const pct = s.grossRevenue > 0 ? (r.revenue / s.grossRevenue) * 100 : 0;
                  return (
                    <div key={r.name} className="rounded-xl border border-border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{r.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(r.revenue)} · {pct.toFixed(1)}%
                        </p>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundImage: "var(--gradient-brand)" }}
                        />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Fitim: {formatCurrency(r.profit)}</span>
                        <span>Porosi: {r.count}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <OpExpenseDialog open={opexOpen} onOpenChange={setOpexOpen} expense={editingOpex} />
      <RevenueDialog open={revOpen} onOpenChange={setRevOpen} entry={editingRev} />

      <AlertDialog
        open={!!deletingOpex}
        onOpenChange={(o) => !o && setDeletingOpex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fshi shpenzimin?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deletingOpex?.description}” do të hiqet përgjithmonë.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulo</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingOpex) deleteExpense(deletingOpex.id);
                setDeletingOpex(null);
                toast.success("Shpenzimi u fshi");
              }}
            >
              Fshi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingRev} onOpenChange={(o) => !o && setDeletingRev(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fshi të ardhurat?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deletingRev?.description}” do të hiqet përgjithmonë.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulo</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingRev) deleteRevenue(deletingRev.id);
                setDeletingRev(null);
                toast.success("Të ardhurat u fshinë");
              }}
            >
              Fshi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
      <BarChart3 className="size-6 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">Ende pa të dhëna.</p>
    </div>
  );
}

function ChartCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0">{empty ? <EmptyChart /> : children}</CardContent>
    </Card>
  );
}
