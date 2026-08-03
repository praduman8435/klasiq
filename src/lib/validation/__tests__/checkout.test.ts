import { describe, expect, it } from "vitest";
import { checkoutInputSchema } from "@/lib/validation/checkout";

const VALID_UUID = "5c4b7c2e-8b7a-4a6e-9d0c-3f2a1b6e7d8f";

function baseInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    customerName: "Asha Kumar",
    customerMobile: "9876543210",
    fulfillmentType: "STORE_PICKUP",
    idempotencyKey: VALID_UUID,
    ...overrides,
  };
}

describe("checkoutInputSchema — Store Pickup", () => {
  it("passes without any delivery address fields", () => {
    const result = checkoutInputSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });
});

describe("checkoutInputSchema — Local Delivery", () => {
  it("requires an address line", () => {
    const result = checkoutInputSchema.safeParse(
      baseInput({ fulfillmentType: "LOCAL_DELIVERY", deliveryArea: "Sector 5" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.deliveryAddressLine).toBeDefined();
    }
  });

  it("requires an area/locality", () => {
    const result = checkoutInputSchema.safeParse(
      baseInput({ fulfillmentType: "LOCAL_DELIVERY", deliveryAddressLine: "12 Market Road" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.deliveryArea).toBeDefined();
    }
  });

  it("passes with address + area, landmark optional", () => {
    const result = checkoutInputSchema.safeParse(
      baseInput({
        fulfillmentType: "LOCAL_DELIVERY",
        deliveryAddressLine: "12 Market Road",
        deliveryArea: "Sector 5",
      }),
    );
    expect(result.success).toBe(true);
  });
});

describe("checkoutInputSchema — field validation", () => {
  it("rejects a missing name", () => {
    const result = checkoutInputSchema.safeParse(baseInput({ customerName: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid mobile number", () => {
    const result = checkoutInputSchema.safeParse(baseInput({ customerMobile: "12345" }));
    expect(result.success).toBe(false);
  });

  it("accepts a mobile number with a +91 prefix and spaces", () => {
    const result = checkoutInputSchema.safeParse(baseInput({ customerMobile: "+91 98765 43210" }));
    expect(result.success).toBe(true);
  });

  it("rejects a landline-looking number (invalid leading digit)", () => {
    const result = checkoutInputSchema.safeParse(baseInput({ customerMobile: "5876543210" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid fulfillment type — the client cannot invent one", () => {
    const result = checkoutInputSchema.safeParse(baseInput({ fulfillmentType: "DRONE_DROP" }));
    expect(result.success).toBe(false);
  });

  it("rejects a missing idempotency key", () => {
    const input = baseInput();
    delete (input as Record<string, unknown>).idempotencyKey;
    const result = checkoutInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects a non-UUID idempotency key", () => {
    const result = checkoutInputSchema.safeParse(baseInput({ idempotencyKey: "not-a-uuid" }));
    expect(result.success).toBe(false);
  });
});
