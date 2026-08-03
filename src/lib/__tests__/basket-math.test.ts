import { describe, expect, it } from "vitest";
import {
  clampAddQuantity,
  clampSetQuantity,
  pickDefaultOrderableVariant,
} from "@/lib/basket-math";

describe("clampAddQuantity", () => {
  it("adds normally when well within stock", () => {
    expect(
      clampAddQuantity({
        existingQuantity: 1,
        requestedQuantity: 2,
        stockQuantity: 10,
        maxPerLine: 20,
      }),
    ).toBe(3);
  });

  it("never exceeds stock on hand, even if the client requests more", () => {
    expect(
      clampAddQuantity({
        existingQuantity: 0,
        requestedQuantity: 999,
        stockQuantity: 4,
        maxPerLine: 20,
      }),
    ).toBe(4);
  });

  it("never exceeds stock even when adding to an existing line", () => {
    expect(
      clampAddQuantity({
        existingQuantity: 3,
        requestedQuantity: 5,
        stockQuantity: 4,
        maxPerLine: 20,
      }),
    ).toBe(4);
  });

  it("respects the per-line cap even when stock is plentiful", () => {
    expect(
      clampAddQuantity({
        existingQuantity: 0,
        requestedQuantity: 50,
        stockQuantity: 500,
        maxPerLine: 20,
      }),
    ).toBe(20);
  });

  it("returns 0 (no-op) when there is no stock at all", () => {
    expect(
      clampAddQuantity({
        existingQuantity: 0,
        requestedQuantity: 5,
        stockQuantity: 0,
        maxPerLine: 20,
      }),
    ).toBe(0);
  });
});

describe("clampSetQuantity", () => {
  it("clamps a directly-set quantity to stock on hand", () => {
    expect(
      clampSetQuantity({ requestedQuantity: 10, stockQuantity: 3, maxPerLine: 20 }),
    ).toBe(3);
  });

  it("clamps to the per-line cap", () => {
    expect(
      clampSetQuantity({ requestedQuantity: 30, stockQuantity: 100, maxPerLine: 20 }),
    ).toBe(20);
  });

  it("never returns negative quantities", () => {
    expect(
      clampSetQuantity({ requestedQuantity: -5, stockQuantity: 10, maxPerLine: 20 }),
    ).toBe(0);
  });
});

describe("pickDefaultOrderableVariant", () => {
  const variant = (overrides: Partial<Parameters<typeof pickDefaultOrderableVariant>[0][number]>) => ({
    id: "v",
    sortOrder: 0,
    stockQuantity: 10,
    stockStatus: "IN_STOCK" as const,
    ...overrides,
  });

  it("picks the lowest sortOrder orderable variant", () => {
    const variants = [
      variant({ id: "b", sortOrder: 1 }),
      variant({ id: "a", sortOrder: 0 }),
    ];
    expect(pickDefaultOrderableVariant(variants)?.id).toBe("a");
  });

  it("skips out-of-stock variants even if they sort first", () => {
    const variants = [
      variant({ id: "a", sortOrder: 0, stockStatus: "OUT_OF_STOCK", stockQuantity: 0 }),
      variant({ id: "b", sortOrder: 1 }),
    ];
    expect(pickDefaultOrderableVariant(variants)?.id).toBe("b");
  });

  it("returns undefined when every variant is out of stock", () => {
    const variants = [
      variant({ id: "a", stockStatus: "OUT_OF_STOCK", stockQuantity: 0 }),
      variant({ id: "b", stockStatus: "OUT_OF_STOCK", stockQuantity: 0 }),
    ];
    expect(pickDefaultOrderableVariant(variants)).toBeUndefined();
  });

  it("does not mutate the input array", () => {
    const variants = [variant({ id: "b", sortOrder: 1 }), variant({ id: "a", sortOrder: 0 })];
    const copy = [...variants];
    pickDefaultOrderableVariant(variants);
    expect(variants).toEqual(copy);
  });
});
