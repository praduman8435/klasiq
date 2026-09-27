"use client";

import { UNIFORM_SIZES } from "@/lib/product-sizes";
import { cn } from "@/lib/utils";

/** One-tap uniform sizes under a size field. */
export function SizeChips({ value, onPick }: { value: string; onPick: (size: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common sizes">
      {UNIFORM_SIZES.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onPick(s)}
          className={cn(
            "h-8 min-w-10 rounded-full border px-3 text-xs tabular-nums transition-colors",
            value === s ? "border-primary bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
