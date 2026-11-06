import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createCustomerSession = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/customer-portal/session", () => ({
  createCustomerSession: (...args: unknown[]) => createCustomerSession(...args),
  destroyCustomerSession: vi.fn(),
}));

// A fresh client IP per test, so the rate limiter of one test never
// spills into the next.
const { ip } = vi.hoisted(() => ({ ip: { current: "" } }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": ip.current }),
}));

import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/order-number";
import { signInWithOrderNumberAction } from "@/server/actions/customer-portal/auth";
import { isOtpPaused } from "@/server/customer-portal/otp";

const WHATSAPP_OTP_ENV = ["WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_OTP_TEMPLATE_NAME"];

function liveStoreWithoutWhatsApp() {
  vi.stubEnv("NODE_ENV", "production");
  for (const name of WHATSAPP_OTP_ENV) vi.stubEnv(name, "");
}

const createdCustomerIds: string[] = [];
const createdOrderIds: string[] = [];
const usedPhones: string[] = [];

beforeEach(() => {
  createCustomerSession.mockClear();
  ip.current = `test-${randomUUID()}`;
});
afterEach(() => vi.unstubAllEnvs());
afterAll(async () => {
  if (createdOrderIds.length) await db.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  if (createdCustomerIds.length) await db.customer.deleteMany({ where: { id: { in: createdCustomerIds } } });
  await db.rateLimitBucket.deleteMany({
    where: { OR: [{ key: { startsWith: "customer-signin:ip:test-" } }, ...usedPhones.map((p) => ({ key: `customer-signin:phone:${p}` }))] },
  });
  await db.$disconnect();
});

function freshTestPhone(): string {
  let rest = "";
  for (let i = 0; i < 9; i++) rest += Math.floor(Math.random() * 10);
  const phone = `${6 + Math.floor(Math.random() * 4)}${rest}`;
  usedPhones.push(`+91${phone}`);
  return phone;
}

async function customerWithOrder() {
  const phone = freshTestPhone();
  const customer = await db.customer.create({
    data: {
      customerId: `KLQ-S${randomUUID().slice(0, 6).toUpperCase()}`,
      primaryPhone: phone,
      primaryPhoneNormalized: `+91${phone}`,
    },
  });
  createdCustomerIds.push(customer.id);
  const order = await db.order.create({
    data: {
      orderNumber: generateOrderNumber(new Date()),
      accessToken: randomUUID(),
      source: "ONLINE",
      customerId: customer.id,
      customerName: "Test Sign-in Customer",
      customerMobile: phone,
      fulfillmentType: "STORE_PICKUP",
      paymentMethod: "CASH_ON_DELIVERY",
      paymentStatus: "UNPAID",
      status: "PENDING",
      subtotalInPaise: 1000,
      deliveryFeeInPaise: 0,
      totalInPaise: 1000,
      amountReceivedInPaise: 0,
      outstandingInPaise: 1000,
    },
  });
  createdOrderIds.push(order.id);
  return { phone, orderNumber: order.orderNumber };
}

describe("isOtpPaused", () => {
  it("is paused on the live store while WhatsApp OTP isn't set up", () => {
    liveStoreWithoutWhatsApp();
    expect(isOtpPaused()).toBe(true);
  });

  it("comes back on by itself once the token, number ID and OTP template are all set", () => {
    liveStoreWithoutWhatsApp();
    vi.stubEnv("WHATSAPP_API_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123");
    expect(isOtpPaused()).toBe(true);
    vi.stubEnv("WHATSAPP_OTP_TEMPLATE_NAME", "otp_code");
    expect(isOtpPaused()).toBe(false);
  });

  it("never pauses in local development (the console code still works there)", () => {
    vi.stubEnv("NODE_ENV", "development");
    for (const name of WHATSAPP_OTP_ENV) vi.stubEnv(name, "");
    expect(isOtpPaused()).toBe(false);
  });
});

describe("signInWithOrderNumberAction", () => {
  it("signs in when the mobile number and one of that customer's own order numbers match", async () => {
    const { phone, orderNumber } = await customerWithOrder();
    liveStoreWithoutWhatsApp();
    const typed = ` ${orderNumber.toLowerCase()} `;
    expect(await signInWithOrderNumberAction({ phone, orderNumber: typed })).toEqual({ success: true });
    expect(createCustomerSession).toHaveBeenCalledWith(`+91${phone}`);
  });

  it("never signs in with a mobile number alone", async () => {
    const { phone } = await customerWithOrder();
    liveStoreWithoutWhatsApp();
    const result = await signInWithOrderNumberAction({ phone });
    expect(!result.success && result.error.type).toBe("VALIDATION");
    expect(createCustomerSession).not.toHaveBeenCalled();
  });

  it("refuses someone else's order number, with the same answer as a made-up one", async () => {
    const victim = await customerWithOrder();
    const attacker = await customerWithOrder();
    liveStoreWithoutWhatsApp();
    const crossed = await signInWithOrderNumberAction({ phone: victim.phone, orderNumber: attacker.orderNumber });
    const madeUp = await signInWithOrderNumberAction({ phone: victim.phone, orderNumber: "ORD-20260101-AAAAA" });
    expect(crossed).toEqual(madeUp);
    expect(!crossed.success && crossed.error.type).toBe("NO_MATCH");
    expect(createCustomerSession).not.toHaveBeenCalled();
  });

  it("locks a phone out after 5 tries, even from different IPs", async () => {
    const { phone, orderNumber } = await customerWithOrder();
    liveStoreWithoutWhatsApp();
    for (let i = 0; i < 5; i++) {
      ip.current = `test-${randomUUID()}`;
      await signInWithOrderNumberAction({ phone, orderNumber: "ORD-20260101-AAAAA" });
    }
    ip.current = `test-${randomUUID()}`;
    const result = await signInWithOrderNumberAction({ phone, orderNumber });
    expect(!result.success && result.error.type).toBe("RATE_LIMITED");
    expect(createCustomerSession).not.toHaveBeenCalled();
  });

  it("refuses once OTP is back on, whatever the form sends", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WHATSAPP_API_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123");
    vi.stubEnv("WHATSAPP_OTP_TEMPLATE_NAME", "otp_code");
    const result = await signInWithOrderNumberAction({ phone: "9812345670", orderNumber: "ORD-20260101-AAAAA" });
    expect(!result.success && result.error.type).toBe("OTP_REQUIRED");
    expect(createCustomerSession).not.toHaveBeenCalled();
  });

  it("rejects a bad number without signing anyone in", async () => {
    liveStoreWithoutWhatsApp();
    const result = await signInWithOrderNumberAction({ phone: "12345", orderNumber: "ORD-20260101-AAAAA" });
    expect(!result.success && result.error.type).toBe("INVALID_PHONE");
    expect(createCustomerSession).not.toHaveBeenCalled();
  });
});
