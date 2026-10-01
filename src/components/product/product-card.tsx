"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductThumbnail } from "@/components/product/product-thumbnail";
import { formatPaise } from "@/lib/money";
import { MrpPrice } from "@/components/product/mrp-price";
import { STOCK_STATUS_LABEL, isOrderable } from "@/lib/stock";
import { cn } from "@/lib/utils";
import { addToBasket } from "@/server/actions/basket";
import type { ProductWithVariants } from "@/types/catalog";

const STOCK_BADGE_CLASS: Record<string, string> = {
  IN_STOCK: "text-muted-foreground",
  LOW_STOCK: "text-deal",
  OUT_OF_STOCK: "text-muted-foreground",
};

/**
 * The storefront's one product card (category pages, search, school
 * pages and the homepage rows): picture, name, price with MRP and "% off",
 * then size + Add to Bag on one thumb-height row. Stock is only mentioned
 * when it matters (a few left, or out of stock).
 */
export function ProductCard({
  product,
}: {
  /** `school` is set on a school's own uniform item; the card names it. */
  product: ProductWithVariants & { school?: { slug: string; name: string } | null };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);
  const sortedVariants = useMemo(
    () => [...product.variants].sort((a, b) => a.sortOrder - b.sortOrder),
    [product.variants],
  );
  const defaultVariant =
    sortedVariants.find((v) => isOrderable(v.stockStatus)) ?? sortedVariants[0];

  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id);
  const selectedVariant = sortedVariants.find((v) => v.id === selectedVariantId);
  const canOrder = selectedVariant ? isOrderable(selectedVariant.stockStatus) : false;
  const hasSizeChoice = sortedVariants.length > 1;

  function addToBag() {
    if (!selectedVariant || !canOrder) return;
    startTransition(async () => {
      const result = await addToBasket({
        productVariantId: selectedVariant.id,
        quantity: 1,
      });
      if (result.success) {
        toast.success(`Added ${product.name} (Size ${selectedVariant.size}) to your bag.`);
        setJustAdded(true);
        // `router.refresh()` re-fetches this route's Server Component tree
        // (needed so the header's bag-count badge — itself a Server
        // Component — picks up the new count). Firing it immediately raced
        // the "Added" visual state: the refresh could remount this card
        // before the customer ever saw it, so the CTA appeared to do
        // nothing. Delaying it until after the "Added" window closes lets
        // the feedback actually be seen first.
        window.setTimeout(() => {
          setJustAdded(false);
          router.refresh();
        }, 1400);
      } else {
        toast.error(result.message ?? "Could not add to bag.");
      }
    });
  }

  if (sortedVariants.length === 0) {
    return null;
  }

  const ctaLabel = !canOrder ? "Out of stock" : justAdded ? "Added" : isPending ? "Adding…" : "Add";
  const offPercent =
    selectedVariant?.mrpInPaise && selectedVariant.mrpInPaise > selectedVariant.priceInPaise
      ? Math.round(((selectedVariant.mrpInPaise - selectedVariant.priceInPaise) / selectedVariant.mrpInPaise) * 100)
      : 0;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-[0_8px_24px_-12px_oklch(0.2_0.03_268/0.25)]">
      {/* Duplicates the name link below, so it is hidden from assistive
          tech; touch and mouse users can still tap the picture. */}
      <Link
        href={`/product/${product.slug}`}
        aria-hidden="true"
        tabIndex={-1}
        className="relative block focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <ProductThumbnail
          imageUrl={product.imageUrl}
          alt={product.name}
          categorySlug={product.category.slug}
          categoryIcon={product.category.icon}
          className="aspect-square w-full rounded-none transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {offPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
            {offPercent}% off
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-foreground">
          <Link href={`/product/${product.slug}`} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        {product.school && (
          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
            <span className="sr-only">For </span>
            {product.school.name}
          </p>
        )}

        {selectedVariant && (
          <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-base font-bold tabular-nums">{formatPaise(selectedVariant.priceInPaise)}</span>
            <MrpPrice priceInPaise={selectedVariant.priceInPaise} mrpInPaise={selectedVariant.mrpInPaise} />
          </p>
        )}

        {selectedVariant && selectedVariant.stockStatus !== "IN_STOCK" && (
          <p className={cn("mt-0.5 text-xs font-semibold", STOCK_BADGE_CLASS[selectedVariant.stockStatus])}>
            {selectedVariant.stockStatus === "LOW_STOCK" ? "Only a few left" : STOCK_STATUS_LABEL[selectedVariant.stockStatus]}
          </p>
        )}

        <div className="mt-auto flex items-center gap-1.5 pt-2.5">
          {hasSizeChoice && selectedVariant && (
            <Select value={selectedVariantId} onValueChange={(id) => setSelectedVariantId(id as string)}>
              <SelectTrigger
                aria-label={`Size for ${product.name}`}
                className="h-9 w-auto min-w-0 max-w-[55%] shrink gap-1 rounded-lg border-border bg-card px-2.5 text-sm font-semibold [&>span]:truncate"
              >
                <SelectValue>{selectedVariant.size}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sortedVariants.map((variant) => {
                  const orderable = isOrderable(variant.stockStatus);
                  return (
                    <SelectItem key={variant.id} value={variant.id} disabled={!orderable}>
                      Size {variant.size}
                      {!orderable && " — out of stock"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          <button
            type="button"
            aria-label={
              selectedVariant ? `Add ${product.name} (Size ${selectedVariant.size}) to bag` : `Add ${product.name} to bag`
            }
            disabled={!canOrder || isPending}
            onClick={addToBag}
            className={cn(
              "flex h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-sm font-semibold transition-[background-color,transform] active:scale-[0.97] disabled:pointer-events-none",
              !canOrder
                ? "bg-muted text-muted-foreground"
                : justAdded
                  ? "bg-secondary text-foreground"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {justAdded && <Check className="size-4" aria-hidden />}
            <span className="truncate">{ctaLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
