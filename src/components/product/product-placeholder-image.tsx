import { Backpack, Footprints, Shirt } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<string, typeof Shirt> = {
  uniforms: Shirt,
  shoes: Footprints,
  socks: Shirt,
  "school-bags": Backpack,
};

export function ProductPlaceholderImage({
  categorySlug,
  className,
}: {
  categorySlug: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICON[categorySlug] ?? Shirt;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-secondary to-muted",
        className,
      )}
    >
      <Icon
        aria-hidden
        className="size-10 text-muted-foreground/50 sm:size-12"
        strokeWidth={1.25}
      />
      <span className="absolute bottom-1.5 right-1.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        Placeholder
      </span>
    </div>
  );
}
