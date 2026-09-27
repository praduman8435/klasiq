import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getCategoryListingProducts, getCategorySchools, searchListingProducts } from "@/server/queries/categories";
import { getSearchSuggestions } from "@/server/queries/search";

const tag = randomUUID().slice(0, 8);
let categoryId = "";
const schoolIds: string[] = [];

beforeAll(async () => {
  const category = await db.category.create({
    data: { name: `Zqx Uniforms ${tag}`, slug: `zqx-uniforms-${tag}`, displayInHeader: true, headerOrder: 900 },
  });
  categoryId = category.id;
  const [active, hidden] = await Promise.all([
    db.school.create({ data: { name: `Zqx Active School ${tag}`, slug: `zqx-active-${tag}` } }),
    db.school.create({ data: { name: `Zqx Closed School ${tag}`, slug: `zqx-closed-${tag}`, isActive: false } }),
  ]);
  schoolIds.push(active.id, hidden.id);

  const make = (name: string, schoolId: string | null) =>
    db.product.create({
      data: {
        name: `${name} ${tag}`,
        slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${tag}`,
        categoryId,
        schoolId,
        variants: { create: { size: "24", sku: `ZQX-${name.replace(/\s+/g, "")}-${tag}`, priceInPaise: 30000, stockQuantity: 5 } },
      },
    });
  const general = await make("Zqx General Shirt", null);
  await make("Zqx School Blazer", active.id);
  await make("Zqx Closed Tie", hidden.id);
  // A general item assigned to the active school counts for its chip too.
  await db.schoolUniformAssignment.create({ data: { schoolId: active.id, productId: general.id } });
});

afterAll(async () => {
  await db.product.deleteMany({ where: { categoryId } });
  await db.school.deleteMany({ where: { id: { in: schoolIds } } });
  await db.category.delete({ where: { id: categoryId } });
  await db.$disconnect();
});

describe("category listing includes every school's own items", () => {
  it("shows general items and active schools' items, with the school attached", async () => {
    const products = await getCategoryListingProducts(`zqx-uniforms-${tag}`);
    const names = products.map((p) => p.name);
    expect(names).toEqual([`Zqx General Shirt ${tag}`, `Zqx School Blazer ${tag}`]);
    expect(products[1].school?.name).toBe(`Zqx Active School ${tag}`);
    expect(names).not.toContain(`Zqx Closed Tie ${tag}`);
  });

  it("a school chip narrows to that school's own and assigned items", async () => {
    const schools = await getCategorySchools(`zqx-uniforms-${tag}`);
    expect(schools.map((s) => s.slug)).toEqual([`zqx-active-${tag}`]);
    const products = await getCategoryListingProducts(`zqx-uniforms-${tag}`, { schoolSlug: `zqx-active-${tag}` });
    expect(products.map((p) => p.name).sort()).toEqual([`Zqx General Shirt ${tag}`, `Zqx School Blazer ${tag}`].sort());
  });

  it("search finds school items too, including by the school's name", async () => {
    const byName = await searchListingProducts(`Zqx School Blazer ${tag}`);
    expect(byName).toHaveLength(1);
    const bySchool = await searchListingProducts(`Zqx Active School ${tag}`);
    expect(bySchool.map((p) => p.name)).toContain(`Zqx School Blazer ${tag}`);
  });
});

describe("search suggestions", () => {
  it("suggests matching categories and products with a price and school name", async () => {
    const suggestions = await getSearchSuggestions(`zqx`);
    expect(suggestions.categories.map((c) => c.slug)).toContain(`zqx-uniforms-${tag}`);
    const blazer = suggestions.products.find((p) => p.name === `Zqx School Blazer ${tag}`);
    expect(blazer).toMatchObject({ fromPriceInPaise: 30000, schoolName: `Zqx Active School ${tag}` });
    expect(suggestions.products.map((p) => p.name)).not.toContain(`Zqx Closed Tie ${tag}`);
  });

  it("waits for two letters", async () => {
    expect(await getSearchSuggestions("z")).toEqual({ categories: [], schools: [], products: [] });
  });
});
