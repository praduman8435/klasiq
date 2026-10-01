import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { LISTABLE_PRODUCT } from "@/server/queries/search";

/**
 * Phase 3.6.7 Part 1 — section 6's "the storefront header must become:
 * SELECT Categories WHERE DisplayInHeader = true ORDER BY HeaderOrder."
 * THE single source of truth for what the header nav shows, replacing
 * the previous hardcoded `NAV_CATEGORIES` constant. No caller of this
 * function needs to know a category's internal id — only what a link
 * needs (slug, name).
 *
 * Ties in `headerOrder` (shouldn't happen — see the admin action's own
 * conflict check) are broken by name for a deterministic, never-random
 * render order.
 */
export async function getHeaderCategories() {
  return db.category.findMany({
    where: { displayInHeader: true },
    orderBy: [{ headerOrder: "asc" }, { name: "asc" }],
    select: { slug: true, name: true, icon: true },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

export type BrowseFallbackCategory = { slug: string; name: string };

const UNIFORM_LIKE_CATEGORY = /uniform/i;

/**
 * The "browse instead" escape hatch shown when a school search, or a
 * school's own gender/class selection, comes up empty. Never a hardcoded
 * slug — prefers a uniform-like category from the live, admin-managed
 * list (the natural adjacent aisle for this flow), falls back to the
 * first header category if none match, and `null` only when no header
 * categories exist at all (callers fall back to the always-available
 * /search page in that case). Keeps working if "Uniforms" is renamed,
 * hidden, or removed by the admin.
 */
export function pickBrowseFallbackCategory(
  categories: BrowseFallbackCategory[],
): BrowseFallbackCategory | null {
  return (
    categories.find(
      (c) => UNIFORM_LIKE_CATEGORY.test(c.slug) || UNIFORM_LIKE_CATEGORY.test(c.name),
    ) ??
    categories[0] ??
    null
  );
}

// Phase 3.7 Part 2 — this is a single small storefront (seed data tops
// out at a couple dozen products per category); a plain result cap is a
// sensible, honest bound against an abusive/unbounded query without
// building real pagination for a catalog that doesn't need it yet. See
// docs/PHASE_3_7_REPORT.md Part 2 "Performance".
const GENERIC_PRODUCT_RESULT_LIMIT = 60;

/**
 * THE shared query behind both category browsing (`getGenericCategoryProducts`)
 * and cross-category product search (`searchGenericProducts`) — one
 * `where` builder, never two parallel implementations of "which generic
 * products match." Only generic products are ever returned (`schoolId:
 * null`) — a parent browsing/searching without a selected school should
 * never see another school's exclusive product; this mirrors the
 * pre-existing rule `getGenericCategoryProducts` already enforced,
 * unchanged. `query`, when given, matches product name OR description,
 * case-insensitively, via Prisma's parameterized `contains` — never raw
 * SQL, never string-concatenated into a query.
 */
async function findGenericProducts(params: { categorySlug?: string; query?: string; limit?: number }) {
  const trimmedQuery = params.query?.trim();

  return db.product.findMany({
    where: {
      isActive: true,
      schoolId: null,
      ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
      ...(trimmedQuery
        ? {
            OR: [
              { name: { contains: trimmedQuery, mode: "insensitive" } },
              { description: { contains: trimmedQuery, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      category: { select: { slug: true, name: true, icon: true } },
    },
    take: params.limit ?? GENERIC_PRODUCT_RESULT_LIMIT,
  });
}

/**
 * Products for a standalone category browse page (e.g. /uniforms), with
 * an optional in-category search term (e.g. /uniforms?q=shirt — Phase
 * 3.7 Part 2). Category filtering and search are the SAME `where`
 * clause combined with AND, never a client-side post-filter — a search
 * inside "Shoes" can structurally never surface a "Uniforms" product.
 * `limit` defaults to the real production cap; tests override it to
 * exercise the cap itself without seeding 60+ rows, mirroring
 * `searchSchools(query, limit)`'s own precedent.
 */
export async function getGenericCategoryProducts(categorySlug: string, query?: string, limit?: number) {
  return findGenericProducts({ categorySlug, query, limit });
}

/**
 * Cross-category product search for the standalone /search page (Phase
 * 3.7 Part 2) — every generic, active product/category, no category
 * constraint. Deliberately requires a non-empty `query` — returns `[]`
 * without ever touching the database for an empty/whitespace-only one;
 * there is no "browse everything" mode hiding behind an empty search
 * box, matching the /search page's own guard (defense in depth: true
 * even if a future caller invokes this directly without that page's
 * own truthy-check).
 */
export async function searchGenericProducts(query: string, limit?: number) {
  if (!query.trim()) return [];
  return findGenericProducts({ query, limit });
}

/**
 * Phase 3.7 Part 7 (homepage redesign) — a small, category-diverse sample
 * of real generic products for the homepage's "Shop the essentials"
 * teaser. Reuses `findGenericProducts` (never a second parallel query),
 * then prefers one product per distinct category so a 5-item teaser
 * doesn't accidentally read as "5 uniforms" just because uniforms sorts
 * first alphabetically — filling any remaining slots from the same
 * result set if there aren't enough distinct categories. Every product
 * returned is real, active, generic (schoolId: null) data; nothing here
 * invents a product, price, or image.
 */
export async function getFeaturedGenericProducts(limit = 5) {
  const pool = await findGenericProducts({ limit: limit * 6 });

  const seenCategories = new Set<string>();
  const diverse: typeof pool = [];
  for (const product of pool) {
    if (diverse.length >= limit) break;
    if (seenCategories.has(product.category.slug)) continue;
    seenCategories.add(product.category.slug);
    diverse.push(product);
  }
  if (diverse.length < limit) {
    for (const product of pool) {
      if (diverse.length >= limit) break;
      if (diverse.includes(product)) continue;
      diverse.push(product);
    }
  }
  return diverse;
}

const LISTING_INCLUDE = {
  variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
  category: { select: { slug: true, name: true, icon: true } },
  school: { select: { slug: true, name: true } },
} satisfies Prisma.ProductInclude;

export type ListingProduct = Prisma.ProductGetPayload<{ include: typeof LISTING_INCLUDE }>;

function nameMatches(query?: string): Prisma.ProductWhereInput {
  const trimmed = query?.trim();
  if (!trimmed) return {};
  return {
    OR: [
      { name: { contains: trimmed, mode: "insensitive" } },
      { description: { contains: trimmed, mode: "insensitive" } },
      { school: { name: { contains: trimmed, mode: "insensitive" } } },
    ],
  };
}

/**
 * Everything a category page shows: general products AND every school's
 * own uniform items (labelled with their school on the card), so the
 * Uniforms page really has every uniform. `schoolSlug` narrows to one
 * school — its own items plus the general items assigned to it.
 */
export async function getCategoryListingProducts(
  categorySlug: string,
  options: { query?: string; schoolSlug?: string } = {},
): Promise<ListingProduct[]> {
  return db.product.findMany({
    where: {
      AND: [
        LISTABLE_PRODUCT,
        { category: { slug: categorySlug } },
        nameMatches(options.query),
        options.schoolSlug
          ? { OR: [{ school: { slug: options.schoolSlug } }, { assignments: { some: { school: { slug: options.schoolSlug } } } }] }
          : {},
      ],
    },
    orderBy: [{ schoolId: { sort: "asc", nulls: "first" } }, { name: "asc" }],
    include: LISTING_INCLUDE,
    take: GENERIC_PRODUCT_RESULT_LIMIT * 2,
  });
}

/** The schools that have uniform items in a category (their own, or
 * general items assigned to them) — the chips on the category page. */
export async function getCategorySchools(categorySlug: string) {
  return db.school.findMany({
    where: {
      isActive: true,
      OR: [
        { uniformProducts: { some: { isActive: true, category: { slug: categorySlug } } } },
        { assignments: { some: { product: { isActive: true, category: { slug: categorySlug } } } } },
      ],
    },
    orderBy: [{ isDemo: "asc" }, { name: "asc" }],
    select: { slug: true, name: true },
  });
}

/** The /search page: every listable product, school items included. */
export async function searchListingProducts(query: string): Promise<ListingProduct[]> {
  if (!query.trim()) return [];
  return db.product.findMany({
    where: { AND: [LISTABLE_PRODUCT, nameMatches(query)] },
    orderBy: [{ schoolId: { sort: "asc", nulls: "first" } }, { name: "asc" }],
    include: LISTING_INCLUDE,
    take: GENERIC_PRODUCT_RESULT_LIMIT,
  });
}

const RECOMMENDATION_LIMIT = 10;

/** "Similar products" on a product page: the same category, this product
 * left out. General items first, then school items. */
export async function getSimilarProducts(product: { id: string; categoryId: string }): Promise<ListingProduct[]> {
  return db.product.findMany({
    where: { AND: [LISTABLE_PRODUCT, { categoryId: product.categoryId }, { id: { not: product.id } }] },
    orderBy: [{ schoolId: { sort: "asc", nulls: "first" } }, { name: "asc" }],
    include: LISTING_INCLUDE,
    take: RECOMMENDATION_LIMIT,
  });
}

/** "More for <school>" on a school item's page: that school's own items
 * and the general items assigned to it, from every category. */
export async function getMoreForSchool(schoolId: string, excludeId: string): Promise<ListingProduct[]> {
  return db.product.findMany({
    where: {
      AND: [
        LISTABLE_PRODUCT,
        { id: { not: excludeId } },
        { OR: [{ schoolId }, { assignments: { some: { schoolId } } }] },
      ],
    },
    orderBy: { name: "asc" },
    include: LISTING_INCLUDE,
    take: RECOMMENDATION_LIMIT,
  });
}

/** "You may also like": general items from OTHER categories, taken one
 * category at a time so the row mixes shoes, shirts, bags and so on. */
export async function getYouMayAlsoLike(
  product: { id: string; categoryId: string },
  excludeIds: string[] = [],
): Promise<ListingProduct[]> {
  const pool = await db.product.findMany({
    where: {
      AND: [
        LISTABLE_PRODUCT,
        { schoolId: null },
        { categoryId: { not: product.categoryId } },
        { id: { notIn: [product.id, ...excludeIds] } },
      ],
    },
    orderBy: [{ category: { headerOrder: "asc" } }, { name: "asc" }],
    include: LISTING_INCLUDE,
    take: RECOMMENDATION_LIMIT * 4,
  });
  const byCategory = new Map<string, ListingProduct[]>();
  for (const item of pool) {
    const list = byCategory.get(item.categoryId) ?? [];
    list.push(item);
    byCategory.set(item.categoryId, list);
  }
  const queues = [...byCategory.values()];
  const mixed: ListingProduct[] = [];
  while (mixed.length < RECOMMENDATION_LIMIT && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next) mixed.push(next);
      if (mixed.length >= RECOMMENDATION_LIMIT) break;
    }
  }
  return mixed;
}
