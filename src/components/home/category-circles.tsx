import Link from "next/link";
import { School as SchoolIcon } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { getCategoryTint } from "@/lib/category-style";
import { cn } from "@/lib/utils";

/**
 * The row of round category tiles at the top of the homepage, shopping-app
 * style. "Schools" comes first, so a parent looking for a uniform is one
 * tap from the school list. Scrolls sideways on phones; centred on desktop.
 */
export function CategoryCircles({ categories }: { categories: { slug: string; name: string }[] }) {
  const items = [
    { href: "/schools", name: "Schools", icon: SchoolIcon, tint: "bg-primary text-primary-foreground" },
    ...categories.map((category) => {
      const tint = getCategoryTint(category.slug || category.name);
      return {
        href: `/${category.slug}`,
        name: category.name,
        icon: getCategoryIcon(category.slug || category.name),
        tint: cn(tint.bg, tint.fg),
      };
    }),
  ];

  return (
    <nav aria-label="Shop by category" className="bg-card">
      <ul className="mx-auto flex max-w-6xl snap-x gap-1 overflow-x-auto px-2 pb-3 pt-3 [scrollbar-width:none] sm:justify-center sm:gap-3 sm:px-6 sm:pb-4 sm:pt-4 [&::-webkit-scrollbar]:hidden">
        {items.map(({ href, name, icon: Icon, tint }) => (
          <li key={href} className="shrink-0 snap-start">
            <Link href={href} className="group flex w-19 flex-col items-center gap-1.5 rounded-xl p-1 text-center sm:w-24">
              <span
                className={cn(
                  "flex size-15 items-center justify-center rounded-full transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-95 sm:size-18",
                  tint,
                )}
              >
                <Icon className="size-7 sm:size-8" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-foreground sm:text-sm">{name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
