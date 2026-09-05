import { useCallback, useEffect, useState } from "react";
import { loadOrders, saveOrders, type Order } from "./orders";

const EVENT = "ksho:orders-changed";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setOrders(loadOrders());
  }, []);

  useEffect(() => {
    refresh();
    setLoading(false);
    const handler = () => refresh();
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [refresh]);

  const commit = useCallback((next: Order[]) => {
    saveOrders(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const addOrder = useCallback(
    (order: Order) => commit([order, ...loadOrders()]),
    [commit],
  );

  const updateOrder = useCallback(
    (order: Order) => commit(loadOrders().map((o) => (o.id === order.id ? order : o))),
    [commit],
  );

  const deleteOrder = useCallback(
    (id: string) => commit(loadOrders().filter((o) => o.id !== id)),
    [commit],
  );

  return { orders, loading, addOrder, updateOrder, deleteOrder };
}
