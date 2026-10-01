"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, Check, ChevronRight, Minus, Plus, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductThumbnail } from "@/components/product/product-thumbnail";
import { formatPaise } from "@/lib/money";
import { MrpPrice } from "@/components/product/mrp-price";
import { FULFILLMENT_CONFIG } from "@/lib/fulfillment-config";
import { isOrderable } from "@/lib/stock";
import { cn } from "@/lib/utils";
import { addToBasket } from "@/server/actions/basket";
import type { ProductDetail as ProductDetailData } from "@/server/queries/products";

const STOCK_NOTE: Record<string, { text: string; className: string } | null> = {
  IN_STOCK: null,
  LOW_STOCK: { text: "Only a few left", className: "text-deal" },
  OUT_OF_STOCK: { text: "Out of stock", className: "text-muted-foreground" },
};

/**
 * Phase 3.7 Part 7 (PDP redesign) — dark-first (`RouteThemeScope`
 * applies `.dark` on both "/" and every "/product/*" route), compact,
 * editorial. Still reuses the exact same interaction model `ProductCard`
 * established (default-variant selection, quantity clamp, `addToBasket`
 * Server Action, Add/Buy Now pairing) — only the LAYOUT and visual
 * hierarchy changed, never the commerce logic underneath.
 *
 * Two deliberate visual changes from the prior pass:
 * 1. The whole purchase panel no longer sits inside its own bordered
 *    card — price/size/quantity/actions/fulfillment sit directly on the
 *    page canvas, separated by a hairline divider and spacing rhythm
 *    alone ("the page should breathe," not card-inside-card).
 * 2. Add to Bag is the PRIMARY (solid Klasiq Red) action and Buy Now is
 *    SECONDARY (outline) — the reverse of the prior visual weighting.
 *    Behavior is identical to before: Add to Bag never navigates away,
 *    Buy Now still adds then jumps straight to `/bag`.
 *
 * Critique-driven fixes on top of that first pass: the mobile sticky bar
 * now carries a compact Buy Now alongside Add to Bag (it previously
 * dropped Buy Now entirely, undercutting the "fast path" this component
 * exists to protect); the size selector uses real single-choice
 * semantics (`role="radiogroup"`/`radio`/`aria-checked`, not
 * `aria-pressed`, which describes an independent toggle, not "one of
 * many"); a failed add now gets the same order of inline visual care as
 * a successful one, not just a toast; and the fulfillment list lost its
 * own divider (three stacked hairlines in one short column read as
 * decoration, not the breathing room they were meant to create).
 */
