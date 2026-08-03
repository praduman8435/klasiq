import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { placeOrderForBasket } from "@/server/commerce/place-order";
import type { CheckoutInput } from "@/lib/validation/checkout";

// Integration tests against the real seeded-or-not local Postgres (docker
// compose). Everything this file creates is tracked and torn down in
// afterAll — it doesn't depend on or interfere with prisma/seed.ts data.

let categoryId: string;
const createdProductIds: string[] = [];
const createdBasketIds: string[] = [];
const createdOrderIds: string[] = [];

beforeAll(async () => {
  const category = await db.category.create({
    data: { slug: `test-checkout-${randomUUID()}`, name: "Test Checkout Category" },
  });
  categoryId = category.id;
});

afterAll(async () => {
  // FK-safe order: orders first (cascades order_items, nulls
  // basket.convertedOrderId), then baskets (cascades basket_items), then
  // products (cascades product_variants), then the category.
  if (createdOrderIds.length) {
    await db.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  }
  if (createdBasketIds.length) {
    await db.basket.deleteMany({ where: { id: { in: createdBasketIds } } });
  }
  if (createdProductIds.length) {
    await db.product.deleteMany({ where: { id: { in: createdProductIds } } });
  }
  await db.category.delete({ where: { id: categoryId } });
  await db.$disconnect();
});

async function createTestVariant(params: {
  priceInPaise: number;
  stockQuantity: number;
  lowStockThreshold?: number;
}) {
  const suffix = randomUUID();
  const product = await db.product.create({
    data: {
      slug: `test-product-${suffix}`,
      name: `Test Product ${suffix.slice(0, 8)}`,
      categoryId,
    },
  });
  createdProductIds.push(product.id);

  const variant = await db.productVariant.create({
    data: {
      productId: product.id,
      size: "M",
      sku: `TEST-SKU-${suffix}`,
      priceInPaise: params.priceInPaise,
      stockQuantity: params.stockQuantity,
      lowStockThreshold: params.lowStockThreshold ?? 5,
      stockStatus: params.stockQuantity <= 0 ? "OUT_OF_STOCK" : "IN_STOCK",
    },
  });

  return { product, variant };
}

async function createTestBasket() {
  const basket = await db.basket.create({ data: {} });
  createdBasketIds.push(basket.id);
  return basket;
}

async function addBasketItem(basketId: string, variantId: string, quantity: number, priceAtAdd: number) {
  return db.basketItem.create({
    data: { basketId, productVariantId: variantId, quantity, priceInPaiseAtAdd: priceAtAdd },
  });
}

