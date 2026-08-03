import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { deriveStockStatus, isOrderable } from "@/lib/stock";
import { calculateDeliveryFee, FULFILLMENT_CONFIG } from "@/lib/fulfillment-config";
import { generateOrderNumber } from "@/lib/order-number";
import { generateOrderAccessToken } from "@/lib/order-access-token";
import type { CheckoutInput } from "@/lib/validation/checkout";

const MAX_ORDER_NUMBER_ATTEMPTS = 5;

export type PlaceOrderItemIssue = {
  productName: string;
  size: string;
  requestedQuantity: number;
  availableQuantity: number;
};

export type PlaceOrderError =
  | { type: "EMPTY_BASKET"; message: string }
  | { type: "STOCK_ISSUE"; message: string; issues: PlaceOrderItemIssue[] }
  | { type: "FULFILLMENT_DISABLED"; message: string }
  | { type: "UNKNOWN"; message: string };

export type PlaceOrderResult =
  | { success: true; orderNumber: string; accessToken: string; alreadyExisted: boolean }
  | { success: false; error: PlaceOrderError };

class PlaceOrderDomainError extends Error {
  constructor(public readonly domainError: PlaceOrderError) {
    super(domainError.message);
  }
}

function isUniqueConstraintErrorOn(err: unknown, field: string): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002" &&
    Array.isArray(err.meta?.target) &&
    (err.meta.target as string[]).includes(field)
  );
}

/**
 * Loads an order by idempotency key and returns it in the same shape as a
 * fresh success — used both for the up-front "have we already done this"
 * check and for recovering when two near-simultaneous submissions race past
 * that check (see docs/PHASE_2_REPORT.md "Idempotency strategy").
 */
async function findOrderByIdempotencyKey(
  idempotencyKey: string,
): Promise<PlaceOrderResult | null> {
  const existing = await db.order.findUnique({ where: { idempotencyKey } });
  if (!existing) return null;
  return {
    success: true,
    orderNumber: existing.orderNumber,
    accessToken: existing.accessToken,
    alreadyExisted: true,
  };
}

/**
 * The one and only path that creates an Order. Framework-agnostic on
 * purpose (no cookies()/next/headers import) so it's directly callable
 * from integration tests with a plain basket id — see
 * src/server/actions/checkout.ts for the cookie-reading wrapper used by
 * the actual /checkout page.
 *
 * Everything money/stock-related is recalculated from the database inside
 * a single transaction here. `input` must already be validated
 * (checkoutInputSchema) by the caller — this function trusts its shape but
 * still never trusts prices/stock from anywhere but the database.
 */
