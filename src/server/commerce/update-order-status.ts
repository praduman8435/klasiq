import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { deriveStockStatus } from "@/lib/stock";
import { isValidOrderStatusTransition, isValidPaymentStatusTransition } from "@/lib/order-lifecycle";

export type OrderTransitionError =
  | { type: "NOT_FOUND"; message: string }
  | { type: "INVALID_TRANSITION"; message: string }
  | { type: "CONFLICT"; message: string };

export type OrderTransitionResult =
  | { success: true; alreadyInState: boolean }
  | { success: false; error: OrderTransitionError };

class ConcurrencyConflictError extends Error {}

/**
 * Moves an order to `newStatus`, reusing the exact Phase 2
 * isValidOrderStatusTransition rule (fulfillment-aware) — this file must
 * never duplicate that logic, only call it. Two safety properties:
 *
 * 1. Idempotent: if the order is already in `newStatus`, this is a no-op
 *    success rather than an error or a second side effect. This is what
 *    makes repeated cancellation requests safe — see below.
 * 2. Concurrency-safe: the actual status write is a guarded
 *    `updateMany({ where: { id, status: <status we read> } })`, so two
 *    admins (or one admin double-clicking) racing to transition the same
 *    order can't both succeed — the loser gets a CONFLICT telling them to
 *    refresh, rather than silently double-applying a side effect.
 *
 * Cancelling restores inventory for every line item, atomically with the
 * status write, in one transaction, and records an InventoryAdjustment
 * (reason: ORDER_CANCELLATION_RESTORE) per item for traceability. Because
 * the status write is idempotent+guarded, a second cancellation attempt on
 * an already-CANCELLED order returns success without touching inventory
 * again — restoration only ever runs on the single transition INTO
 * CANCELLED, never on an already-cancelled order.
 */
export async function updateOrderStatus(params: {
  orderNumber: string;
  newStatus: OrderStatus;
  adminUserId: string;
}): Promise<OrderTransitionResult> {
  const { orderNumber, newStatus, adminUserId } = params;

  const order = await db.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) {
    return { success: false, error: { type: "NOT_FOUND", message: "Order not found." } };
  }

  if (order.status === newStatus) {
    return { success: true, alreadyInState: true };
  }

  if (
    !isValidOrderStatusTransition({
      from: order.status,
      to: newStatus,
      fulfillmentType: order.fulfillmentType,
    })
  ) {
    return {
      success: false,
      error: {
        type: "INVALID_TRANSITION",
        message: `Cannot move an order from ${order.status} to ${newStatus}.`,
      },
    };
  }

  try {
    if (newStatus === "CANCELLED") {
      await db.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: order.status },
          data: { status: "CANCELLED" },
        });
        if (updated.count === 0) throw new ConcurrencyConflictError();

        for (const item of order.items) {
          const variant = await tx.productVariant.findUniqueOrThrow({
            where: { id: item.productVariantId },
          });
          const newQuantity = variant.stockQuantity + item.quantity;

          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stockQuantity: { increment: item.quantity },
              stockStatus: deriveStockStatus(newQuantity, variant.lowStockThreshold),
            },
          });

          await tx.inventoryAdjustment.create({
            data: {
              productVariantId: variant.id,
              previousQuantity: variant.stockQuantity,
              newQuantity,
              delta: item.quantity,
              reason: "ORDER_CANCELLATION_RESTORE",
              adminUserId,
              orderId: order.id,
            },
          });
        }
      });
    } else {
      const updated = await db.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: newStatus },
      });
      if (updated.count === 0) throw new ConcurrencyConflictError();
    }
  } catch (err) {
    if (err instanceof ConcurrencyConflictError) {
      return {
        success: false,
        error: {
          type: "CONFLICT",
          message: "This order's status changed since you loaded the page. Please refresh.",
        },
      };
    }
    throw err;
  }

  return { success: true, alreadyInState: false };
}

export type PaymentTransitionResult =
  | { success: true; alreadyInState: boolean }
  | { success: false; error: OrderTransitionError };

/** Same idempotent + concurrency-guarded shape as updateOrderStatus, for the independent payment-status lifecycle. */
export async function updatePaymentStatus(params: {
  orderNumber: string;
  newPaymentStatus: PaymentStatus;
}): Promise<PaymentTransitionResult> {
  const { orderNumber, newPaymentStatus } = params;

  const order = await db.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return { success: false, error: { type: "NOT_FOUND", message: "Order not found." } };
  }

  if (order.paymentStatus === newPaymentStatus) {
    return { success: true, alreadyInState: true };
  }

  if (!isValidPaymentStatusTransition({ from: order.paymentStatus, to: newPaymentStatus })) {
    return {
      success: false,
      error: {
        type: "INVALID_TRANSITION",
        message: `Cannot move payment status from ${order.paymentStatus} to ${newPaymentStatus}.`,
      },
    };
  }

  // A cancelled order can still move an existing PAID balance to REFUNDED,
  // but it must never be freshly marked PAID after the fact — there's
  // nothing left to collect payment for. Found via manual verification
  // (an admin could otherwise "Mark Paid" a cancelled order), not
  // anticipated up front — see docs/PHASE_3_REPORT.md.
  if (order.status === "CANCELLED" && newPaymentStatus === "PAID") {
    return {
      success: false,
      error: {
        type: "INVALID_TRANSITION",
        message: "This order is cancelled — it can't be marked paid.",
      },
    };
  }

  const updated = await db.order.updateMany({
    where: { id: order.id, paymentStatus: order.paymentStatus },
    data: { paymentStatus: newPaymentStatus },
  });
  if (updated.count === 0) {
    return {
      success: false,
      error: {
        type: "CONFLICT",
        message: "This order's payment status changed since you loaded the page. Please refresh.",
      },
    };
  }

  return { success: true, alreadyInState: false };
}
