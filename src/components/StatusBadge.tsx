import {
  PLATFORM_LABELS,
  REFUND_LABELS,
  STATUS_LABELS,
  type OrderStatus,
  type RefundStatus,
} from "@/lib/orders";

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
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] ?? styles.Ordered}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
      {PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS] ?? platform}
    </span>
  );
}

const refundStyles: Record<RefundStatus, string> = {
  none: "",
  pending: "bg-warning/20 text-warning-foreground",
  received: "bg-success/15 text-success",
};

/** Renders nothing for "none" so lists stay clean. */
export function RefundBadge({ status }: { status?: RefundStatus }) {
  if (!status || status === "none") return null;
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${refundStyles[status]}`}
    >
      {REFUND_LABELS[status]}
    </span>
  );
}