function pickupInput(overrides: Partial<CheckoutInput> = {}): CheckoutInput {
  return {
    customerName: "Asha Kumar",
    customerMobile: "9876543210",
    fulfillmentType: "STORE_PICKUP",
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

function deliveryInput(overrides: Partial<CheckoutInput> = {}): CheckoutInput {
  return {
    customerName: "Ravi Shah",
    customerMobile: "9123456789",
    fulfillmentType: "LOCAL_DELIVERY",
    deliveryAddressLine: "12 Market Road",
    deliveryArea: "Sector 5",
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

describe("placeOrderForBasket — successful orders", () => {
  it("creates a real order for Store Pickup, with no delivery fee and no address", async () => {
    const { variant } = await createTestVariant({ priceInPaise: 35000, stockQuantity: 10 });
    const basket = await createTestBasket();
    await addBasketItem(basket.id, variant.id, 2, 35000);

    const result = await placeOrderForBasket(basket.id, pickupInput());

    expect(result.success).toBe(true);
    if (!result.success) return;
    createdOrderIds.push((await db.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } })).id);

    const order = await db.order.findUniqueOrThrow({
      where: { orderNumber: result.orderNumber },
      include: { items: true },
    });

    expect(order.fulfillmentType).toBe("STORE_PICKUP");
    expect(order.deliveryFeeInPaise).toBe(0);
    expect(order.deliveryAddressLine).toBeNull();
    expect(order.subtotalInPaise).toBe(70000);
    expect(order.totalInPaise).toBe(70000);
    expect(order.paymentMethod).toBe("CASH_ON_DELIVERY");
    expect(order.paymentStatus).toBe("UNPAID");
    expect(order.status).toBe("PENDING");
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.quantity).toBe(2);
    expect(order.items[0]?.lineTotalInPaise).toBe(70000);

    const updatedVariant = await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(updatedVariant.stockQuantity).toBe(8);

    const updatedBasket = await db.basket.findUniqueOrThrow({ where: { id: basket.id } });
    expect(updatedBasket.status).toBe("CONVERTED");
    expect(updatedBasket.convertedOrderId).toBe(order.id);
  });

  it("creates a real order for Local Delivery, applying the delivery fee and storing the address snapshot", async () => {
    const { variant } = await createTestVariant({ priceInPaise: 30000, stockQuantity: 10 });
    const basket = await createTestBasket();
    await addBasketItem(basket.id, variant.id, 1, 30000);

    const result = await placeOrderForBasket(basket.id, deliveryInput());

    expect(result.success).toBe(true);
    if (!result.success) return;
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    createdOrderIds.push(order.id);

    expect(order.fulfillmentType).toBe("LOCAL_DELIVERY");
    expect(order.deliveryAddressLine).toBe("12 Market Road");
    expect(order.deliveryArea).toBe("Sector 5");
    expect(order.subtotalInPaise).toBe(30000);
    expect(order.deliveryFeeInPaise).toBeGreaterThan(0);
    expect(order.totalInPaise).toBe(order.subtotalInPaise + order.deliveryFeeInPaise);
  });

  it("waives the delivery fee once the subtotal meets the free-delivery threshold", async () => {
    // FREE_DELIVERY_THRESHOLD_IN_PAISE defaults to 100000 (₹1000) — see .env.
    const { variant } = await createTestVariant({ priceInPaise: 120000, stockQuantity: 5 });
    const basket = await createTestBasket();
    await addBasketItem(basket.id, variant.id, 1, 120000);

    const result = await placeOrderForBasket(basket.id, deliveryInput());
    expect(result.success).toBe(true);
    if (!result.success) return;
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    createdOrderIds.push(order.id);

    expect(order.deliveryFeeInPaise).toBe(0);
    expect(order.totalInPaise).toBe(order.subtotalInPaise);
  });

  it("snapshots product name/size/SKU/price so later product edits don't rewrite the historical order", async () => {
    const { product, variant } = await createTestVariant({ priceInPaise: 40000, stockQuantity: 5 });
    const basket = await createTestBasket();
    await addBasketItem(basket.id, variant.id, 1, 40000);

    const result = await placeOrderForBasket(basket.id, pickupInput());
    expect(result.success).toBe(true);
    if (!result.success) return;
    const order = await db.order.findUniqueOrThrow({
      where: { orderNumber: result.orderNumber },
      include: { items: true },
    });
    createdOrderIds.push(order.id);

    const originalProductName = product.name;
    const orderItemBeforeEdits = order.items[0]!;
    expect(orderItemBeforeEdits.productName).toBe(originalProductName);

    // Rename the product and reprice the variant AFTER the order exists.
    await db.product.update({ where: { id: product.id }, data: { name: "Renamed Later" } });
    await db.productVariant.update({ where: { id: variant.id }, data: { priceInPaise: 99999 } });

    // Re-fetch the order item fresh from the DB — it must still reflect
    // what was true at order time, not the just-made edits.
    const orderItem = await db.orderItem.findUniqueOrThrow({ where: { id: orderItemBeforeEdits.id } });
    expect(orderItem.productName).toBe(originalProductName);
    expect(orderItem.productName).not.toBe("Renamed Later");
    expect(orderItem.unitPriceInPaise).toBe(40000);
    expect(orderItem.skuSnapshot).toBe(variant.sku);
    expect(orderItem.size).toBe("M");
  });

  it("uses the current authoritative price, not the price the basket item was added at", async () => {
    const { variant } = await createTestVariant({ priceInPaise: 35000, stockQuantity: 5 });
    const basket = await createTestBasket();
    // Simulates "added at ₹350" ...
    await addBasketItem(basket.id, variant.id, 1, 35000);
    // ... then the shop repriced it to ₹380 before checkout.
    await db.productVariant.update({ where: { id: variant.id }, data: { priceInPaise: 38000 } });

    const result = await placeOrderForBasket(basket.id, pickupInput());
    expect(result.success).toBe(true);
    if (!result.success) return;
    const order = await db.order.findUniqueOrThrow({
      where: { orderNumber: result.orderNumber },
      include: { items: true },
    });
    createdOrderIds.push(order.id);

    expect(order.items[0]?.unitPriceInPaise).toBe(38000);
    expect(order.subtotalInPaise).toBe(38000);
  });
});

