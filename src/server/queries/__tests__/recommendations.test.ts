import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getMoreForSchool, getSimilarProducts, getYouMayAlsoLike } from "@/server/queries/categories";

const tag = randomUUID().slice(0, 8);
const categoryIds: string[] = [];
let schoolId = "";
const ids: Record<string, { id: string; categoryId: string }> = {};

beforeAll(async () => {
  for (const name of ["Shirts", "Shoes", "Bags"]) {
    const c = await db.category.create({ data: { name: `Zrc ${name} ${tag}`, slug: `zrc-${name.toLowerCase()}-${tag}` } });
    categoryIds.push(c.id);
  }
  schoolId = (await db.school.create({ data: { name: `Zrc School ${tag}`, slug: `zrc-school-${tag}` } })).id;
  const make = async (key: string, categoryIndex: number, school: string | null = null) => {
    const p = await db.product.create({
      data: {
        name: `Zrc ${key} ${tag}`,
        slug: `zrc-${key.toLowerCase()}-${tag}`,
        categoryId: categoryIds[categoryIndex],
        schoolId: school,
        variants: { create: { size: "M", sku: `ZRC-${key}-${tag}`, priceInPaise: 10000, stockQuantity: 3 } },
      },
    });
    ids[key] = { id: p.id, categoryId: p.categoryId };
  };
  await make("ShirtA", 0);
  await make("ShirtB", 0);
  await make("SchoolShirt", 0, schoolId);
  await make("ShoeA", 1);
  await make("ShoeB", 1);
  await make("BagA", 2);
});

afterAll(async () => {
  await db.product.deleteMany({ where: { categoryId: { in: categoryIds } } });
  await db.school.delete({ where: { id: schoolId } });
  await db.category.deleteMany({ where: { id: { in: categoryIds } } });
  await db.$disconnect();
});

describe("product page recommendations", () => {
  it("similar products: same category, without the product itself", async () => {
    const names = (await getSimilarProducts(ids.ShirtA)).map((p) => p.name);
    expect(names).toEqual([`Zrc ShirtB ${tag}`, `Zrc SchoolShirt ${tag}`]);
  });

  it("more for the school: that school's items, without the product itself", async () => {
    const names = (await getMoreForSchool(schoolId, ids.ShirtA.id)).map((p) => p.name);
    expect(names).toEqual([`Zrc SchoolShirt ${tag}`]);
  });

  it("you may also like: other categories only, mixed one category at a time", async () => {
    const products = await getYouMayAlsoLike(ids.ShirtA);
    const ours = products.filter((p) => categoryIds.includes(p.categoryId));
    expect(ours.every((p) => p.categoryId !== ids.ShirtA.categoryId)).toBe(true);
    expect(new Set(ours.map((p) => p.categoryId)).size).toBe(2);
  });
});
