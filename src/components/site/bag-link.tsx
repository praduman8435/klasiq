import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function BagLink({ count, className }: { count: number; className?: string }) {

  return (
    <Link
      href="/bag"
      className={cn(
        "relative flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm",
        className,
      )}
      aria-label={count > 0 ? `Bag, ${count} item${count === 1 ? "" : "s"}` : "Bag, empty"}
    >
      <span className="relative">
        <ShoppingBag className="size-5" aria-hidden />
        {count > 0 && (
          <span
            aria-hidden
            className="absolute -right-2 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold leading-none text-primary-foreground ring-2 ring-background"
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </span>
      Bag
    </Link>
  );
}
