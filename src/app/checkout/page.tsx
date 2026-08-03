import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { basketTotalInPaise, getBasket, getConvertedBasketOrderLink } from "@/lib/basket";
import { FULFILLMENT_CONFIG } from "@/lib/fulfillment-config";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const basket = await getBasket();

  if (!basket || basket.items.length === 0) {
    // If this basket already produced an order (parent hit back/refresh
    // after placing it), send them straight to that confirmation instead
    // of confusingly telling them their bag is empty.
    const convertedOrder = await getConvertedBasketOrderLink();
    if (convertedOrder) {
      redirect(`/order/${convertedOrder.orderNumber}/${convertedOrder.accessToken}`);
    }

    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShoppingBag className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-semibold">
          Your bag is empty
        </h1>
        <p className="mt-2 text-muted-foreground">
          Add something to your bag before checking out.
        </p>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-6">
          Find your school
        </Button>
      </div>
    );
  }

  const subtotalInPaise = basketTotalInPaise(basket);
  const items = basket.items.map((item) => ({
    id: item.id,
    productName: item.productVariant.product.name,
    size: item.productVariant.size,
    quantity: item.quantity,
    unitPriceInPaise: item.productVariant.priceInPaise,
    priceInPaiseAtAdd: item.priceInPaiseAtAdd,
    categorySlugForPlaceholder: item.productVariant.product.category.slug,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        Checkout
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        No account needed — just a few details and you&apos;re done.
      </p>

      <CheckoutForm
        items={items}
        subtotalInPaise={subtotalInPaise}
        fulfillment={{
          pickupEnabled: FULFILLMENT_CONFIG.pickupEnabled,
          deliveryEnabled: FULFILLMENT_CONFIG.deliveryEnabled,
          deliveryFeeInPaise: FULFILLMENT_CONFIG.deliveryFeeInPaise,
          freeDeliveryThresholdInPaise: FULFILLMENT_CONFIG.freeDeliveryThresholdInPaise,
          serviceableAreaNote: FULFILLMENT_CONFIG.serviceableAreaNote,
        }}
      />
    </div>
  );
}
