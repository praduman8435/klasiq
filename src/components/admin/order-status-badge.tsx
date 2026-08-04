import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/order-lifecycle";
import { cn } from "@/lib/utils";

const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-secondary text-secondary-foreground",
  PREPARING: "bg-accent/50 text-accent-foreground",
  READY_FOR_PICKUP: "bg-primary/15 text-primary",
  OUT_FOR_DELIVERY: "bg-primary/15 text-primary",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-destructive/10 text-destructive",
};

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  UNPAID: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  REFUNDED: "bg-muted text-muted-foreground",
  FAILED: "bg-destructive/10 text-destructive",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", ORDER_STATUS_CLASS[status])}>
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", PAYMENT_STATUS_CLASS[status])}>
      {PAYMENT_STATUS_LABEL[status]}
    </Badge>
  );
}
