"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPlaceholderImage } from "@/components/product/product-placeholder-image";
import { formatPaise } from "@/lib/money";
import { STOCK_STATUS_LABEL, isOrderable } from "@/lib/stock";
import { cn } from "@/lib/utils";
import { addToBasket } from "@/server/actions/basket";
import type { ProductWithVariants } from "@/types/catalog";

const STOCK_BADGE_CLASS: Record<string, string> = {
  IN_STOCK: "text-emerald-700 dark:text-emerald-400",
  LOW_STOCK: "text-amber-700 dark:text-amber-400",
  OUT_OF_STOCK: "text-muted-foreground line-through",
};

export function ProductCard({
  product,
  categorySlug,
}: {
  product: ProductWithVariants;
  categorySlug: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sortedVariants = useMemo(
    () => [...product.variants].sort((a, b) => a.sortOrder - b.sortOrder),
    [product.variants],
  );
  const defaultVariant =
    sortedVariants.find((v) => isOrderable(v.stockStatus)) ?? sortedVariants[0];

  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = sortedVariants.find((v) => v.id === selectedVariantId);
  const canOrder = selectedVariant ? isOrderable(selectedVariant.stockStatus) : false;
  const maxQuantity = selectedVariant
    ? Math.max(1, Math.min(selectedVariant.stockQuantity, 20))
    : 1;

  function selectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    setQuantity(1);
  }

  function addToBag(onSuccess?: () => void) {
    if (!selectedVariant || !canOrder) return;
    startTransition(async () => {
      const result = await addToBasket({
        productVariantId: selectedVariant.id,
        quantity,
      });
      if (result.success) {
        toast.success(`Added ${product.name} (Size ${selectedVariant.size}) to your bag.`);
        router.refresh();
        onSuccess?.();
      } else {
        toast.error(result.message ?? "Could not add to bag.");
      }
    });
  }

  if (sortedVariants.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-4 shadow-sm">
      <ProductPlaceholderImage categorySlug={categorySlug} className="aspect-4/3 w-full" />

      <div className="mt-3 flex-1">
        <h3 className="font-heading text-base font-semibold leading-tight">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {product.description}
          </p>
        )}
      </div>

      <fieldset className="mt-3">
        <legend className="text-xs font-medium text-muted-foreground">
          Size
        </legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {sortedVariants.map((variant) => {
            const orderable = isOrderable(variant.stockStatus);
            const isSelected = variant.id === selectedVariantId;
            return (
              <button
                key={variant.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => selectVariant(variant.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                  !orderable && "text-muted-foreground line-through opacity-60",
                )}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedVariant && (
        <p className="mt-2 text-sm">
          <span className="font-semibold text-foreground">
            {formatPaise(selectedVariant.priceInPaise)}
          </span>{" "}
          <span className={cn("text-xs font-medium", STOCK_BADGE_CLASS[selectedVariant.stockStatus])}>
            {STOCK_STATUS_LABEL[selectedVariant.stockStatus]}
          </span>
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <div className="flex items-center rounded-lg border">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={!canOrder || quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex size-10 items-center justify-center text-muted-foreground disabled:opacity-40"
          >
            <Minus className="size-3.5" aria-hidden />
          </button>
          <span
            aria-live="polite"
            className="w-6 text-center text-sm font-medium tabular-nums"
          >
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={!canOrder || quantity >= maxQuantity}
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            className="flex size-10 items-center justify-center text-muted-foreground disabled:opacity-40"
          >
            <Plus className="size-3.5" aria-hidden />
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={!canOrder || isPending}
          onClick={() => addToBag()}
        >
          Add to Bag
        </Button>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="mt-2 w-full"
        disabled={!canOrder || isPending}
        onClick={() => addToBag(() => router.push("/bag"))}
      >
        Buy Now
      </Button>
    </div>
  );
}
