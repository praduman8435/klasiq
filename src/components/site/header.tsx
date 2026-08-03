import Link from "next/link";
import { NAV_CATEGORIES } from "@/server/queries/categories";
import { SchoolSearch } from "@/components/site/school-search";
import { MobileNav } from "@/components/site/mobile-nav";
import { BagLink } from "@/components/site/bag-link";

export function SiteHeader({ storeName }: { storeName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <MobileNav />

        <Link
          href="/"
          className="shrink-0 font-heading text-lg font-semibold tracking-tight sm:text-xl"
        >
          {storeName}
        </Link>

        <nav
          aria-label="Categories"
          className="hidden items-center gap-1 md:flex"
        >
          {NAV_CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              {category.label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 justify-center px-4 lg:flex">
          <SchoolSearch size="compact" className="max-w-xs" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <BagLink />
        </div>
      </div>
    </header>
  );
}
