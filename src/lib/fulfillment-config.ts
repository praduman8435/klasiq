import type { FulfillmentType } from "@prisma/client";

/**
 * Single configuration boundary for fulfillment/delivery behavior. No admin
 * settings system exists yet (Phase 3), so this reads environment
 * variables with sensible defaults — but every UI component and server
 * action reads fulfillment rules through this module, never by hard-coding
 * a fee or an enabled/disabled flag inline. Swapping this for a
 * database-backed admin setting later only means changing this file.
 *
 * Not marked "server-only": it holds business config (fees, toggles), never
 * secrets, and calculateDeliveryFee is intentionally plain/pure so it's
 * directly unit-testable. Only import FULFILLMENT_CONFIG from Server
 * Components/Actions in practice — pass values down as props to any Client
 * Component that needs them, the same way the rest of this codebase avoids
 * server-config imports inside "use client" files.
 */

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw === "true" || raw === "1";
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const FULFILLMENT_CONFIG = {
  pickupEnabled: envBool("PICKUP_ENABLED", true),
  deliveryEnabled: envBool("DELIVERY_ENABLED", true),
  /** Flat delivery fee in paise, charged unless the subtotal meets the free-delivery threshold. */
  deliveryFeeInPaise: envInt("DELIVERY_FEE_IN_PAISE", 4000),
  /** Subtotal (in paise) at or above which delivery becomes free. */
  freeDeliveryThresholdInPaise: envInt("FREE_DELIVERY_THRESHOLD_IN_PAISE", 100000),
  serviceableAreaNote:
    process.env.DELIVERY_SERVICEABLE_AREA_NOTE ??
    "We currently deliver within a few kilometres of the store. If you're unsure we cover your area, choose Store Pickup or call us.",
} as const;

/**
 * Pure so it's directly unit-testable without touching env/config loading.
 * Store Pickup never has a delivery fee, by definition.
 */
export function calculateDeliveryFee(params: {
  fulfillmentType: FulfillmentType;
  subtotalInPaise: number;
  deliveryFeeInPaise: number;
  freeDeliveryThresholdInPaise: number;
}): number {
  const { fulfillmentType, subtotalInPaise, deliveryFeeInPaise, freeDeliveryThresholdInPaise } =
    params;

  if (fulfillmentType === "STORE_PICKUP") return 0;
  if (subtotalInPaise >= freeDeliveryThresholdInPaise) return 0;
  return deliveryFeeInPaise;
}
