import Link from "next/link";
import { getHeaderCategories } from "@/server/queries/categories";
import { CategoryNavLink } from "@/components/site/category-nav-link";
import { SchoolSearch } from "@/components/site/school-search";
import { MobileNav } from "@/components/site/mobile-nav";
import { BagLink } from "@/components/site/bag-link";
import { TrackOrdersLink } from "@/components/site/track-orders-link";
import { BrandWordmark } from "@/components/site/brand-wordmark";
import { FULFILLMENT_CONFIG } from "@/lib/fulfillment-config";

/**
 * Storefront header, shopping-app style. Phones: menu, wordmark, Orders
 * and Bag on one row, and the one search box (schools + products) full
 * width under it — both rows stay pinned, so search is always a thumb
 * away. Desktop: a single row with the category links.
 */
export async function SiteHeader({ storeName, bagCount }: { storeName: string; bagCount: number }) {
  const categories = await getHeaderCategories();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-2 sm:gap-3 sm:px-6 md:h-16">
        <MobileNav
          categories={categories}
          bagCount={bagCount}
          serviceableAreaNote={FULFILLMENT_CONFIG.serviceableAreaNote}
        />

        <Link href="/" aria-label={`${storeName} home`} className="shrink-0 rounded-md px-1.5 py-1 md:px-0">
          <BrandWordmark />
        </Link>

        <nav aria-label="Categories" className="relative ml-4 hidden min-w-0 items-center lg:flex">
          {categories.map((category) => (
            <CategoryNavLink
              key={category.slug}
              slug={category.slug}
              name={category.name}
              className="relative shrink-0 whitespace-nowrap px-2.5 py-5 text-sm font-semibold text-foreground/75 transition-colors after:absolute after:inset-x-2.5 after:bottom-0 after:h-[3px] after:rounded-t-full after:bg-transparent hover:text-foreground"
              activeClassName="text-primary after:bg-primary"
            />
          ))}
        </nav>

        <div className="mx-4 hidden min-w-0 flex-1 md:block lg:max-w-sm xl:max-w-md">
          <SchoolSearch size="header" withProducts />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          <TrackOrdersLink
            className="flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm"
            activeClassName="text-primary"
            iconClassName="size-5"
          >
            Orders
          </TrackOrdersLink>
          <BagLink count={bagCount} />
        </div>
      </div>

      <div className="px-3 pb-2.5 md:hidden">
        <SchoolSearch size="header" withProducts />
      </div>
    </header>
  );
}
