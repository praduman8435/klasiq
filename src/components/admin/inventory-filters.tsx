"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

export function InventoryFilters({
  categories,
}: {
  categories: Array<{ slug: string; name: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/inventory?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        placeholder="Search product name or SKU"
        defaultValue={searchParams.get("q") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") updateParam("q", e.currentTarget.value);
        }}
        onBlur={(e) => updateParam("q", e.currentTarget.value)}
        className="sm:max-w-xs"
      />

      <select
        aria-label="Filter by category"
        value={searchParams.get("categorySlug") ?? ""}
        onChange={(e) => updateParam("categorySlug", e.target.value)}
        className="h-9 rounded-lg border bg-background px-3 text-sm"
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by stock status"
        value={searchParams.get("stock") ?? ""}
        onChange={(e) => updateParam("stock", e.target.value)}
        className="h-9 rounded-lg border bg-background px-3 text-sm"
      >
        <option value="">All stock levels</option>
        <option value="IN_STOCK">In Stock</option>
        <option value="LOW_STOCK">Low Stock</option>
        <option value="OUT_OF_STOCK">Out of Stock</option>
      </select>
    </div>
  );
}
