"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductPlaceholderImage } from "@/components/product/product-placeholder-image";
import { formatPaise } from "@/lib/money";
import { calculateDeliveryFee } from "@/lib/fulfillment-config";
import { cn } from "@/lib/utils";
import { placeOrder } from "@/server/actions/checkout";

type CheckoutItem = {
  id: string;
  productName: string;
  size: string;
  quantity: number;
  unitPriceInPaise: number;
  priceInPaiseAtAdd: number;
  categorySlugForPlaceholder: string;
};

type FulfillmentConfig = {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFeeInPaise: number;
  freeDeliveryThresholdInPaise: number;
  serviceableAreaNote: string;
};

type FulfillmentType = "STORE_PICKUP" | "LOCAL_DELIVERY";

type FieldErrors = Record<string, string[]>;

type StockIssue = {
  productName: string;
  size: string;
  requestedQuantity: number;
  availableQuantity: number;
};

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Extremely old-browser fallback — never exercised by any evergreen
  // browser, but keeps this from throwing outright.
  return `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CheckoutForm({
  items,
  subtotalInPaise,
  fulfillment,
}: {
  items: CheckoutItem[];
  subtotalInPaise: number;
  fulfillment: FulfillmentConfig;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nameId = useId();
  const mobileId = useId();
  const addressId = useId();
  const areaId = useId();
  const landmarkId = useId();

  const defaultFulfillment: FulfillmentType = fulfillment.pickupEnabled
    ? "STORE_PICKUP"
    : "LOCAL_DELIVERY";

  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(defaultFulfillment);
  const [deliveryAddressLine, setDeliveryAddressLine] = useState("");
  const [deliveryArea, setDeliveryArea] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [stockIssues, setStockIssues] = useState<StockIssue[] | null>(null);

  // Generated once per checkout page visit and resent unchanged on every
  // submit attempt (including retries after an error) — this is what lets
  // the server recognize "this is the same submission" for double-tap
  // protection. A brand new key is only ever created by loading this page
  // again, e.g. after starting a fresh checkout on a different basket.
  const [idempotencyKey] = useState(generateIdempotencyKey);

  const deliveryFeeInPaise = useMemo(
    () =>
      calculateDeliveryFee({
        fulfillmentType,
        subtotalInPaise,
        deliveryFeeInPaise: fulfillment.deliveryFeeInPaise,
        freeDeliveryThresholdInPaise: fulfillment.freeDeliveryThresholdInPaise,
      }),
    [fulfillmentType, subtotalInPaise, fulfillment],
  );
  const totalInPaise = subtotalInPaise + deliveryFeeInPaise;

  const paymentLabel = fulfillmentType === "STORE_PICKUP" ? "Pay at Store" : "Cash on Delivery";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return; // guards against a second click landing before React re-renders the disabled button

    setFormError(null);
    setStockIssues(null);

    startTransition(async () => {
      const result = await placeOrder({
        customerName,
        customerMobile,
        fulfillmentType,
        deliveryAddressLine: fulfillmentType === "LOCAL_DELIVERY" ? deliveryAddressLine : undefined,
        deliveryArea: fulfillmentType === "LOCAL_DELIVERY" ? deliveryArea : undefined,
        deliveryLandmark:
          fulfillmentType === "LOCAL_DELIVERY" && deliveryLandmark ? deliveryLandmark : undefined,
        idempotencyKey,
      });

      if (result.success) {
        router.push(`/order/${result.orderNumber}/${result.accessToken}`);
        return;
      }

      const { error } = result;
      if (error.type === "VALIDATION") {
        setFieldErrors(error.fieldErrors);
        setFormError(error.message);
      } else if (error.type === "STOCK_ISSUE") {
        setFormError(error.message);
        setStockIssues(error.issues);
      } else {
        setFormError(error.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-8" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{formError}</p>
            {stockIssues && (
              <ul className="mt-2 space-y-1">
                {stockIssues.map((issue) => (
                  <li key={`${issue.productName}-${issue.size}`}>
                    {issue.productName} (Size {issue.size}): only {issue.availableQuantity}{" "}
                    available, you requested {issue.requestedQuantity}.
                  </li>
                ))}
              </ul>
            )}
            {stockIssues && (
              <Link href="/bag" className="mt-2 inline-block underline underline-offset-2">
                Go back to your bag to adjust
              </Link>
            )}
          </div>
        </div>
      )}

      <section aria-labelledby="contact-heading" className="flex flex-col gap-3">
        <h2 id="contact-heading" className="font-heading text-lg font-semibold">
          Contact
        </h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={nameId}>Name</Label>
          <Input
            id={nameId}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            autoComplete="name"
            required
            aria-invalid={Boolean(fieldErrors.customerName)}
          />
          {fieldErrors.customerName && (
            <p className="text-xs text-destructive">{fieldErrors.customerName[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={mobileId}>Mobile number</Label>
          <Input
            id={mobileId}
            type="tel"
            inputMode="tel"
            value={customerMobile}
            onChange={(e) => setCustomerMobile(e.target.value)}
            autoComplete="tel"
            placeholder="98765 43210"
            required
            aria-invalid={Boolean(fieldErrors.customerMobile)}
          />
          {fieldErrors.customerMobile && (
            <p className="text-xs text-destructive">{fieldErrors.customerMobile[0]}</p>
          )}
        </div>
      </section>

      <section aria-labelledby="fulfillment-heading" className="flex flex-col gap-3">
        <h2 id="fulfillment-heading" className="font-heading text-lg font-semibold">
          How would you like to receive it?
        </h2>
        <div role="tablist" aria-label="Fulfillment method" className="inline-flex rounded-full border bg-muted p-1">
          {fulfillment.pickupEnabled && (
            <button
              type="button"
              role="tab"
              aria-selected={fulfillmentType === "STORE_PICKUP"}
              onClick={() => setFulfillmentType("STORE_PICKUP")}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                fulfillmentType === "STORE_PICKUP"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Store Pickup
            </button>
          )}
          {fulfillment.deliveryEnabled && (
            <button
              type="button"
              role="tab"
              aria-selected={fulfillmentType === "LOCAL_DELIVERY"}
              onClick={() => setFulfillmentType("LOCAL_DELIVERY")}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                fulfillmentType === "LOCAL_DELIVERY"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Local Delivery
            </button>
          )}
        </div>

        {fulfillmentType === "LOCAL_DELIVERY" && (
          <div className="flex flex-col gap-3 rounded-xl border bg-secondary/30 p-4">
            <p className="text-xs text-muted-foreground">{fulfillment.serviceableAreaNote}</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={addressId}>Address</Label>
              <Input
                id={addressId}
                value={deliveryAddressLine}
                onChange={(e) => setDeliveryAddressLine(e.target.value)}
                autoComplete="address-line1"
                required
                aria-invalid={Boolean(fieldErrors.deliveryAddressLine)}
              />
              {fieldErrors.deliveryAddressLine && (
                <p className="text-xs text-destructive">{fieldErrors.deliveryAddressLine[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={areaId}>Area / locality</Label>
              <Input
                id={areaId}
                value={deliveryArea}
                onChange={(e) => setDeliveryArea(e.target.value)}
                autoComplete="address-level2"
                required
                aria-invalid={Boolean(fieldErrors.deliveryArea)}
              />
              {fieldErrors.deliveryArea && (
                <p className="text-xs text-destructive">{fieldErrors.deliveryArea[0]}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={landmarkId}>Landmark (optional)</Label>
              <Input
                id={landmarkId}
                value={deliveryLandmark}
                onChange={(e) => setDeliveryLandmark(e.target.value)}
              />
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="payment-heading" className="flex flex-col gap-2">
        <h2 id="payment-heading" className="font-heading text-lg font-semibold">
          Payment
        </h2>
        <div className="rounded-xl border bg-secondary/30 p-4 text-sm">
          <p className="font-medium text-foreground">{paymentLabel}</p>
          <p className="mt-1 text-muted-foreground">
            {fulfillmentType === "STORE_PICKUP"
              ? "Pay in cash when you collect your order at the store."
              : "Pay the delivery person in cash when your order arrives."}
          </p>
        </div>
      </section>

      <section aria-labelledby="summary-heading" className="flex flex-col gap-3">
        <h2 id="summary-heading" className="font-heading text-lg font-semibold">
          Order summary
        </h2>
        <ul className="divide-y rounded-xl border bg-card px-4">
          {items.map((item) => {
            const priceChanged = item.unitPriceInPaise !== item.priceInPaiseAtAdd;
            return (
              <li key={item.id} className="flex gap-3 py-3">
                <ProductPlaceholderImage
                  categorySlug={item.categorySlugForPlaceholder}
                  compact
                  className="size-14 shrink-0"
                />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium leading-tight">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        Size {item.size} &middot; Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatPaise(item.unitPriceInPaise * item.quantity)}
                    </p>
                  </div>
                  {priceChanged && (
                    <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Price updated from {formatPaise(item.priceInPaiseAtAdd)} to{" "}
                      {formatPaise(item.unitPriceInPaise)}.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="rounded-xl border bg-card p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPaise(subtotalInPaise)}</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span>{deliveryFeeInPaise > 0 ? formatPaise(deliveryFeeInPaise) : "Free"}</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatPaise(totalInPaise)}</span>
          </div>
        </div>
      </section>

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full text-base"
        disabled={isPending}
      >
        {isPending ? "Placing your order..." : `Place Order — ${formatPaise(totalInPaise)}`}
      </Button>
    </form>
  );
}
