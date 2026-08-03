import type { Metadata } from "next";
import { CategoryProductGrid } from "@/components/product/category-product-grid";
import { getGenericCategoryProducts } from "@/server/queries/categories";

export const metadata: Metadata = {
  title: "School Bags",
  description: "Browse backpacks and trolley bags for school.",
  alternates: { canonical: "/school-bags" },
};

export default async function SchoolBagsPage() {
  const products = await getGenericCategoryProducts("school-bags");

  return (
    <CategoryProductGrid
      title="School Bags"
      description="Backpacks and trolley bags built for daily school use."
      categorySlug="school-bags"
      products={products}
    />
  );
}
