import Link from "next/link";
import type { Metadata } from "next";
import { OrderFilters } from "@/components/admin/order-filters";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/order-status-badge";
import { formatPaise } from "@/lib/money";
import { getFulfillmentLabel } from "@/lib/order-message";
import { adminOrderFiltersSchema } from "@/lib/validation/admin-orders";
import { getAdminOrders } from "@/server/queries/admin/orders";

export const metadata: Metadata = { title: "Orders" };

type PageProps = {
  searchParams: Promise<{
    status?: string;
    paymentStatus?: string;
    fulfillmentType?: string;
    q?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const parsed = adminOrderFiltersSchema.safeParse({
    status: query.status,
    paymentStatus: query.paymentStatus,
    fulfillmentType: query.fulfillmentType,
    query: query.q,
  });
  const filters = parsed.success ? parsed.data : {};

  const orders = await getAdminOrders(filters);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {orders.length} order{orders.length === 1 ? "" : "s"} shown, newest first.
        </p>
      </div>

      <OrderFilters />

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No orders match these filters.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.orderNumber}`}
                className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium">{order.orderNumber}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {order.customerName} &middot; {order.customerMobile}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.createdAt.toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    &middot; {getFulfillmentLabel(order.fulfillmentType)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  <p className="font-semibold">{formatPaise(order.totalInPaise)}</p>
                  <div className="flex gap-1.5">
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
