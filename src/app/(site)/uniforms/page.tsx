import type { Metadata } from "next";
import { CategoryProductGrid } from "@/components/product/category-product-grid";
import { getGenericCategoryProducts } from "@/server/queries/categories";

export const metadata: Metadata = {
  title: "School Uniforms",
  description:
    "Browse generic school uniform essentials — shirts, pants, skirts and more — without selecting a school.",
  alternates: { canonical: "/uniforms" },
};

export default async function UniformsPage() {
  const products = await getGenericCategoryProducts("uniforms");

  return (
    <CategoryProductGrid
      title="School Uniforms"
      description="Generic uniform essentials that work for most schools. Can't find your school listed? These are a great starting point."
      categorySlug="uniforms"
      products={products}
    />
  );
}
