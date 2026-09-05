import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Pencil, Search, Trash2, Eye, Plus, FilterX } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { OrderFormDialog } from "@/components/OrderFormDialog";
import { StatusBadge, PlatformBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  CATEGORIES,
  PAYMENT_METHODS,
  PLATFORMS,
  STATUSES,
  formatCurrency,
  formatDate,
  orderTotal,
  type Order,
} from "@/lib/orders";
import { useOrders } from "@/lib/use-orders";
import { exportOrdersToExcel } from "@/lib/export-excel";
import { RANGE_LABELS, inRange, presetRange, type RangePreset } from "@/lib/date-range";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — KSHO Online Expense Tracker" },
      {
        name: "description",
        content:
          "Search, filter, edit and export every online order you have placed, with totals and status tracking.",
      },
      { property: "og:title", content: "Orders — KSHO Online Expense Tracker" },
      {
        property: "og:description",
        content: "Search, filter, edit and export all of your online orders.",
      },
    ],
  }),
  component: OrdersPage,
});

const ALL = "all";

function OrdersPage() {
  const { orders, loading, deleteOrder } = useOrders();
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [payment, setPayment] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [preset, setPreset] = useState<RangePreset>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("date-desc");

  const [editing, setEditing] = useState<Order | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [details, setDetails] = useState<Order | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null);

  const range = preset === "custom" ? { from, to } : presetRange(preset);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = orders.filter((o) => {
      if (
        term &&
        ![o.productName, o.category, o.platform, o.orderId, o.tracking, o.notes]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      )
        return false;
      if (platform !== ALL && o.platform !== platform) return false;
      if (category !== ALL && o.category !== category) return false;
      if (payment !== ALL && o.paymentMethod !== payment) return false;
      if (status !== ALL && o.status !== status) return false;
      if (!inRange(o.date, range.from || undefined, range.to || undefined)) return false;
      return true;
    });

    return list.sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "total-desc":
          return orderTotal(b) - orderTotal(a);
        case "total-asc":
          return orderTotal(a) - orderTotal(b);
        case "name-asc":
          return a.productName.localeCompare(b.productName);
        default:
          return b.date.localeCompare(a.date);
      }
    });
  }, [orders, q, platform, category, payment, status, range.from, range.to, sort]);

  const total = filtered.reduce((s, o) => s + orderTotal(o), 0);

  function resetFilters() {
    setQ("");
    setPlatform(ALL);
    setCategory(ALL);
    setPayment(ALL);
    setStatus(ALL);
    setPreset("all");
    setFrom("");
    setTo("");
    setSort("date-desc");
  }

  function handleExport() {
    if (filtered.length === 0) {
      toast.error("Nothing to export with the current filters");
      return;
    }
    try {
      exportOrdersToExcel(filtered);
      toast.success(`Exported ${filtered.length} orders to Excel`);
    } catch {
      toast.error("Export failed. Please try again.");
    }
  }

  return (
    <AppShell title="Orders" subtitle="Search, filter and manage every order you have placed.">
      <Card className="mb-4 shadow-[var(--shadow-card)]">
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product, order ID, tracking, notes..."
              className="pl-9"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Filter label="Platform" value={platform} onChange={setPlatform} options={[...PLATFORMS]} />
            <Filter label="Category" value={category} onChange={setCategory} options={[...CATEGORIES]} />
            <Filter label="Payment" value={payment} onChange={setPayment} options={[...PAYMENT_METHODS]} />
            <Filter label="Status" value={status} onChange={setStatus} options={[...STATUSES]} />
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Date range</Label>
              <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RANGE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Sort by</Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest first</SelectItem>
                  <SelectItem value="date-asc">Oldest first</SelectItem>
                  <SelectItem value="total-desc">Highest total</SelectItem>
                  <SelectItem value="total-asc">Lowest total</SelectItem>
                  <SelectItem value="name-asc">Product A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {preset === "custom" ? (
              <>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filtered.length}</span> orders ·{" "}
              <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <FilterX className="size-4" /> Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="size-4" /> Export Excel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center shadow-[var(--shadow-card)]">
          <p className="font-semibold">No orders found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {orders.length === 0
              ? "Add your first order to start tracking spending."
              : "Try changing or resetting the filters."}
          </p>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden p-0 shadow-[var(--shadow-card)] lg:block">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className="border-t border-border hover:bg-muted/40">
                      <td className="max-w-[240px] truncate px-4 py-3 font-medium">
                        {o.productName}
                        <span className="block text-xs font-normal text-muted-foreground">
                          {o.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <PlatformBadge platform={o.platform} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(o.date)}</td>
                      <td className="px-4 py-3">{o.quantity}</td>
                      <td className="whitespace-nowrap px-4 py-3">{o.paymentMethod}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                        {formatCurrency(orderTotal(o))}
                      </td>
                      <td className="px-2 py-3">
                        <RowActions
                          onView={() => setDetails(o)}
                          onEdit={() => {
                            setEditing(o);
                            setFormOpen(true);
                          }}
                          onDelete={() => setPendingDelete(o)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((o) => (
              <Card key={o.id} className="gap-3 p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.category} · {formatDate(o.date)} · ×{o.quantity}
                    </p>
                  </div>
                  <p className="whitespace-nowrap font-semibold">
                    {formatCurrency(orderTotal(o))}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformBadge platform={o.platform} />
                  <StatusBadge status={o.status} />
                  <span className="text-xs text-muted-foreground">{o.paymentMethod}</span>
                </div>
                <div className="flex justify-end">
                  <RowActions
                    onView={() => setDetails(o)}
                    onEdit={() => {
                      setEditing(o);
                      setFormOpen(true);
                    }}
                    onDelete={() => setPendingDelete(o)}
                  />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <OrderFormDialog open={formOpen} onOpenChange={setFormOpen} order={editing} />

      <Dialog open={!!details} onOpenChange={(v) => !v && setDetails(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-6 break-words">{details?.productName}</DialogTitle>
          </DialogHeader>
          {details ? (
            <div className="space-y-2 text-sm">
              <Row label="Platform" value={details.platform} />
              <Row label="Category" value={details.category} />
              <Row label="Order date" value={formatDate(details.date)} />
              <Row label="Quantity" value={String(details.quantity)} />
              <Row label="Original price" value={formatCurrency(details.price)} />
              <Row label="Shipping" value={formatCurrency(details.shipping)} />
              <Row label="Personal discount" value={formatCurrency(details.discount)} />
              <Row label="Payment method" value={details.paymentMethod} />
              <Row label="Status" value={details.status} />
              {details.orderId ? <Row label="Order ID" value={details.orderId} /> : null}
              {details.tracking ? <Row label="Tracking" value={details.tracking} /> : null}
              {details.url ? (
                <div className="flex justify-between gap-4 border-b border-border py-2">
                  <span className="text-muted-foreground">Order URL</span>
                  <a
                    href={details.url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 truncate font-medium text-primary hover:underline"
                  >
                    {details.url}
                  </a>
                </div>
              ) : null}
              {details.notes ? (
                <div className="border-b border-border py-2">
                  <p className="text-muted-foreground">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap">{details.notes}</p>
                </div>
              ) : null}
              <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 p-3">
                <span className="text-sm font-medium">Final total</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(orderTotal(details))}
                </span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.productName}” will be permanently removed from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) {
                  deleteOrder(pendingDelete.id);
                  toast.success("Order deleted");
                }
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium break-words">{value}</span>
    </div>
  );
}

function RowActions({
  onView,
  onEdit,
  onDelete,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" aria-label="View details" onClick={onView}>
        <Eye className="size-4" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Edit order" onClick={onEdit}>
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete order"
        className="text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
