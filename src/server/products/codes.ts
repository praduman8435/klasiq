import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

type Client = Prisma.TransactionClient | typeof db;

/** "White Shirt" → "white-shirt", or "white-shirt-2" if that's taken. */
export async function uniqueProductSlug(name: string, client: Client = db): Promise<string> {
  const base = slugify(name).slice(0, 90) || "product";
  for (let n = 1; n < 500; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await client.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** A product code for a size when the shop doesn't use its own:
 * "WHITE-SHIRT-28", or "WHITE-SHIRT-28-2" if that's taken. */
export async function uniqueSku(productSlug: string, size: string, client: Client = db): Promise<string> {
  const base = `${productSlug}-${slugify(size) || "size"}`.toUpperCase().slice(0, 55);
  for (let n = 1; n < 500; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const taken = await client.productVariant.findUnique({ where: { sku: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36).toUpperCase()}`;
}