export async function placeOrderForBasket(
  basketId: string | null,
  input: CheckoutInput,
): Promise<PlaceOrderResult> {
  if (!basketId) {
    return { success: false, error: { type: "EMPTY_BASKET", message: "Your bag is empty." } };
  }

  const existingByKey = await findOrderByIdempotencyKey(input.idempotencyKey);
  if (existingByKey) return existingByKey;

  const basket = await db.basket.findUnique({ where: { id: basketId } });
  if (!basket) {
    return { success: false, error: { type: "EMPTY_BASKET", message: "Your bag is empty." } };
  }

  // This basket already produced an order (e.g. a stale checkout tab
  // resubmitted after a successful purchase, with a different idempotency
  // key than the original submission). Return the existing order instead
  // of creating a second one from the same items.
  if (basket.status === "CONVERTED") {
    if (basket.convertedOrderId) {
      const existingOrder = await db.order.findUnique({
        where: { id: basket.convertedOrderId },
      });
      if (existingOrder) {
        return {
          success: true,
          orderNumber: existingOrder.orderNumber,
          accessToken: existingOrder.accessToken,
          alreadyExisted: true,
        };
      }
    }
    return { success: false, error: { type: "EMPTY_BASKET", message: "Your bag is empty." } };
  }

  if (input.fulfillmentType === "STORE_PICKUP" && !FULFILLMENT_CONFIG.pickupEnabled) {
    return {
      success: false,
      error: {
        type: "FULFILLMENT_DISABLED",
        message: "Store Pickup isn't available right now — please choose Local Delivery.",
      },
    };
  }
  if (input.fulfillmentType === "LOCAL_DELIVERY" && !FULFILLMENT_CONFIG.deliveryEnabled) {
    return {
      success: false,
      error: {
        type: "FULFILLMENT_DISABLED",
        message: "Local Delivery isn't available right now — please choose Store Pickup.",
      },
    };
  }

  try {
    const order = await db.$transaction(async (tx) => {
      const items = await tx.basketItem.findMany({
        where: { basketId },
        include: { productVariant: { include: { product: true } } },
      });

      if (items.length === 0) {
        throw new PlaceOrderDomainError({ type: "EMPTY_BASKET", message: "Your bag is empty." });
      }

      // Up-front check across all items, purely so we can report every
      // problem item at once. The guarded decrement below is what actually
      // enforces correctness against a concurrent race — this pass just
      // makes the common (non-racing) case's error message complete.
      const upfrontIssues: PlaceOrderItemIssue[] = [];
      for (const item of items) {
        const variant = item.productVariant;
        if (!isOrderable(variant.stockStatus) || variant.stockQuantity < item.quantity) {
          upfrontIssues.push({
            productName: variant.product.name,
            size: variant.size,
            requestedQuantity: item.quantity,
            availableQuantity: Math.max(0, variant.stockQuantity),
          });
        }
      }
      if (upfrontIssues.length > 0) {
        throw new PlaceOrderDomainError({
          type: "STOCK_ISSUE",
          message: "Some items in your bag are no longer available in the requested quantity.",
          issues: upfrontIssues,
        });
      }

      // Concurrency-safe stock decrement. `updateMany` with a `gte` guard
      // compiles to a single conditional UPDATE — Postgres evaluates the
      // WHERE clause against the row's current value at execution time, so
      // if two transactions race for the same variant, the second one's
      // guard is checked against the first transaction's already-committed
      // (or in-progress, causing it to block then re-check) decrement. It
      // is not possible for both to succeed against insufficient stock.
      for (const item of items) {
        const decrement = await tx.productVariant.updateMany({
          where: { id: item.productVariantId, stockQuantity: { gte: item.quantity } },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        if (decrement.count === 0) {
          const current = await tx.productVariant.findUniqueOrThrow({
            where: { id: item.productVariantId },
          });
          throw new PlaceOrderDomainError({
            type: "STOCK_ISSUE",
            message: "Some items in your bag are no longer available in the requested quantity.",
            issues: [
              {
                productName: item.productVariant.product.name,
                size: item.productVariant.size,
                requestedQuantity: item.quantity,
                availableQuantity: Math.max(0, current.stockQuantity),
              },
            ],
          });
        }

        const current = await tx.productVariant.findUniqueOrThrow({
          where: { id: item.productVariantId },
        });
        const newStatus = deriveStockStatus(current.stockQuantity, current.lowStockThreshold);
        if (newStatus !== current.stockStatus) {
          await tx.productVariant.update({
            where: { id: current.id },
            data: { stockStatus: newStatus },
          });
        }
      }

      const subtotalInPaise = items.reduce(
        (sum, item) => sum + item.productVariant.priceInPaise * item.quantity,
        0,
      );
      const deliveryFeeInPaise = calculateDeliveryFee({
        fulfillmentType: input.fulfillmentType,
        subtotalInPaise,
        deliveryFeeInPaise: FULFILLMENT_CONFIG.deliveryFeeInPaise,
        freeDeliveryThresholdInPaise: FULFILLMENT_CONFIG.freeDeliveryThresholdInPaise,
      });
      const totalInPaise = subtotalInPaise + deliveryFeeInPaise;

      // Best-effort "primary school" for this order, for display/filtering
      // convenience only — a basket mixing two schools' exclusive items is
      // an edge case nothing in the UI encourages; picking the first is a
      // documented simplification, not a correctness requirement.
      const schoolId =
        items.find((item) => item.productVariant.product.schoolId)?.productVariant.product
          .schoolId ?? null;

      let createdOrder: Awaited<ReturnType<typeof tx.order.create>> | null = null;
      for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
        const orderNumber = generateOrderNumber(new Date());
        const accessToken = generateOrderAccessToken();
        try {
          createdOrder = await tx.order.create({
            data: {
              orderNumber,
              accessToken,
              idempotencyKey: input.idempotencyKey,
              schoolId,
              customerName: input.customerName,
              customerMobile: input.customerMobile,
              fulfillmentType: input.fulfillmentType,
              deliveryAddressLine:
                input.fulfillmentType === "LOCAL_DELIVERY"
                  ? (input.deliveryAddressLine ?? null)
                  : null,
              deliveryArea:
                input.fulfillmentType === "LOCAL_DELIVERY" ? (input.deliveryArea ?? null) : null,
              deliveryLandmark:
                input.fulfillmentType === "LOCAL_DELIVERY"
                  ? (input.deliveryLandmark ?? null)
                  : null,
              paymentMethod: "CASH_ON_DELIVERY",
              paymentStatus: "UNPAID",
              status: "PENDING",
              subtotalInPaise,
              deliveryFeeInPaise,
              totalInPaise,
              items: {
                create: items.map((item) => ({
                  productId: item.productVariant.productId,
                  productVariantId: item.productVariantId,
                  productName: item.productVariant.product.name,
                  size: item.productVariant.size,
                  skuSnapshot: item.productVariant.sku,
                  unitPriceInPaise: item.productVariant.priceInPaise,
                  quantity: item.quantity,
                  lineTotalInPaise: item.productVariant.priceInPaise * item.quantity,
                })),
              },
            },
          });
          break;
        } catch (err) {
          if (isUniqueConstraintErrorOn(err, "orderNumber")) {
            continue; // astronomically unlikely collision — try a fresh number
          }
          throw err;
        }
      }

      if (!createdOrder) {
        throw new PlaceOrderDomainError({
          type: "UNKNOWN",
          message: "Could not generate a unique order number. Please try again.",
        });
      }

      await tx.basket.update({
        where: { id: basketId },
        data: { status: "CONVERTED", convertedOrderId: createdOrder.id },
      });

      return createdOrder;
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      alreadyExisted: false,
    };
  } catch (err) {
    if (err instanceof PlaceOrderDomainError) {
      return { success: false, error: err.domainError };
    }

    // Two near-simultaneous submissions with the same idempotency key can
    // both pass the up-front check before either commits; the loser hits
    // this unique constraint at insert time. Recover by returning the
    // winner's order rather than surfacing an error for what the customer
    // correctly sees as "I placed this order."
    if (isUniqueConstraintErrorOn(err, "idempotencyKey")) {
      const winner = await findOrderByIdempotencyKey(input.idempotencyKey);
      if (winner) return winner;
    }

    // Deliberately minimal: never log customer name/mobile/address, and
    // never forward err/stack to the caller.
    console.error(
      "placeOrderForBasket: unexpected error",
      err instanceof Error ? err.message : String(err),
    );
    return {
      success: false,
      error: { type: "UNKNOWN", message: "Something went wrong placing your order. Please try again." },
    };
  }
}
