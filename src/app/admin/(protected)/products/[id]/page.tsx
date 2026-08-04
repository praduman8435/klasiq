import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { ProductVariantsManager } from "@/components/admin/product-variants-manager";
import { getAdminProductById, getAllSchoolsForPicker } from "@/server/queries/admin/products";
import { getAllCategories } from "@/server/queries/admin/categories";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getAdminProductById(id);
  return { title: product?.name ?? "Product" };
}

export default async function AdminProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [product, categories, schools] = await Promise.all([
    getAdminProductById(id),
    getAllCategories(),
    getAllSchoolsForPicker(),
  ]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {product.category.name}
          {product.school ? ` · ${product.school.name} exclusive` : " · Generic"}
        </p>
      </div>

      <section className="max-w-xl rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Product details</h2>
        <div className="mt-3">
          <ProductForm
            initial={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              description: product.description ?? "",
              categoryId: product.categoryId,
              schoolId: product.schoolId,
              imageUrl: product.imageUrl ?? "",
              isActive: product.isActive,
            }}
            categories={categories}
            schools={schools}
          />
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Sizes &amp; pricing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Each size has its own price, SKU and stock count.
        </p>
        <div className="mt-3">
          <ProductVariantsManager productId={product.id} variants={product.variants} />
        </div>
      </section>
    </div>
  );
}
