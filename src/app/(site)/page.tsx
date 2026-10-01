/*
 * DIRECTION CONTRACT (homepage redesign, 2026-09-28)
 * THESIS: the whole family's shop in one scroll — uniforms, shoes, bags,
 *   kurtis and jeans side by side — with every school one tap away;
 *   refuses a big fixed hero and a lone school search box.
 * OWN-WORLD: Myntra/Flipkart-grade shopping app in black, red and grey
 *   only (owner's rule): near-black page, dark-grey cards, Klasiq Red for
 *   actions, light grey for the button on red, round grey category
 *   tiles, Fraunces wordmark only.
 * STORY: a parent sees "the whole family's clothes, here", trusts cash on
 *   delivery / pickup / 30 years, finds their school or browses a row.
 * FIRST VIEWPORT: pinned search (products, categories, schools), a row
 *   of round category tiles (Schools last), then the owner's banners
 *   (Admin → Banners); no fixed hero, by the owner's choice. Not school-only: the family shop
 *   leads; schools stay one tap away. The trust strip closes the page.
 * FORM: the category standard, by the owner's choice (seed cf0e2a27).
 * FINISH: unreviewed and undocumented is unfinished; this build ends with
 *   the finish review, the verdict, and DESIGN.md
 */
import Link from "next/link";
import type { Metadata } from "next";
import { Banknote, BadgeCheck, Store, Truck, ChevronRight } from "lucide-react";
import { CategoryCircles } from "@/components/home/category-circles";
import { ProductRail } from "@/components/home/product-rail";
import { PromoCarousel } from "@/components/home/promo-carousel";
import { SchoolCard } from "@/components/school/school-card";
import { SchoolSearch } from "@/components/site/school-search";
import { BRAND, STORE_CONTACT } from "@/lib/constants";
import { couponHeadline, describeCoupon } from "@/lib/coupons";
import { FULFILLMENT_CONFIG } from "@/lib/fulfillment-config";
import { formatPaise } from "@/lib/money";
import { getActivePromoBanners } from "@/server/queries/banners";
import { getGenericCategoryProducts, getHeaderCategories } from "@/server/queries/categories";
import { countActiveSchools, getActiveSchools } from "@/server/queries/schools";
import { getWebsiteCoupons } from "@/server/coupons/coupons";

export const metadata: Metadata = {
  description: BRAND.description,
};

const HOME_SCHOOL_LIMIT = 6;
const RAIL_PRODUCT_LIMIT = 10;
const MIN_RAIL_PRODUCTS = 3;

export default async function HomePage() {
  const [categories, banners, schools, schoolCount, coupons] = await Promise.all([
    getHeaderCategories(),
    getActivePromoBanners(),
    getActiveSchools(HOME_SCHOOL_LIMIT),
    countActiveSchools(),
    getWebsiteCoupons(),
  ]);
  const rails = (
    await Promise.all(
      categories.map(async (category) => ({
        category,
        products: await getGenericCategoryProducts(category.slug, undefined, RAIL_PRODUCT_LIMIT),
      })),
    )
  ).filter((rail) => rail.products.length > 0);
  // A category with only one or two products makes a mostly-empty row, so
  // those are shown together in one "More to shop" row instead.
  const fullRails = rails.filter((rail) => rail.products.length >= MIN_RAIL_PRODUCTS);
  const moreProducts = rails.filter((rail) => rail.products.length < MIN_RAIL_PRODUCTS).flatMap((rail) => rail.products);


  const promises = [
    { icon: Banknote, title: "Cash on delivery", detail: "Pay when it arrives" },
    ...(FULFILLMENT_CONFIG.deliveryEnabled
      ? [{ icon: Truck, title: "Free delivery", detail: `Above ${formatPaise(FULFILLMENT_CONFIG.freeDeliveryThresholdInPaise)}` }]
      : []),
    ...(FULFILLMENT_CONFIG.pickupEnabled ? [{ icon: Store, title: "Store pickup", detail: "Collect from our shop" }] : []),
    { icon: BadgeCheck, title: "30 saal ka bharosa", detail: "Serving local families" },
  ];

  return (
    <div className="flex flex-col divide-y divide-border">
      <CategoryCircles categories={categories} />


      {banners.length > 0 && (
        <div className="bg-card px-4 py-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <PromoCarousel slides={banners} />
          </div>
        </div>
      )}

      <div id="shop" className="flex scroll-mt-32 flex-col divide-y divide-border">
        {fullRails.map(({ category, products }) => (
          <ProductRail key={category.slug} title={category.name} href={`/${category.slug}`} products={products} />
        ))}
        {moreProducts.length > 0 && <ProductRail title="More to shop" products={moreProducts} />}
      </div>

      <section id="schools" aria-labelledby="home-schools" className="scroll-mt-32 bg-card py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="home-schools" className="text-xl font-bold tracking-tight sm:text-2xl">
                Find your school&rsquo;s uniform
              </h2>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Sahi school, sahi class, sahi size. Choose your school to see its exact uniform.
              </p>
            </div>
            <SchoolSearch size="hero" className="sm:max-w-sm" />
          </div>

          {schools.length > 0 ? (
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => (
                <li key={school.id}>
                  <SchoolCard school={school} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-2xl bg-muted px-4 py-5 text-sm text-muted-foreground">
              School lists are coming soon. Call us on {STORE_CONTACT.phone} and we&rsquo;ll tell you what we have for your school.
            </p>
          )}

          {schoolCount > schools.length && (
            <Link
              href="/schools"
              className="mt-4 flex min-h-11 items-center justify-center gap-1 rounded-xl border border-border text-sm font-bold text-deal transition-colors hover:bg-secondary"
            >
              See all {schoolCount} schools
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </section>


      <section aria-label="Why shop with us" className="bg-card">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {promises.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="flex items-center gap-3 bg-card px-4 py-3.5 sm:justify-center sm:py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-deal">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-5">{title}</span>
                <span className="block text-xs text-muted-foreground">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {coupons.length > 0 && (
        <section aria-labelledby="home-offers" className="bg-card py-5">
          <div className="mx-auto max-w-6xl">
            <h2 id="home-offers" className="px-4 text-lg font-bold tracking-tight sm:px-6 sm:text-xl">
              Offers for you
            </h2>
            <ul className="mt-3 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
              {coupons.map((coupon) => (
                <li
                  key={coupon.id}
                  className="relative flex w-64 shrink-0 snap-start flex-col rounded-2xl border border-dashed border-primary/60 bg-card p-4"
                >
                  <span className="text-lg font-extrabold text-foreground">{couponHeadline(coupon)}</span>
                  <span className="mt-0.5 text-sm text-foreground/75">{describeCoupon(coupon)}</span>
                  <span className="mt-3 w-fit rounded-lg bg-secondary px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-foreground ring-1 ring-primary/50">
                    {coupon.code}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
