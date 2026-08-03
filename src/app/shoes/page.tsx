import type { Metadata } from "next";
import { CategoryProductGrid } from "@/components/product/category-product-grid";
import { getGenericCategoryProducts } from "@/server/queries/categories";

export const metadata: Metadata = {
  title: "Shoes",
  description: "Browse school-approved shoes in every size.",
  alternates: { canonical: "/shoes" },
};

export default async function ShoesPage() {
  const products = await getGenericCategoryProducts("shoes");

  return (
    <CategoryProductGrid
      title="Shoes"
      description="School-approved footwear, sized for every child."
      categorySlug="shoes"
      products={products}
    />
  );
}
