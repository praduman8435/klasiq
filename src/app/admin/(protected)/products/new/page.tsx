import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { getAllCategories } from "@/server/queries/admin/categories";
import { getAllSchoolsForPicker } from "@/server/queries/admin/products";

export const metadata: Metadata = { title: "Add Product" };

export default async function NewProductPage() {
  const [categories, schools] = await Promise.all([getAllCategories(), getAllSchoolsForPicker()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Add Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You can add sizes, prices and stock after creating it.
        </p>
      </div>
      <div className="max-w-xl rounded-2xl border bg-card p-5">
        <ProductForm categories={categories} schools={schools} />
      </div>
    </div>
  );
}
