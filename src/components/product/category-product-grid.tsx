import type { ReactNode } from "react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductWithVariants } from "@/types/catalog";

/**
 * THE shared category-page shell — every generic category (`/uniforms`,
 * `/shoes`, `/bags`, `/kurtis`, ...) and the standalone `/search` page all
 * render through this one component, so redesigning it once redesigns
 * every category simultaneously (product discovery redesign, section 3).
 */
export function CategoryProductGrid({
  title,
  description,
  products,
  emptyState,
  headerExtra,
  beforeGrid,
}: {
  title: string;
  description?: string;
  products: ProductWithVariants[];
  emptyState?: ReactNode;
  headerExtra?: ReactNode;
  /** Shown between the header and the products (search puts schools here). */
  beforeGrid?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground sm:text-base">{description}</p>}
        {products.length > 0 && (
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>

      {headerExtra && <div className="mt-4 max-w-lg">{headerExtra}</div>}

      {beforeGrid}

      {products.length === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-2xl bg-card px-4 py-12 text-center">
          <p className="text-sm font-medium text-foreground">No products found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {emptyState ?? "Try another search or category."}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