export function ProductDetail({ product }: { product: ProductDetailData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const sortedVariants = useMemo(
    () => [...product.variants].sort((a, b) => a.sortOrder - b.sortOrder),
    [product.variants],
  );
  const defaultVariant = sortedVariants.find((v) => isOrderable(v.stockStatus)) ?? sortedVariants[0];

  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id);
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = sortedVariants.find((v) => v.id === selectedVariantId);
  const canOrder = selectedVariant ? isOrderable(selectedVariant.stockStatus) : false;
  const maxQuantity = selectedVariant ? Math.max(1, Math.min(selectedVariant.stockQuantity, 20)) : 1;

  const sizeButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sizeRowRef = useRef<HTMLDivElement>(null);
  const [sizeRowOverflows, setSizeRowOverflows] = useState(false);

  // A product with enough sizes to need the row's own horizontal scroll
  // (see `overflow-x-auto` below) otherwise gives no visual cue that more
  // sizes exist past the visible edge — this fade is that cue.
  useEffect(() => {
    const el = sizeRowRef.current;
    if (!el) return;
    const checkOverflow = () => setSizeRowOverflows(el.scrollWidth > el.clientWidth + 1);
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sortedVariants.length]);

  function selectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    setQuantity(1);
  }

  // Roving tabindex per the WAI-ARIA radiogroup pattern: only the
  // checked size is a Tab stop, arrow keys move both focus and
  // selection between the rest — matches how a native <input
  // type="radio"> group already behaves.
  function handleSizeKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const delta =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (delta === 0) return;
    event.preventDefault();
    const nextIndex = (index + delta + sortedVariants.length) % sortedVariants.length;
    const nextVariant = sortedVariants[nextIndex];
    selectVariant(nextVariant.id);
    sizeButtonRefs.current[nextIndex]?.focus();
  }

  function addToBag(onSuccess?: () => void) {
    if (!selectedVariant || !canOrder) return;
    setAddError(null);
    startTransition(async () => {
      try {
        const result = await addToBasket({
          productVariantId: selectedVariant.id,
          quantity,
        });
        if (result.success) {
          toast.success(`Added ${product.name} (Size ${selectedVariant.size}) to your bag.`);
          router.refresh();
          if (onSuccess) {
            onSuccess();
          } else {
            // Buy Now navigates away immediately, so the inline
            // confirmation below only makes sense for a plain Add to Bag —
            // the brief's own "don't rely only on a tiny toast" concern is
            // about the case where the customer stays on this page.
            setJustAdded(true);
          }
        } else {
          const message = result.message ?? "Could not add to bag.";
          toast.error(message);
          // Same inline-visibility treatment as the success path — a
          // failed add previously only showed a toast, which disappears
          // and leaves no trace, unlike the deliberate care put into
          // confirming success.
          setAddError(message);
        }
      } catch {
        // A thrown network/server failure (dropped connection, 500) is
        // just as real a purchase-attempt failure as a declined
        // `{success:false}` result, and losing the selected size/quantity
        // to an uncaught-promise error boundary is the worst possible
        // moment for that — so it gets the exact same inline treatment.
        const message = "Something went wrong adding this to your bag. Please try again.";
        toast.error(message);
        setAddError(message);
      }
    });
  }

  useEffect(() => {
    if (!justAdded) return;
    const timeout = setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(timeout);
  }, [justAdded]);

  useEffect(() => {
    if (!addError) return;
    const timeout = setTimeout(() => setAddError(null), 4000);
    return () => clearTimeout(timeout);
  }, [addError]);

  const hasVariants = sortedVariants.length > 0;
  const offPercent =
    selectedVariant?.mrpInPaise && selectedVariant.mrpInPaise > selectedVariant.priceInPaise
      ? Math.round(((selectedVariant.mrpInPaise - selectedVariant.priceInPaise) / selectedVariant.mrpInPaise) * 100)
      : 0;

  return (
    <div className="mx-auto max-w-6xl pb-6 sm:px-6 sm:py-8 lg:py-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground sm:px-0 sm:pt-0 sm:text-sm">
        <Link href="/" className="underline-offset-2 hover:text-foreground hover:underline">
          Home
        </Link>
        <ChevronRight className="size-3.5 shrink-0" aria-hidden />
        <Link
          href={`/${product.category.slug}`}
          className="underline-offset-2 hover:text-foreground hover:underline"
        >
          {product.category.name}
        </Link>
      </nav>

      <div className="grid sm:mt-2 sm:grid-cols-2 sm:gap-10 lg:gap-14">
        <ProductThumbnail
          imageUrl={product.imageUrl}
          alt={product.name}
          categorySlug={product.category.slug}
            categoryIcon={product.category.icon}
          large
          className="aspect-square w-full overflow-hidden sm:sticky sm:top-36 sm:rounded-2xl sm:border sm:border-border"
        />

        {/* `min-w-0` is required, not decorative: a grid/flex item's
            default `min-width: auto` means it won't shrink below its
            content's intrinsic width, so the size row's own
            `overflow-x-auto` (below) can't do its job without this —
            without it, a product with enough sizes to need scrolling
            instead silently widens this whole column (and the page)
            past the viewport. */}
        <div className="flex min-w-0 flex-col px-4 pt-5 sm:px-0 sm:pt-0">
          <p className="text-xs font-semibold text-muted-foreground">{product.category.name}</p>
          <h1 className="mt-1 text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{product.name}</h1>
          {product.school && (
            <p className="mt-1.5 text-xs font-medium text-muted-foreground">
              Exclusive to {product.school.name}
            </p>
          )}

          {!hasVariants ? (
            <div className="mt-6 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              This item is currently unavailable. Please check back soon or browse{" "}
              <Link href={`/${product.category.slug}`} className="underline underline-offset-2">
                other {product.category.name}
              </Link>
              .
            </div>
          ) : (
            <>
              {selectedVariant && (
                <div className="mt-4">
                  <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-3xl font-bold tabular-nums tracking-tight">
                      {formatPaise(selectedVariant.priceInPaise)}
                    </span>
                    <MrpPrice priceInPaise={selectedVariant.priceInPaise} mrpInPaise={selectedVariant.mrpInPaise} className="text-sm" />
                    {offPercent > 0 && <span className="text-sm font-bold text-deal">{offPercent}% off</span>}
                  </p>
                  {STOCK_NOTE[selectedVariant.stockStatus] && (
                    <p className={cn("mt-1 text-sm font-semibold", STOCK_NOTE[selectedVariant.stockStatus]!.className)}>
                      {STOCK_NOTE[selectedVariant.stockStatus]!.text}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5 h-px bg-border" aria-hidden />

              {/* `min-w-0` overrides `<fieldset>`'s own browser-default
                  `min-width: min-content` — without it, the fieldset
                  refuses to shrink below the size row's unwrapped content
                  width regardless of any flex/grid `min-w-0` upstream,
                  reintroducing the exact page-level horizontal overflow
                  the scrollable row was meant to prevent. */}
              <fieldset className="mt-5 min-w-0">
                <legend className="text-sm font-bold text-foreground">
                  Size{selectedVariant ? <span className="font-medium text-muted-foreground">: {selectedVariant.size}</span> : null}
                </legend>
                {/* `role="radiogroup"`/`radio` (not `aria-pressed`, which
                    describes an independent on/off toggle) — this is a
                    single choice among many, and a screen reader should
                    hear it that way. */}
                {/* A real scroller, never an awkward multi-line wrap — the
                    same convention the homepage's category rail already
                    established for "many items, one row." The trailing
                    fade (rendered only when the row actually overflows)
                    is the visual cue that more sizes exist past the
                    edge — without it, whether a shopper notices the row
                    scrolls at all depends on accidental pixel math at
                    their specific viewport width. */}
                <div className="relative mt-3">
                  <div
                    ref={sizeRowRef}
                    role="radiogroup"
                    aria-label="Size"
                    className="flex flex-nowrap gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {sortedVariants.map((variant, index) => {
                      const orderable = isOrderable(variant.stockStatus);
                      const isSelected = variant.id === selectedVariantId;
                      return (
                        <button
                          key={variant.id}
                          ref={(el) => {
                            sizeButtonRefs.current[index] = el;
                          }}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`Size ${variant.size}${orderable ? "" : " — out of stock"}`}
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() => selectVariant(variant.id)}
                          onKeyDown={(event) => handleSizeKeyDown(event, index)}
                          className={cn(
                            "min-h-11 min-w-12 shrink-0 rounded-xl border px-4 text-sm font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-foreground hover:bg-secondary",
                            !orderable && "text-muted-foreground line-through opacity-50",
                          )}
                        >
                          {variant.size}
                        </button>
                      );
                    })}
                  </div>
                  {sizeRowOverflows && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
                    />
                  )}
                </div>
              </fieldset>

              <div className="mt-5 flex items-center gap-2.5">
                <div className="flex h-11 shrink-0 items-center rounded-xl border border-border bg-card">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={!canOrder || quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-full w-9 items-center justify-center text-muted-foreground disabled:opacity-40"
                  >
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                  <span aria-live="polite" className="w-6 text-center text-sm font-medium tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={!canOrder || quantity >= maxQuantity}
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    className="flex h-full w-9 items-center justify-center text-muted-foreground disabled:opacity-40"
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </div>

                {/* Hidden below `sm`: the mobile sticky bar (below) is the
                    sole purchase mechanism on small screens, so a customer
                    is never shown two "Add to Bag"/"Buy Now" pairs at
                    once. Both places call the identical `addToBag()`. */}
                <Button
                  type="button"
                  className="hidden h-11 flex-1 sm:inline-flex"
                  disabled={!canOrder || isPending}
                  onClick={() => addToBag()}
                >
                  {justAdded ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="size-4" aria-hidden />
                      Added
                    </span>
                  ) : isPending ? (
                    "Adding…"
                  ) : (
                    "Add to Bag"
                  )}
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                className="mt-2.5 hidden h-11 w-full sm:block"
                disabled={!canOrder || isPending}
                onClick={() => addToBag(() => router.push("/bag"))}
              >
                Buy Now
              </Button>

              {addError && (
                <p role="alert" className="mt-2.5 text-sm font-medium text-destructive">
                  {addError}
                </p>
              )}

              <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
                {FULFILLMENT_CONFIG.deliveryEnabled && (
                  <InfoRow icon={Truck} title="Home delivery">
                    Free above {formatPaise(FULFILLMENT_CONFIG.freeDeliveryThresholdInPaise)}, or within{" "}
                    {(FULFILLMENT_CONFIG.freeDeliveryRadiusMeters / 1000).toLocaleString("en-IN")} km of the shop
                  </InfoRow>
                )}
                {FULFILLMENT_CONFIG.pickupEnabled && (
                  <InfoRow icon={Store} title="Store pickup">
                    Free. Collect from our shop
                  </InfoRow>
                )}
                <InfoRow icon={Banknote} title="Cash on delivery">
                  Pay when you get it, at home or at the shop
                </InfoRow>
              </ul>

              {product.description && (
                <section aria-labelledby="product-details-heading" className="mt-6">
                  <h2 id="product-details-heading" className="text-base font-bold">
                    Product details
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Phones: the sticky Buy now / Add to Bag bar is the only purchase control
          (the in-page buttons are hidden below `sm`); both call the same
          `addToBag()`. `data-sticky-bar` gives the footer room for it (globals.css). */}
      {hasVariants && (
        <>
          <div data-sticky-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pt-2.5 backdrop-blur supports-backdrop-filter:bg-background/85 sm:hidden">
            <div className="flex gap-2 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-border bg-card text-base font-bold transition-colors active:bg-secondary disabled:opacity-50"
                disabled={!canOrder || isPending}
                onClick={() => addToBag(() => router.push("/bag"))}
              >
                Buy now
              </button>
              <button
                type="button"
                className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-base font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
                disabled={!canOrder || isPending}
                onClick={() => addToBag()}
              >
                {justAdded ? (
                  <>
                    <Check className="size-4" aria-hidden />
                    Added
                  </>
                ) : isPending ? (
                  "Adding…"
                ) : !canOrder ? (
                  "Out of stock"
                ) : (
                  "Add to Bag"
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, title, children }: { icon: typeof Truck; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-deal">
        <Icon className="size-4.5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-muted-foreground">{children}</span>
      </span>
    </li>
  );
}
