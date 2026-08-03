import type { Metadata } from "next";
import { CategoryProductGrid } from "@/components/product/category-product-grid";
import { getGenericCategoryProducts } from "@/server/queries/categories";

export const metadata: Metadata = {
  title: "Socks",
  description: "Browse everyday school socks in every size.",
  alternates: { canonical: "/socks" },
};

export default async function SocksPage() {
  const products = await getGenericCategoryProducts("socks");

  return (
    <CategoryProductGrid
      title="Socks"
      description="Everyday school socks, sized for every child."
      categorySlug="socks"
      products={products}
    />
  );
}
