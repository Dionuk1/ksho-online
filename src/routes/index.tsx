import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Wallet,
  ShoppingBag,
  CalendarDays,
  Calculator,
  Truck,
  TicketPercent,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { StatusBadge, PlatformBadge } from "@/components/StatusBadge";
import { OrderFormDialog } from "@/components/OrderFormDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, orderTotal } from "@/lib/orders";
import { useOrders } from "@/lib/use-orders";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — KSHO Online Expense Tracker" },
      {
        name: "description",
        content:
          "Track spending from AliExpress, GjirafaMall, Facebook and other online orders with totals, shipping and discounts.",
      },
      { property: "og:title", content: "Dashboard — KSHO Online Expense Tracker" },
      {
        property: "og:description",
        content: "Your personal dashboard for online order spending, shipping and discounts.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { orders, loading } = useOrders();
  const [open, setOpen] = useState(false);

  const stats = useMemo(() => {
    const totals = orders.reduce(
      (acc, o) => {
        const t = orderTotal(o);
        acc.total += t;
        acc.shipping += o.shipping;
        acc.discount += o.discount;
        return acc;
      },
      { total: 0, shipping: 0, discount: 0 },
    );
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const thisMonth = orders
      .filter((o) => o.date.startsWith(monthPrefix))
      .reduce((s, o) => s + orderTotal(o), 0);

    const group = (key: (o: (typeof orders)[number]) => string) => {
      const map = new Map<string, number>();
      for (const o of orders) map.set(key(o), (map.get(key(o)) ?? 0) + orderTotal(o));
      return [...map.entries()].sort((a, b) => b[1] - a[1]);
    };

    return {
      ...totals,
      thisMonth,
      avg: orders.length ? totals.total / orders.length : 0,
      byPlatform: group((o) => o.platform),
      byPayment: group((o) => o.paymentMethod),
    };
  }, [orders]);

  const recent = useMemo(
    () => [...orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [orders],
  );

  if (loading) {
    return (
      <AppShell title="Dashboard">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard" subtitle="An overview of everything you spend on online orders.">
      {orders.length === 0 ? (
        <Card className="items-center p-10 text-center shadow-[var(--shadow-card)]">
          <span
            className="flex size-14 items-center justify-center rounded-2xl text-primary-foreground"
            style={{ backgroundImage: "var(--gradient-brand)" }}
          >
            <ShoppingBag className="size-7" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No orders yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add your first online order and KSHO will calculate totals, shipping and discounts
            for you.
          </p>
          <Button className="mt-5" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Add your first order
          </Button>
          <OrderFormDialog open={open} onOpenChange={setOpen} />
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Total spending" value={formatCurrency(stats.total)} icon={Wallet} tone="primary" />
            <StatCard label="Orders" value={String(orders.length)} icon={ShoppingBag} />
            <StatCard label="This month" value={formatCurrency(stats.thisMonth)} icon={CalendarDays} tone="info" />
            <StatCard label="Average order" value={formatCurrency(stats.avg)} icon={Calculator} />
            <StatCard label="Total shipping" value={formatCurrency(stats.shipping)} icon={Truck} />
            <StatCard
              label="Total discounts"
              value={formatCurrency(stats.discount)}
              icon={TicketPercent}
              tone="success"
              hint="Saved on your personal totals"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Breakdown title="Spending by platform" rows={stats.byPlatform} total={stats.total} />
            <Breakdown title="Spending by payment method" rows={stats.byPayment} total={stats.total} />
          </div>

          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Recent orders</CardTitle>
              <Link to="/orders" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recent.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.productName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <PlatformBadge platform={o.platform} />
                      <StatusBadge status={o.status} />
                      <span className="text-xs text-muted-foreground">{formatDate(o.date)}</span>
                    </div>
                  </div>
                  <p className="font-semibold">{formatCurrency(orderTotal(o))}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function Breakdown({
  title,
  rows,
  total,
}: {
  title: string;
  rows: [string, number][];
  total: number;
}) {
  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          rows.map(([label, value]) => {
            const pct = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(value)} · {pct}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundImage: "var(--gradient-brand)" }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