describe("placeOrderForBasket — rejections", () => {
  it("rejects an empty basket without creating an order", async () => {
    const basket = await createTestBasket();
    const result = await placeOrderForBasket(basket.id, pickupInput());
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe("EMPTY_BASKET");
  });

  it("rejects a null basket id (no cookie at all) as an empty basket", async () => {
    const result = await placeOrderForBasket(null, pickupInput());
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe("EMPTY_BASKET");
  });

  it("rejects an out-of-stock item and creates no order", async () => {
    const { variant } = await createTestVariant({ priceInPaise: 35000, stockQuantity: 0 });
    const basket = await createTestBasket();
    // Force the basket item in directly — the normal add-to-basket action
    // would refuse this, but checkout must independently defend against it.
    await addBasketItem(basket.id, variant.id, 1, 35000);

    const result = await placeOrderForBasket(basket.id, pickupInput());
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe("STOCK_ISSUE");
    if (result.error.type === "STOCK_ISSUE") {
      expect(result.error.issues[0]?.availableQuantity).toBe(0);
    }

    const orderCount = await db.order.count({
      where: { items: { some: { productVariantId: variant.id } } },
    });
    expect(orderCount).toBe(0);
    const untouchedBasket = await db.basket.findUniqueOrThrow({ where: { id: basket.id } });
    expect(untouchedBasket.status).toBe("ACTIVE");
  });

  it("rejects a quantity greater than what's in stock, naming the item", async () => {
    const { product, variant } = await createTestVariant({ priceInPaise: 35000, stockQuantity: 1 });
    const basket = await createTestBasket();
    await addBasketItem(basket.id, variant.id, 3, 35000);

    const result = await placeOrderForBasket(basket.id, pickupInput());
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.type).toBe("STOCK_ISSUE");
    if (result.error.type === "STOCK_ISSUE") {
      expect(result.error.issues[0]).toMatchObject({
        productName: product.name,
        requestedQuantity: 3,
        availableQuantity: 1,
      });
    }

    const untouchedVariant = await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(untouchedVariant.stockQuantity).toBe(1);
  });
});

