import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { formatPaise } from "@/lib/money";
import { getFulfillmentLabel, getPaymentMethodLabel } from "@/lib/order-message";
import { getOrderByNumberAndToken } from "@/server/queries/orders";

type PageProps = {
  params: Promise<{ orderNumber: string; token: string }>;
};

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  REFUNDED: "Refunded",
  FAILED: "Payment failed",
};

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { orderNumber, token } = await params;
  const order = await getOrderByNumberAndToken(orderNumber, token);

  if (!order) {
    notFound();
  }

  const isPickup = order.fulfillmentType === "STORE_PICKUP";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-semibold sm:text-3xl">
          Order received!
        </h1>
        <p className="mt-1 text-muted-foreground">
          We&apos;ll have this ready for you soon.
        </p>
        <p className="mt-4 rounded-full bg-secondary px-4 py-1.5 font-mono text-sm font-medium">
          {order.orderNumber}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold">Items</h2>
        <ul className="mt-3 divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-xs text-muted-foreground">
                  Size {item.size} &middot; Qty {item.quantity}
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
            <span className="text-muted-foreground">Delivery</span>
            <span>
              {order.deliveryFeeInPaise > 0 ? formatPaise(order.deliveryFeeInPaise) : "Free"}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatPaise(order.totalInPaise)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">
            {isPickup ? "Store Pickup" : "Local Delivery"}
          </h2>
          {isPickup ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Bring this order number when you collect your order at the store.
            </p>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">
              <p>{order.deliveryAddressLine}</p>
              <p>{order.deliveryArea}</p>
              {order.deliveryLandmark && <p>Landmark: {order.deliveryLandmark}</p>}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">Payment</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {getPaymentMethodLabel({
              paymentMethod: order.paymentMethod,
              fulfillmentType: order.fulfillmentType,
            })}
          </p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Status: {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Contact details</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {order.customerName} &middot; {order.customerMobile}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Fulfillment: {getFulfillmentLabel(order.fulfillmentType)}
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Save this page&apos;s link — it&apos;s the only way to view this order again.
      </p>
    </div>
  );
}
