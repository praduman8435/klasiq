import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { adminProductFiltersSchema } from "@/lib/validation/admin-products";
import { getAdminProducts } from "@/server/queries/admin/products";
import { getAllCategories } from "@/server/queries/admin/categories";

export const metadata: Metadata = { title: "Products" };

type PageProps = { searchParams: Promise<{ q?: string; categorySlug?: string }> };

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const parsed = adminProductFiltersSchema.safeParse({
    query: query.q,
    categorySlug: query.categorySlug,
  });
  const filters = parsed.success ? parsed.data : {};

  const [products, categories] = await Promise.all([
    getAdminProducts(filters),
    getAllCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">{products.length} products</p>
        </div>
        <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
          <Plus className="size-4" aria-hidden />
          Add Product
        </Button>
      </div>

      <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input name="q" placeholder="Search products" defaultValue={query.q ?? ""} className="sm:max-w-xs" />
        <select
          name="categorySlug"
          defaultValue={query.categorySlug ?? ""}
          className="h-9 rounded-lg border bg-background px-3 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No products found.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.id}`}
                className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{product.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {product.category.name}
                    {product.school ? ` · ${product.school.name} exclusive` : " · Generic"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!product.isActive && <Badge variant="outline">Inactive</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {product._count.variants} size{product._count.variants === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
