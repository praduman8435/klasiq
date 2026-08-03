"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import { pickDefaultOrderableVariant } from "@/lib/basket-math";
import { addRecommendedSet } from "@/server/actions/basket";
import type { RecommendedSetWithItems } from "@/types/catalog";

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
    <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Recommended Complete Uniform
      </p>
      <h3 className="mt-1 font-heading text-xl font-semibold">{set.name}</h3>
      {set.description && (
        <p className="mt-1 text-sm text-muted-foreground">{set.description}</p>
      )}

      <ul className="mt-4 space-y-1.5 text-sm">
        {set.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span>
              {item.quantity} &times; {item.product.name}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Estimated total:{" "}
          <span className="font-semibold text-foreground">
            {formatPaise(estimatedTotalInPaise)}
          </span>
          <span className="block text-xs">
            Sizes default to what&apos;s in stock — adjust in your bag.
          </span>
        </p>
        <Button
          type="button"
          disabled={isPending}
          onClick={handleAdd}
          className="sm:w-auto"
        >
          Add Complete Set
        </Button>
      </div>
    </div>
  );
}