describe("placeOrderForBasket — idempotency and basket conversion", () => {
  it("returns the same order on a repeated submission with the same idempotency key", async () => {
    const { variant } = await createTestVariant({ priceInPaise: 35000, stockQuantity: 10 });
    const basket = await createTestBasket();
    await addBasketItem(basket.id, variant.id, 1, 35000);

    const input = pickupInput();
    const first = await placeOrderForBasket(basket.id, input);
    expect(first.success).toBe(true);
    if (!first.success) return;
    createdOrderIds.push((await db.order.findUniqueOrThrow({ where: { orderNumber: first.orderNumber } })).id);

    const second = await placeOrderForBasket(basket.id, input);
    expect(second.success).toBe(true);
    if (!second.success) return;

    expect(second.orderNumber).toBe(first.orderNumber);
    expect(second.alreadyExisted).toBe(true);

    const orderCount = await db.order.count({ where: { idempotencyKey: input.idempotencyKey } });
    expect(orderCount).toBe(1);

    const finalVariant = await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(finalVariant.stockQuantity).toBe(9); // decremented exactly once
  });

  it("handles two truly concurrent submissions with the SAME idempotency key (the real double-tap race)", async () => {
    // Unlike the sequential test above, this fires both calls via
    // Promise.all so neither has committed when the other starts — the
    // narrow race a real double-tap can hit before the client-side
    // isPending guard re-renders. The DB unique constraint on
    // idempotencyKey, not timing, is what must make this safe.
    const { variant } = await createTestVariant({ priceInPaise: 35000, stockQuantity: 10 });
    const basket = await createTestBasket();
    await addBasketItem(basket.id, variant.id, 1, 35000);

    const input = pickupInput();
    const [first, second] = await Promise.all([
      placeOrderForBasket(basket.id, input),
      placeOrderForBasket(basket.id, input),
    ]);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    if (!first.success || !second.success) return;

    expect(first.orderNumber).toBe(second.orderNumber);

    const orderCount = await db.order.count({ where: { idempotencyKey: input.idempotencyKey } });
    expect(orderCount).toBe(1);
    createdOrderIds.push((await db.order.findUniqueOrThrow({ where: { orderNumber: first.orderNumber } })).id);

    const finalVariant = await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(finalVariant.stockQuantity).toBe(9); // decremented exactly once, not twice
  });

  it("returns the existing order for a stale resubmission with a DIFFERENT idempotency key on the same (now-converted) basket", async () => {
    const { variant } = await createTestVariant({ priceInPaise: 35000, stockQuantity: 10 });
    const basket = await createTestBasket();
    await addBasketItem(basket.id, variant.id, 1, 35000);

    const first = await placeOrderForBasket(basket.id, pickupInput());
    expect(first.success).toBe(true);
    if (!first.success) return;
    createdOrderIds.push((await db.order.findUniqueOrThrow({ where: { orderNumber: first.orderNumber } })).id);

    // A stale checkout tab resubmits with a fresh idempotency key.
    const second = await placeOrderForBasket(basket.id, pickupInput());
    expect(second.success).toBe(true);
    if (!second.success) return;
    expect(second.orderNumber).toBe(first.orderNumber);
    expect(second.alreadyExisted).toBe(true);

    const finalVariant = await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(finalVariant.stockQuantity).toBe(9); // still decremented exactly once
  });
});

describe("placeOrderForBasket — concurrency", () => {
  it("allows exactly one of two concurrent checkouts to win the final unit of stock", async () => {
    const { variant } = await createTestVariant({ priceInPaise: 35000, stockQuantity: 1 });

    const basketA = await createTestBasket();
    const basketB = await createTestBasket();
    await addBasketItem(basketA.id, variant.id, 1, 35000);
    await addBasketItem(basketB.id, variant.id, 1, 35000);

    const [resultA, resultB] = await Promise.all([
      placeOrderForBasket(basketA.id, pickupInput()),
      placeOrderForBasket(basketB.id, pickupInput()),
    ]);

    const results = [resultA, resultB];
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    const failure = failures[0];
    if (!failure!.success) {
      expect(failure!.error.type).toBe("STOCK_ISSUE");
    }

    const winner = successes[0];
    if (winner!.success) {
      const order = await db.order.findUniqueOrThrow({ where: { orderNumber: winner!.orderNumber } });
      createdOrderIds.push(order.id);
    }

    const finalVariant = await db.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(finalVariant.stockQuantity).toBe(0);
    expect(finalVariant.stockQuantity).toBeGreaterThanOrEqual(0); // never negative

    const orderCountForVariant = await db.order.count({
      where: { items: { some: { productVariantId: variant.id } } },
    });
    expect(orderCountForVariant).toBe(1);
  });
});
