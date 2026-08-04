import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { BasketLineItem } from "@/components/basket/basket-line-item";
import { Button } from "@/components/ui/button";
import { basketTotalInPaise, getBasket } from "@/lib/basket";
import { formatPaise } from "@/lib/money";

export const metadata: Metadata = {
  title: "Your Bag",
  robots: { index: false },
};

export default async function BagPage() {
  const basket = await getBasket();
  const items = basket?.items ?? [];
  const total = basketTotalInPaise(basket);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShoppingBag className="size-7" aria-hidden />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-semibold">
          Your bag is empty
        </h1>
        <p className="mt-2 text-muted-foreground">
          Search your school or browse essentials to get started.
        </p>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-6">
          Find your school
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        Your Bag
      </h1>

      <ul className="mt-6 divide-y rounded-2xl border bg-card px-4 sm:px-5">
        {items.map((item) => (
          <BasketLineItem
            key={item.id}
            item={{
              id: item.id,
              quantity: item.quantity,
              productVariant: {
                id: item.productVariant.id,
                size: item.productVariant.size,
                priceInPaise: item.productVariant.priceInPaise,
                stockQuantity: item.productVariant.stockQuantity,
                stockStatus: item.productVariant.stockStatus,
                product: {
                  name: item.productVariant.product.name,
                  categorySlugForPlaceholder: item.productVariant.product.category.slug,
                },
              },
            }}
          />
        ))}
      </ul>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Subtotal</span>
          <span>{formatPaise(total)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Delivery/pickup and payment are chosen at checkout.
        </p>

        <Button
          render={<Link href="/checkout" />}
          nativeButton={false}
          size="lg"
          className="mt-5 h-14 w-full text-base"
        >
          Proceed to Checkout
        </Button>

        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="outline"
          className="mt-3 w-full"
        >
          Continue shopping
        </Button>
      </div>
    </div>
  );
}
