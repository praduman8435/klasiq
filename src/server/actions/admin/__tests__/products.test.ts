import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

// Same in-memory cookie store as the other admin action tests — runs the
// real getAdminSession(), not a stub.
const { store } = vi.hoisted(() => ({ store: new Map<string, string>() }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (store.has(name) ? { name, value: store.get(name)! } : undefined),
    set: (name: string, value: string) => {
      store.set(name, value);
    },
    delete: (arg: string | { name: string }) => {
      store.delete(typeof arg === "string" ? arg : arg.name);
    },
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createAdminSession } from "@/lib/admin/session";
import { createProductAction, createVariantAction, updateVariantAction } from "@/server/actions/admin/products";

let categoryId: string;
let adminId: string;
const productIds: string[] = [];

beforeAll(async () => {
  categoryId = (await db.category.create({ data: { slug: `test-products-${randomUUID()}`, name: "Test Products" } })).id;
  adminId = (
    await db.adminUser.create({
      data: { name: "Products Test", email: `products-${randomUUID()}@example.com`, passwordHash: "unused:unused" },
    })
  ).id;
});

beforeEach(async () => {
  store.clear();
  await createAdminSession(adminId);
});

afterAll(async () => {
  const variants = await db.productVariant.findMany({ where: { productId: { in: productIds } }, select: { id: true } });
  await db.inventoryAdjustment.deleteMany({ where: { productVariantId: { in: variants.map((v) => v.id) } } });
  await db.productVariant.deleteMany({ where: { productId: { in: productIds } } });
  await db.product.deleteMany({ where: { id: { in: productIds } } });
  await db.adminUser.delete({ where: { id: adminId } });
  await db.category.delete({ where: { id: categoryId } });
  await db.$disconnect();
});

function name(label: string) {
  return `${label} ${randomUUID().slice(0, 6)}`;
}

async function create(productName: string, extra: Record<string, unknown> = {}) {
  const result = await createProductAction({
    name: productName,
    slug: "",
    categoryId,
    schoolId: null,
    isActive: true,
    firstSize: { size: "28", priceInRupees: 350, mrpInRupees: 400, stockQuantity: 12 },
    ...extra,
  });
  if (!result.success) throw new Error(result.error.message);
  productIds.push(result.id);
  return db.product.findUniqueOrThrow({ where: { id: result.id }, include: { variants: true } });
}

describe("adding a product in one step", () => {
  it("makes the web address and product code, and creates the first size", async () => {
    const product = await create(name("White Shirt"));
    expect(product.slug).toMatch(/^white-shirt-[a-z0-9]+$/);
    expect(product.variants).toHaveLength(1);
    const [size] = product.variants;
    expect(size).toMatchObject({ size: "28", priceInPaise: 35000, mrpInPaise: 40000, stockQuantity: 12, stockStatus: "IN_STOCK" });
    expect(size.sku).toBe(`${product.slug}-28`.toUpperCase());
  });

  it("gives a second product with the same name its own web address", async () => {
    const same = name("Same Name");
    const a = await create(same);
    const b = await create(same);
    expect(b.slug).toBe(`${a.slug}-2`);
  });

  it("refuses a selling price above the MRP and saves nothing", async () => {
    const productName = name("Pricey");
    const result = await createProductAction({
      name: productName,
      slug: "",
      categoryId,
      schoolId: null,
      isActive: true,
      firstSize: { size: "28", priceInRupees: 450, mrpInRupees: 400, stockQuantity: 1 },
    });
    expect(result).toMatchObject({ success: false, error: { type: "VALIDATION" } });
    expect(await db.product.count({ where: { name: productName } })).toBe(0);
  });
});

describe("sizes", () => {
  it("generates a code when none is given", async () => {
    const product = await create(name("Grey Trousers"));
    const result = await createVariantAction({ productId: product.id, size: "XL", priceInRupees: 420, stockQuantity: 3 });
    expect(result.success).toBe(true);
    const size = await db.productVariant.findFirstOrThrow({ where: { productId: product.id, size: "XL" } });
    expect(size.sku).toBe(`${product.slug}-xl`.toUpperCase());
    expect(size.stockStatus).toBe("LOW_STOCK");
  });

  it("records a stock change in the stock history", async () => {
    const product = await create(name("Black Skirt"));
    const size = product.variants[0];
    const result = await updateVariantAction({
      id: size.id,
      size: size.size,
      priceInRupees: 380,
      mrpInRupees: 400,
      stockQuantity: 20,
      expectedStockQuantity: 12,
    });
    expect(result.success).toBe(true);
    const after = await db.productVariant.findUniqueOrThrow({ where: { id: size.id } });
    expect(after).toMatchObject({ priceInPaise: 38000, stockQuantity: 20 });
    const history = await db.inventoryAdjustment.findMany({ where: { productVariantId: size.id } });
    expect(history).toMatchObject([{ previousQuantity: 12, newQuantity: 20, delta: 8, reason: "MANUAL_CORRECTION" }]);
  });

  it("won't undo a sale made while the form was open, but still saves the price", async () => {
    const product = await create(name("School Tie"));
    const size = product.variants[0];
    await db.productVariant.update({ where: { id: size.id }, data: { stockQuantity: 10 } }); // a sale of 2
    const result = await updateVariantAction({
      id: size.id,
      size: size.size,
      priceInRupees: 360,
      mrpInRupees: 400,
      stockQuantity: 15,
      expectedStockQuantity: 12,
    });
    expect(result).toMatchObject({ success: false, error: { type: "CONFLICT" } });
    const after = await db.productVariant.findUniqueOrThrow({ where: { id: size.id } });
    expect(after).toMatchObject({ priceInPaise: 36000, stockQuantity: 10 });
  });

  it("leaves stock alone on a price-only edit even if a sale happened meanwhile", async () => {
    const product = await create(name("Socks"));
    const size = product.variants[0];
    await db.productVariant.update({ where: { id: size.id }, data: { stockQuantity: 9 } });
    const result = await updateVariantAction({
      id: size.id,
      size: size.size,
      priceInRupees: 340,
      mrpInRupees: 400,
      stockQuantity: 12,
      expectedStockQuantity: 12,
    });
    expect(result.success).toBe(true);
    const after = await db.productVariant.findUniqueOrThrow({ where: { id: size.id } });
    expect(after).toMatchObject({ priceInPaise: 34000, stockQuantity: 9 });
    expect(await db.inventoryAdjustment.count({ where: { productVariantId: size.id } })).toBe(0);
  });
});
