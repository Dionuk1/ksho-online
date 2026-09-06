import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REVENUE_SOURCES, type RevenueEntry, type RevenueSource } from "@/lib/finance";
import { useRevenue } from "@/lib/use-finance";
import { formatCurrency } from "@/lib/orders";

const today = () => new Date().toISOString().slice(0, 10);

export function RevenueDialog({
  open,
  onOpenChange,
  entry,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry?: RevenueEntry | null;
}) {
  const { addRevenue, updateRevenue } = useRevenue();
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<RevenueSource>("Dyqani Online");
  const [revenue, setRevenue] = useState("");
  const [productCost, setProductCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [collected, setCollected] = useState(true);
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (entry) {
      setDescription(entry.description);
      setSource(entry.source);
      setRevenue(String(entry.revenue));
      setProductCost(String(entry.productCost));
      setShippingCost(String(entry.shippingCost));
      setCollected(entry.collected);
      setDate(entry.date);
      setNotes(entry.notes ?? "");
    } else {
      setDescription("");
      setSource("Dyqani Online");
      setRevenue("");
      setProductCost("");
      setShippingCost("");
      setCollected(true);
      setDate(today());
      setNotes("");
    }
  }, [open, entry]);

  const num = (v: string) => (v === "" ? 0 : Number(v));
  const gross = num(revenue) - num(productCost) - num(shippingCost);

  function submit() {
    const next: Record<string, string> = {};
    if (!description.trim()) next.description = "Përshkrimi është i detyrueshëm.";
    for (const [key, value] of [
      ["revenue", revenue],
      ["productCost", productCost],
      ["shippingCost", shippingCost],
    ] as const) {
      const n = num(value);
      if (Number.isNaN(n) || n < 0) next[key] = "Duhet numër ≥ 0.";
    }
    if (!date) next.date = "Data është e detyrueshme.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const round = (n: number) => Math.round(n * 100) / 100;
    const payload: RevenueEntry = {
      id: entry?.id ?? crypto.randomUUID(),
      createdAt: entry?.createdAt ?? new Date().toISOString(),
      description: description.trim(),
      source,
      revenue: round(num(revenue)),
      productCost: round(num(productCost)),
      shippingCost: round(num(shippingCost)),
      collected,
      date,
      notes: notes.trim() || undefined,
    };

    if (entry) {
      updateRevenue(payload);
      toast.success("Të ardhurat u përditësuan");
    } else {
      addRevenue(payload);
      toast.success("Të ardhurat u shtuan");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? "Ndrysho të ardhurat" : "Shto të ardhura"}</DialogTitle>
          <DialogDescription>
            Të ardhurat e biznesit mbahen ndaras nga shpenzimet personale të porosive.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="rev-desc">Përshkrimi</Label>
            <Input
              id="rev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="p.sh. Shitje kufje bluetooth"
            />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Burimi</Label>
              <Select value={source} onValueChange={(v) => setSource(v as RevenueSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rev-date">Data</Label>
              <Input
                id="rev-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {errors.date ? <p className="text-xs text-destructive">{errors.date}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="rev-amount">Xhiro (€)</Label>
              <Input
                id="rev-amount"
                type="number"
                min="0"
                step="0.01"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
              />
              {errors.revenue ? <p className="text-xs text-destructive">{errors.revenue}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rev-pc">Kosto produkti (€)</Label>
              <Input
                id="rev-pc"
                type="number"
                min="0"
                step="0.01"
                value={productCost}
                onChange={(e) => setProductCost(e.target.value)}
              />
              {errors.productCost ? (
                <p className="text-xs text-destructive">{errors.productCost}</p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rev-sc">Kosto poste (€)</Label>
              <Input
                id="rev-sc"
                type="number"
                min="0"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
              />
              {errors.shippingCost ? (
                <p className="text-xs text-destructive">{errors.shippingCost}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-sm font-medium">E arkëtuar</p>
              <p className="text-xs text-muted-foreground">
                Fikeni nëse pagesa është ende në pritje.
              </p>
            </div>
            <Switch checked={collected} onCheckedChange={setCollected} />
          </div>

          <div className="rounded-xl bg-muted p-3 text-sm">
            Fitimi bruto:{" "}
            <span className="font-semibold">{formatCurrency(gross)}</span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="rev-notes">Shënime</Label>
            <Textarea
              id="rev-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anulo
          </Button>
          <Button onClick={submit}>{entry ? "Ruaj ndryshimet" : "Shto"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
