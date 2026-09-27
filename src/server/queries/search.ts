import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { searchSchools } from "@/server/queries/schools";

const SUGGEST_MIN_LENGTH = 2;

/** A product can be shown to customers when it's active, has something
 * on sale, and — if it belongs to one school — that school is active. */
export const LISTABLE_PRODUCT: Prisma.ProductWhereInput = {
  isActive: true,
  variants: { some: { isActive: true } },
  OR: [{ schoolId: null }, { school: { isActive: true } }],
};

export type SearchSuggestions = {
  categories: { slug: string; name: string; icon: string | null }[];
  schools: { slug: string; name: string; city: string | null; logoUrl: string | null }[];
  products: {
    slug: string;
    name: string;
    imageUrl: string | null;
    fromPriceInPaise: number;
    category: { slug: string; name: string; icon: string | null };
    schoolName: string | null;
  }[];
};

/**
 * What the header search box suggests while someone types: matching
 * categories, schools and products (school-only uniform items included,
 * labelled with their school). Two letters minimum.
 */
export async function getSearchSuggestions(raw: string): Promise<SearchSuggestions> {
  const q = raw.trim();
  if (q.length < SUGGEST_MIN_LENGTH) return { categories: [], schools: [], products: [] };
  const contains = { contains: q, mode: "insensitive" as const };

  const [categories, schools, products] = await Promise.all([
    db.category.findMany({
      where: { displayInHeader: true, name: contains },
      orderBy: [{ headerOrder: "asc" }, { name: "asc" }],
      take: 3,
      select: { slug: true, name: true, icon: true },
    }),
    searchSchools(q, 4),
    db.product.findMany({
      where: { ...LISTABLE_PRODUCT, AND: [{ OR: [{ name: contains }, { category: { name: contains } }] }] },
      orderBy: [{ schoolId: { sort: "asc", nulls: "first" } }, { name: "asc" }],
      take: 6,
      select: {
        slug: true,
        name: true,
        imageUrl: true,
        category: { select: { slug: true, name: true, icon: true } },
        school: { select: { name: true } },
        variants: { where: { isActive: true }, orderBy: { priceInPaise: "asc" }, take: 1, select: { priceInPaise: true } },
      },
    }),
  ]);

  return {
    categories,
    schools: schools.map(({ slug, name, city, logoUrl }) => ({ slug, name, city, logoUrl })),
    products: products.map((product) => ({
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      fromPriceInPaise: product.variants[0]?.priceInPaise ?? 0,
      category: product.category,
      schoolName: product.school?.name ?? null,
    })),
  };
}
