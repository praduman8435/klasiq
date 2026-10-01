import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductRail } from "@/components/home/product-rail";
import { ProductDetail } from "@/components/product/product-detail";
import { getMoreForSchool, getSimilarProducts, getYouMayAlsoLike } from "@/server/queries/categories";
import { getProductBySlug } from "@/server/queries/products";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.description ?? `${product.name} — ${product.category.name} at Klasiq.`,
    alternates: { canonical: `/product/${product.slug}` },
  };
}

/**
 * A product page (`/product/[slug]`, a static segment that wins over the
 * `/[categorySlug]` catch-all). An unknown or deactivated product 404s.
 * Below the product, shopping-app style: "Similar products" from the same
 * category, "More for <school>" on a school's item, then "You may also
 * like" from other categories — each row only when it has something.
 */
export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [similar, forSchool] = await Promise.all([
    getSimilarProducts(product),
    product.schoolId ? getMoreForSchool(product.schoolId, product.id) : Promise.resolve([]),
  ]);
  const shown = new Set([...similar, ...forSchool].map((p) => p.id));
  const alsoLike = await getYouMayAlsoLike(product, [...shown]);

  return (
    <>
      <ProductDetail product={product} />
      <div className="flex flex-col divide-y divide-border border-t border-border">
        {similar.length > 0 && (
          <ProductRail title="Similar products" href={`/${product.category.slug}`} products={similar} />
        )}
        {product.school && forSchool.length > 0 && (
          <ProductRail title={`More for ${product.school.name}`} href={`/school/${product.school.slug}`} products={forSchool} />
        )}
        {alsoLike.length > 0 && <ProductRail title="You may also like" products={alsoLike} />}
      </div>
    </>
  );
}
