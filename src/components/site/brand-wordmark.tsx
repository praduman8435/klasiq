import { cn } from "@/lib/utils";

/** The Klasiq wordmark: Fraunces, with a red full stop. */
export function BrandWordmark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      className={cn(
        "font-display text-2xl font-bold leading-none tracking-[-0.02em]",
        "text-foreground",
        className,
      )}
    >
      Klasiq<span className={inverted ? "text-white/60" : "text-primary"}>.</span>
    </span>
  );
}
