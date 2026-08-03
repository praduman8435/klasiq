import { describe, expect, it } from "vitest";
import { calculateDeliveryFee } from "@/lib/fulfillment-config";

describe("calculateDeliveryFee", () => {
  const base = {
    deliveryFeeInPaise: 4000,
    freeDeliveryThresholdInPaise: 100000,
  };

  it("is always 0 for Store Pickup, regardless of subtotal", () => {
    expect(
      calculateDeliveryFee({ ...base, fulfillmentType: "STORE_PICKUP", subtotalInPaise: 0 }),
    ).toBe(0);
    expect(
      calculateDeliveryFee({ ...base, fulfillmentType: "STORE_PICKUP", subtotalInPaise: 500000 }),
    ).toBe(0);
  });

  it("charges the flat fee for delivery below the free threshold", () => {
    expect(
      calculateDeliveryFee({ ...base, fulfillmentType: "LOCAL_DELIVERY", subtotalInPaise: 50000 }),
    ).toBe(4000);
  });

  it("is free at exactly the threshold", () => {
    expect(
      calculateDeliveryFee({ ...base, fulfillmentType: "LOCAL_DELIVERY", subtotalInPaise: 100000 }),
    ).toBe(0);
  });

  it("is free above the threshold", () => {
    expect(
      calculateDeliveryFee({ ...base, fulfillmentType: "LOCAL_DELIVERY", subtotalInPaise: 150000 }),
    ).toBe(0);
  });

  it("charges the fee just below the threshold", () => {
    expect(
      calculateDeliveryFee({ ...base, fulfillmentType: "LOCAL_DELIVERY", subtotalInPaise: 99999 }),
    ).toBe(4000);
  });
});
