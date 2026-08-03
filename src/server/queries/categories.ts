import { db } from "@/lib/db";

export const NAV_CATEGORIES = [
  { slug: "uniforms", label: "School Uniforms" },
  { slug: "shoes", label: "Shoes" },
  { slug: "socks", label: "Socks" },
  { slug: "school-bags", label: "School Bags" },
] as const;

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}

/**
 * Products for a standalone category browse page (e.g. /uniforms). Only
 * generic products are returned (schoolId null) — a parent browsing without
 * a selected school should see items usable by any school, not another
 * school's exclusive product.
 */
export async function getGenericCategoryProducts(categorySlug: string) {
  return db.product.findMany({
    where: {
      isActive: true,
      schoolId: null,
      category: { slug: categorySlug },
    },
    orderBy: { name: "asc" },
    include: {
      variants: { orderBy: { sortOrder: "asc" } },
    },
  });
}
