import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { OPEX_CATEGORIES, type OpExpense, type OpexCategory } from "@/lib/finance";
import { useOpExpenses } from "@/lib/use-finance";

const today = () => new Date().toISOString().slice(0, 10);

export function OpExpenseDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expense?: OpExpense | null;
}) {
  const { addExpense, updateExpense } = useOpExpenses();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<OpexCategory>("Advertising");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (expense) {
      setDescription(expense.description);
      setCategory(expense.category);
      setAmount(String(expense.amount));
      setDate(expense.date);
      setNotes(expense.notes ?? "");
    } else {
      setDescription("");
      setCategory("Advertising");
      setAmount("");
      setDate(today());
      setNotes("");
    }
  }, [open, expense]);

  function submit() {
    const next: Record<string, string> = {};
    if (!description.trim()) next.description = "Përshkrimi është i detyrueshëm.";
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value < 0) next.amount = "Shuma duhet të jetë numër ≥ 0.";
    if (!date) next.date = "Data është e detyrueshme.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: OpExpense = {
      id: expense?.id ?? crypto.randomUUID(),
      createdAt: expense?.createdAt ?? new Date().toISOString(),
      description: description.trim(),
      category,
      amount: Math.round(value * 100) / 100,
      date,
      notes: notes.trim() || undefined,
    };

    if (expense) {
      updateExpense(payload);
      toast.success("Shpenzimi u përditësua");
    } else {
      addExpense(payload);
      toast.success("Shpenzimi u shtua");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? "Ndrysho shpenzimin" : "Shto shpenzim operativ"}</DialogTitle>
          <DialogDescription>
            Shpenzimet operative përfshihen në fitimin neto real.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="opex-desc">Përshkrimi</Label>
            <Input
              id="opex-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="p.sh. Reklamë Facebook"
            />
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Kategoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as OpexCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPEX_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="opex-amount">Shuma (€)</Label>
              <Input
                id="opex-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {errors.amount ? <p className="text-xs text-destructive">{errors.amount}</p> : null}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="opex-date">Data</Label>
            <Input
              id="opex-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.date ? <p className="text-xs text-destructive">{errors.date}</p> : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="opex-notes">Shënime</Label>
            <Textarea
              id="opex-notes"
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
          <Button onClick={submit}>{expense ? "Ruaj ndryshimet" : "Shto shpenzim"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
