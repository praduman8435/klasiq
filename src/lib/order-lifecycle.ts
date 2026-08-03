import type { FulfillmentType, OrderStatus, PaymentStatus } from "@prisma/client";

/**
 * Explicit order-status lifecycle. Not every status applies to every
 * fulfillment method — a Store Pickup order is never OUT_FOR_DELIVERY, and
 * a Local Delivery order is never READY_FOR_PICKUP. CANCELLED and
 * DELIVERED are terminal: nothing transitions out of them.
 *
 * This only validates transitions; nothing in Phase 2 calls it from a
 * mutating endpoint yet (no admin UI exists). It exists now so Phase 3's
 * admin order-management UI has a correct, tested rule to build on instead
 * of improvising one under deadline pressure.
 */
const BASE_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_PICKUP: ["DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

const FULFILLMENT_ONLY_STATUS: Partial<Record<OrderStatus, FulfillmentType>> = {
  READY_FOR_PICKUP: "STORE_PICKUP",
  OUT_FOR_DELIVERY: "LOCAL_DELIVERY",
};

export function isValidOrderStatusTransition(params: {
  from: OrderStatus;
  to: OrderStatus;
  fulfillmentType: FulfillmentType;
}): boolean {
  const { from, to, fulfillmentType } = params;

  const requiredFulfillment = FULFILLMENT_ONLY_STATUS[to];
  if (requiredFulfillment && requiredFulfillment !== fulfillmentType) {
    return false;
  }

  return BASE_TRANSITIONS[from].includes(to);
}

/** All statuses currently reachable in one step from `from`, for this order's fulfillment method. */
export function nextValidOrderStatuses(params: {
  from: OrderStatus;
  fulfillmentType: FulfillmentType;
}): OrderStatus[] {
  const { from, fulfillmentType } = params;
  return BASE_TRANSITIONS[from].filter((to) => {
    const requiredFulfillment = FULFILLMENT_ONLY_STATUS[to];
    return !requiredFulfillment || requiredFulfillment === fulfillmentType;
  });
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return BASE_TRANSITIONS[status].length === 0;
}

// ---------------------------------------------------------------------------
// Payment status
// ---------------------------------------------------------------------------

/**
 * Deliberately separate from OrderStatus: "confirmed" and "paid" are
 * different facts. COD/pay-at-store orders are created UNPAID and move to
 * PAID only when staff actually collect money — nothing in the order-status
 * lifecycle implies payment.
 */
const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  UNPAID: ["PAID", "FAILED"],
  PAID: ["REFUNDED"],
  REFUNDED: [],
  FAILED: ["UNPAID"],
};

export function isValidPaymentStatusTransition(params: {
  from: PaymentStatus;
  to: PaymentStatus;
}): boolean {
  return PAYMENT_TRANSITIONS[params.from].includes(params.to);
}
