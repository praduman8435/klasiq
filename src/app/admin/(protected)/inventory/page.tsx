import type { Metadata } from "next";
import { InventoryFilters } from "@/components/admin/inventory-filters";
import { InventoryRow } from "@/components/admin/inventory-row";
import { adminInventoryFiltersSchema } from "@/lib/validation/admin-inventory";
import { getAdminInventory } from "@/server/queries/admin/inventory";
import { getAllCategories } from "@/server/queries/admin/categories";

export const metadata: Metadata = { title: "Inventory" };

type PageProps = {
  searchParams: Promise<{ q?: string; categorySlug?: string; stock?: string }>;
};

export default async function AdminInventoryPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const parsed = adminInventoryFiltersSchema.safeParse({
    query: query.q,
    categorySlug: query.categorySlug,
    stock: query.stock,
  });
  const filters = parsed.success ? parsed.data : {};

  const [items, categories] = await Promise.all([
    getAdminInventory(filters),
    getAllCategories(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} size{items.length === 1 ? "" : "s"} shown. Use the stepper for quick
          corrections, &quot;Receive stock&quot; when new stock arrives, or &quot;Set exact&quot; after a
          physical count.
        </p>
      </div>

      <InventoryFilters categories={categories} />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No sizes match these filters.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <InventoryRow
              key={item.id}
              item={{
                id: item.id,
                productName: item.product.name,
                categoryName: item.product.category.name,
                size: item.size,
                sku: item.sku,
                priceInPaise: item.priceInPaise,
                stockQuantity: item.stockQuantity,
                stockStatus: item.stockStatus,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
