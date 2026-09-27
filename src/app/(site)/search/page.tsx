import type { Metadata } from "next";
import Link from "next/link";
import { CategoryProductGrid } from "@/components/product/category-product-grid";
import { ProductSearchForm } from "@/components/product/product-search-form";
import { productSearchQuerySchema } from "@/lib/validation/product-search";
import { SchoolCard } from "@/components/school/school-card";
import { searchListingProducts } from "@/server/queries/categories";
import { searchSchools } from "@/server/queries/schools";

type PageProps = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const parsed = productSearchQuerySchema.safeParse({ q });
  const query = parsed.success ? parsed.data.q : undefined;

  return {
    title: query ? `Search: ${query}` : "Search",
    // Search-result pages are thin/duplicate content by nature (the same
    // catalog, sliced by an arbitrary query string) — never indexed,
    // mirroring the same choice already made for /bag and /checkout.
    robots: { index: false },
  };
}

/**
 * Phase 3.7 Part 2 — the standalone, cross-category product search page
 * (`/search?q=...`). Deliberately does NOT query the database at all
 * when `q` is absent/empty after validation — there is no "browse
 * everything" mode hiding behind an empty search box; an empty query is
 * its own honest state; the "not-found" bookkeeping. See
 * `searchGenericProducts` (src/server/queries/categories.ts) for the
 * shared, parameterized query this delegates to — identical to what
 * `/[categorySlug]?q=` uses, just without a category constraint.
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const parsed = productSearchQuerySchema.safeParse({ q });
  const query = parsed.success ? parsed.data.q : undefined;

  const [products, schools] = query
    ? await Promise.all([searchListingProducts(query), searchSchools(query, 6)])
    : [[], []];

  return (
    <CategoryProductGrid
      title={query ? `“${query}”` : "Search"}
      description={query ? undefined : "Search by school or product name."}
      products={products}
      headerExtra={<ProductSearchForm action="/search" query={query} placeholder="Search school, uniform, shoes…" />}
      beforeGrid={
        schools.length > 0 ? (
          <section aria-labelledby="search-schools" className="mt-6">
            <h2 id="search-schools" className="text-base font-bold">
              Schools
            </h2>
            <ul className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => (
                <li key={school.id}>
                  <SchoolCard school={school} />
                </li>
              ))}
            </ul>
            {products.length > 0 && <h2 className="mt-6 text-base font-bold">Products</h2>}
          </section>
        ) : undefined
      }
      emptyState={
        query ? (
          <>
            {schools.length > 0 ? (
              <>No products match that name. Open the school above, or{" "}</>
            ) : (
              <>Nothing found for &quot;{query}&quot;. Try a different search, or{" "}</>
            )}
            <Link href="/" className="underline underline-offset-2">
              browse categories
            </Link>
            .
          </>
        ) : (
          <>Type a school or product name above, like &quot;shirt&quot;, &quot;shoes&quot; or &quot;bag&quot;.</>
        )
      }
    />
  );
}
