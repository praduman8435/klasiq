"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { pickDefaultOrderableVariant } from "@/lib/basket-math";
import { addRecommendedSet } from "@/server/actions/basket";
import type { RecommendedSetWithItems } from "@/types/catalog";

const GENDER_LABEL: Partial<Record<RecommendedSetWithItems["gender"], string>> = {
  BOYS: "Boys",
  GIRLS: "Girls",
};

export function RecommendedSetCard({ set }: { set: RecommendedSetWithItems }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Mirrors the variant the server will actually add, so the estimate never
  // disagrees with what ends up in the bag.
  const estimatedTotalInPaise = set.items.reduce((sum, item) => {
    const defaultVariant = pickDefaultOrderableVariant(item.product.variants);
    const price = defaultVariant?.priceInPaise ?? item.product.variants[0]?.priceInPaise ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const subtitleParts = [set.class?.name, GENDER_LABEL[set.gender]].filter((part): part is string => Boolean(part));

  function handleAdd() {
    startTransition(async () => {
      const result = await addRecommendedSet({ setId: set.id });
      if (result.success) {
        toast.success(result.message ?? "Complete set added to your bag.");
        router.refresh();
      } else {
        toast.error(result.message ?? "Could not add the complete set.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h3 className="text-lg font-bold leading-snug">{set.name}</h3>
      {subtitleParts.length > 0 && !subtitleParts.every((part) => set.name.includes(part)) && (
        <p className="mt-0.5 text-sm text-muted-foreground">Complete set · {subtitleParts.join(" · ")}</p>
      )}
      {set.description && <p className="mt-1 text-sm text-muted-foreground">{set.description}</p>}

      <ul className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
        {set.items.map((item) => (
          <li key={item.id}>
            {item.quantity} &times; {item.product.name}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">Estimated total</span>
        <span className="text-base font-medium text-foreground">{formatPaise(estimatedTotalInPaise)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Sizes default to what&apos;s in stock — adjust in your bag.
      </p>

      <button
        type="button"
        disabled={isPending}
        onClick={handleAdd}
        className="mt-3 flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? "Adding..." : "Add Complete Set"}
      </button>
    </div>
  );
}
