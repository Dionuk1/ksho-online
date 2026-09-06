import { useCallback, useEffect, useState } from "react";
import {
  loadOpExpenses,
  loadRevenue,
  saveOpExpenses,
  saveRevenue,
  type OpExpense,
  type RevenueEntry,
} from "./finance";

const EVENT = "ksho:finance-changed";

function useStore<T extends { id: string }>(load: () => T[], save: (v: T[]) => void) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = () => setItems(load());
    refresh();
    setLoading(false);
    window.addEventListener(EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [load]);

  const commit = useCallback(
    (next: T[]) => {
      save(next);
      window.dispatchEvent(new Event(EVENT));
    },
    [save],
  );

  const add = useCallback((item: T) => commit([item, ...load()]), [commit, load]);
  const update = useCallback(
    (item: T) => commit(load().map((i) => (i.id === item.id ? item : i))),
    [commit, load],
  );
  const remove = useCallback(
    (id: string) => commit(load().filter((i) => i.id !== id)),
    [commit, load],
  );

  return { items, loading, add, update, remove };
}

export function useOpExpenses() {
  const { items, loading, add, update, remove } = useStore<OpExpense>(
    loadOpExpenses,
    saveOpExpenses,
  );
  return { expenses: items, loading, addExpense: add, updateExpense: update, deleteExpense: remove };
}

export function useRevenue() {
  const { items, loading, add, update, remove } = useStore<RevenueEntry>(loadRevenue, saveRevenue);
  return { revenue: items, loading, addRevenue: add, updateRevenue: update, deleteRevenue: remove };
}
