"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ProductPlaceholderImage } from "@/components/product/product-placeholder-image";
import { formatPaise } from "@/lib/money";
import { STOCK_STATUS_LABEL } from "@/lib/stock";
import {
  removeBasketItem,
  setBasketItemQuantity,
} from "@/server/actions/basket";

export type BasketLineItemData = {
  id: string;
  quantity: number;
  productVariant: {
    id: string;
    size: string;
    priceInPaise: number;
    stockQuantity: number;
    stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    product: {
      name: string;
      categorySlugForPlaceholder: string;
    };
  };
};

export function BasketLineItem({ item }: { item: BasketLineItemData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { productVariant, quantity } = item;

  function updateQuantity(nextQuantity: number) {
    startTransition(async () => {
      const result = await setBasketItemQuantity({
        basketItemId: item.id,
        quantity: nextQuantity,
      });
      if (!result.success) {
        toast.error(result.message ?? "Could not update quantity.");
      } else if (result.message) {
        toast.info(result.message);
      }
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeBasketItem({ basketItemId: item.id });
      if (!result.success) {
        toast.error(result.message ?? "Could not remove item.");
      }
      router.refresh();
    });
  }

  return (
    <li className="flex gap-3 py-4">
      <ProductPlaceholderImage
        categorySlug={productVariant.product.categorySlugForPlaceholder}
        className="size-20 shrink-0"
      />

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium leading-tight">
              {productVariant.product.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Size {productVariant.size}
            </p>
            {productVariant.stockStatus !== "IN_STOCK" && (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                {STOCK_STATUS_LABEL[productVariant.stockStatus]}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={`Remove ${productVariant.product.name}, size ${productVariant.size}, from bag`}
            disabled={isPending}
            onClick={remove}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-40"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center rounded-lg border">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={isPending}
              onClick={() => updateQuantity(quantity - 1)}
              className="flex size-10 items-center justify-center text-muted-foreground disabled:opacity-40"
            >
              <Minus className="size-3.5" aria-hidden />
            </button>
            <span aria-live="polite" className="w-6 text-center text-sm font-medium tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={isPending || quantity >= Math.min(productVariant.stockQuantity, 20)}
              onClick={() => updateQuantity(quantity + 1)}
              className="flex size-10 items-center justify-center text-muted-foreground disabled:opacity-40"
            >
              <Plus className="size-3.5" aria-hidden />
            </button>
          </div>

          <p className="font-semibold">
            {formatPaise(productVariant.priceInPaise * quantity)}
          </p>
        </div>
      </div>
    </li>
  );
}
