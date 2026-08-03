import { ProductCard } from "@/components/product/product-card";
import type { ProductWithVariants } from "@/types/catalog";

export function CategoryProductGrid({
  title,
  description,
  categorySlug,
  products,
}: {
  title: string;
  description: string;
  categorySlug: string;
  products: ProductWithVariants[];
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No products are available in this category yet. Please check back
          soon.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categorySlug={categorySlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
