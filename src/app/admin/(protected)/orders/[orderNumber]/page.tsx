import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  OrderStatusActions,
  PaymentStatusActions,
} from "@/components/admin/order-status-actions";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/admin/order-status-badge";
import { formatPaise } from "@/lib/money";
import { getFulfillmentLabel, getPaymentMethodLabel } from "@/lib/order-message";
import { getAdminOrderByNumber } from "@/server/queries/admin/orders";

type PageProps = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: orderNumber };
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const order = await getAdminOrderByNumber(orderNumber);
  if (!order) notFound();

  const isPickup = order.fulfillmentType === "STORE_PICKUP";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-lg font-semibold">{order.orderNumber}</p>
          <p className="text-sm text-muted-foreground">
            {order.createdAt.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}
          </p>
        </div>
        <div className="flex gap-1.5">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Order status</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {getFulfillmentLabel(order.fulfillmentType)} order.
        </p>
        <div className="mt-3">
          <OrderStatusActions
            orderNumber={order.orderNumber}
            status={order.status}
            fulfillmentType={order.fulfillmentType}
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Payment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {getPaymentMethodLabel({
            paymentMethod: order.paymentMethod,
            fulfillmentType: order.fulfillmentType,
          })}
        </p>
        <div className="mt-3">
          <PaymentStatusActions
            orderNumber={order.orderNumber}
            paymentStatus={order.paymentStatus}
            orderStatus={order.status}
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Customer</h2>
          <p className="mt-2 text-sm">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">{order.customerMobile}</p>
          {order.school && (
            <p className="mt-1 text-xs text-muted-foreground">School: {order.school.name}</p>
          )}
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">
            {isPickup ? "Store Pickup" : "Delivery Address"}
          </h2>
          {isPickup ? (
            <p className="mt-2 text-sm text-muted-foreground">Customer collects at the store.</p>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">
              <p>{order.deliveryAddressLine}</p>
              <p>{order.deliveryArea}</p>
              {order.deliveryLandmark && <p>Landmark: {order.deliveryLandmark}</p>}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Items</h2>
        <ul className="mt-3 divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  Size {item.size} &middot; SKU {item.skuSnapshot} &middot; Qty {item.quantity} &middot;{" "}
                  {formatPaise(item.unitPriceInPaise)} each
                </p>
              </div>
              <p className="font-semibold">{formatPaise(item.lineTotalInPaise)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPaise(order.subtotalInPaise)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground">Delivery fee</span>
            <span>{order.deliveryFeeInPaise > 0 ? formatPaise(order.deliveryFeeInPaise) : "Free"}</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatPaise(order.totalInPaise)}</span>
          </div>
        </div>
      </section>

      {order.inventoryAdjustments.length > 0 && (
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Inventory adjustments</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {order.inventoryAdjustments.map((adj) => (
              <li key={adj.id}>
                {adj.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} —{" "}
                {adj.reason.replace(/_/g, " ").toLowerCase()}: {adj.previousQuantity} → {adj.newQuantity}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
