import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryProductGrid } from "@/components/product/category-product-grid";
import { ProductSearchForm } from "@/components/product/product-search-form";
import { productSearchQuerySchema } from "@/lib/validation/product-search";
import { cn } from "@/lib/utils";
import { getCategoryBySlug, getCategoryListingProducts, getCategorySchools } from "@/server/queries/categories";

type PageProps = {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ q?: string; school?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return {};

  return {
    title: category.name,
    description: category.description ?? `Browse ${category.name}.`,
    alternates: { canonical: `/${category.slug}` },
  };
}

function hrefWith(base: string, params: { q?: string; school?: string }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.school) search.set("school", params.school);
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * A category page. Lists general products and every school's own items
 * (so Uniforms shows every school's uniform), with a chip per school that
 * has items here to narrow the list to that school.
 */
export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { categorySlug } = await params;
  const { q, school } = await searchParams;
  const category = await getCategoryBySlug(categorySlug);
  if (!category) notFound();

  const parsedQuery = productSearchQuerySchema.safeParse({ q });
  const query = parsedQuery.success ? parsedQuery.data.q : undefined;

  const schools = await getCategorySchools(category.slug);
  const selectedSchool = schools.find((s) => s.slug === school);
  const products = await getCategoryListingProducts(category.slug, { query, schoolSlug: selectedSchool?.slug });
  const base = `/${category.slug}`;

  const chipClass = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/85 hover:bg-secondary",
    );

  return (
    <CategoryProductGrid
      title={selectedSchool ? `${category.name} · ${selectedSchool.name}` : category.name}
      description={category.description ?? undefined}
      products={products}
      headerExtra={<ProductSearchForm action={base} query={query} />}
      beforeGrid={
        schools.length > 0 ? (
          <nav aria-label="Filter by school" className="-mx-4 mt-4 sm:mx-0">
            <ul className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
              <li>
                <Link href={hrefWith(base, { q: query })} aria-current={!selectedSchool ? "page" : undefined} className={chipClass(!selectedSchool)}>
                  All
                </Link>
              </li>
              {schools.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={hrefWith(base, { q: query, school: s.slug })}
                    aria-current={selectedSchool?.slug === s.slug ? "page" : undefined}
                    className={chipClass(selectedSchool?.slug === s.slug)}
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : undefined
      }
      emptyState={
        query ? (
          <>
            No products in {category.name} match &quot;{query}&quot;. Try a different search, or{" "}
            <Link href={hrefWith(base, { school: selectedSchool?.slug })} className="underline underline-offset-2">
              clear the search
            </Link>
            .
          </>
        ) : (
          "No products are available in this category yet. Please check back soon."
        )
      }
    />
  );
}
