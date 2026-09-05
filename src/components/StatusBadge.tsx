import type { OrderStatus } from "@/lib/orders";

const styles: Record<OrderStatus, string> = {
  Ordered: "bg-muted text-muted-foreground",
  "In Transit": "bg-info/15 text-info-foreground",
  Received: "bg-success/15 text-success",
  Cancelled: "bg-destructive/10 text-destructive",
  Returned: "bg-warning/20 text-warning-foreground",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
      {platform}
    </span>
  );
}
