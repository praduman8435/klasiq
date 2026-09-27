import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductWithVariants } from "@/types/catalog";

/** One category's products: a sideways-scrolling row on phones, a grid
 * on wider screens, with "View all". */
export function ProductRail({
  title,
  href,
  products,
}: {
  title: string;
  /** The category page; without it the row has no "View all". */
  href?: string;
  products: ProductWithVariants[];
}) {
  const headingId = `rail-${(href ?? title).replace(/\W+/g, "-")}`;

  return (
    <section aria-labelledby={headingId} className="bg-card py-5 sm:py-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6">
          <h2
            id={headingId}
            className="text-lg font-bold tracking-tight sm:text-xl"
          >
            {title}
          </h2>
          {href && (
            <Link
              href={href}
              className="-mr-2 flex min-h-10 items-center gap-0.5 rounded-lg px-2 text-sm font-semibold text-deal hover:bg-secondary"
            >
              View all
              <ChevronRight className="size-4" aria-hidden />
              <span className="sr-only"> {title}</span>
            </Link>
          )}
        </div>
        <ul className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-6 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <li
              key={product.id}
              className="w-[44vw] max-w-56 shrink-0 snap-start sm:w-auto sm:max-w-none"
            >
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
