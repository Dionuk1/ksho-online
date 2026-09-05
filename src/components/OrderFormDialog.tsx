import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  PAYMENT_METHODS,
  PLATFORMS,
  STATUSES,
  formatCurrency,
  orderTotal,
  type Order,
} from "@/lib/orders";
import { useOrders } from "@/lib/use-orders";

type FormState = {
  platform: string;
  productName: string;
  category: string;
  quantity: string;
  price: string;
  shipping: string;
  discount: string;
  date: string;
  paymentMethod: string;
  status: string;
  orderId: string;
  url: string;
  tracking: string;
  notes: string;
};

const emptyState = (): FormState => ({
  platform: "AliExpress",
  productName: "",
  category: "Electronics",
  quantity: "1",
  price: "",
  shipping: "0",
  discount: "0",
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "Card",
  status: "Ordered",
  orderId: "",
  url: "",
  tracking: "",
  notes: "",
});

const fromOrder = (o: Order): FormState => ({
  platform: o.platform,
  productName: o.productName,
  category: o.category,
  quantity: String(o.quantity),
  price: String(o.price),
  shipping: String(o.shipping),
  discount: String(o.discount),
  date: o.date,
  paymentMethod: o.paymentMethod,
  status: o.status,
  orderId: o.orderId ?? "",
  url: o.url ?? "",
  tracking: o.tracking ?? "",
  notes: o.notes ?? "",
});

const num = (v: string) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

export function OrderFormDialog({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order?: Order | null;
}) {
  const { addOrder, updateOrder } = useOrders();
  const [form, setForm] = useState<FormState>(emptyState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(order ? fromOrder(order) : emptyState());
      setErrors({});
    }
  }, [open, order]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const total = useMemo(
    () =>
      orderTotal({
        price: num(form.price) || 0,
        quantity: num(form.quantity) || 0,
        shipping: num(form.shipping) || 0,
        discount: num(form.discount) || 0,
      }),
    [form.price, form.quantity, form.shipping, form.discount],
  );

  function validate() {
    const e: Record<string, string> = {};
    if (!form.productName.trim()) e.productName = "Product name is required";
    if (!Number.isFinite(num(form.quantity)) || num(form.quantity) < 1)
      e.quantity = "Quantity must be at least 1";
    if (!Number.isFinite(num(form.price)) || num(form.price) < 0)
      e.price = "Enter a valid price";
    if (!Number.isFinite(num(form.shipping)) || num(form.shipping) < 0)
      e.shipping = "Enter a valid shipping cost";
    if (!Number.isFinite(num(form.discount)) || num(form.discount) < 0)
      e.discount = "Enter a valid discount";
    if (!form.date) e.date = "Order date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      const payload: Order = {
        id: order?.id ?? crypto.randomUUID(),
        createdAt: order?.createdAt ?? new Date().toISOString(),
        platform: form.platform as Order["platform"],
        productName: form.productName.trim(),
        category: form.category,
        quantity: Math.round(num(form.quantity)),
        price: num(form.price),
        shipping: num(form.shipping),
        discount: num(form.discount),
        date: form.date,
        paymentMethod: form.paymentMethod as Order["paymentMethod"],
        status: form.status as Order["status"],
        orderId: form.orderId.trim() || undefined,
        url: form.url.trim() || undefined,
        tracking: form.tracking.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (order) {
        updateOrder(payload);
        toast.success("Order updated");
      } else {
        addOrder(payload);
        toast.success("Order added");
      }
      onOpenChange(false);
    } catch {
      toast.error("Could not save the order. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{order ? "Edit order" : "Add order"}</DialogTitle>
          <DialogDescription>
            The personal discount only affects your own expense total — the original product
            price stays unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platform">
            <Choice value={form.platform} onChange={(v) => set("platform", v)} options={[...PLATFORMS]} />
          </Field>
          <Field label="Order date" error={errors.date}>
            <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label="Product name" className="sm:col-span-2" error={errors.productName}>
            <Input
              value={form.productName}
              placeholder="e.g. Wireless earbuds"
              onChange={(e) => set("productName", e.target.value)}
            />
          </Field>
          <Field label="Category">
            <Choice value={form.category} onChange={(v) => set("category", v)} options={[...CATEGORIES]} />
          </Field>
          <Field label="Quantity" error={errors.quantity}>
            <Input
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
            />
          </Field>
          <Field label="Product price" error={errors.price}>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </Field>
          <Field label="Shipping cost" error={errors.shipping}>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.shipping}
              onChange={(e) => set("shipping", e.target.value)}
            />
          </Field>
          <Field label="Personal discount" error={errors.discount}>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.discount}
              onChange={(e) => set("discount", e.target.value)}
            />
          </Field>
          <Field label="Payment method">
            <Choice
              value={form.paymentMethod}
              onChange={(v) => set("paymentMethod", v)}
              options={[...PAYMENT_METHODS]}
            />
          </Field>
          <Field label="Status">
            <Choice value={form.status} onChange={(v) => set("status", v)} options={[...STATUSES]} />
          </Field>
          <Field label="Order ID (optional)">
            <Input value={form.orderId} onChange={(e) => set("orderId", e.target.value)} />
          </Field>
          <Field label="Order URL (optional)">
            <Input
              value={form.url}
              placeholder="https://"
              onChange={(e) => set("url", e.target.value)}
            />
          </Field>
          <Field label="Tracking number (optional)">
            <Input value={form.tracking} onChange={(e) => set("tracking", e.target.value)} />
          </Field>
          <Field label="Notes (optional)" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Final total
            </p>
            <p className="text-xs text-muted-foreground">
              (price × qty) + shipping − discount
            </p>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving..." : order ? "Save changes" : "Add order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
  error,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function Choice({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
