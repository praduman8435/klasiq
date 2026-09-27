import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createCustomerSession = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/customer-portal/session", () => ({
  createCustomerSession: (...args: unknown[]) => createCustomerSession(...args),
  destroyCustomerSession: vi.fn(),
}));

import { signInWithoutCodeAction } from "@/server/actions/customer-portal/auth";
import { isOtpPaused } from "@/server/customer-portal/otp";

const WHATSAPP_OTP_ENV = ["WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_OTP_TEMPLATE_NAME"];

function liveStoreWithoutWhatsApp() {
  vi.stubEnv("NODE_ENV", "production");
  for (const name of WHATSAPP_OTP_ENV) vi.stubEnv(name, "");
}

beforeEach(() => createCustomerSession.mockClear());
afterEach(() => vi.unstubAllEnvs());

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

describe("signInWithoutCodeAction", () => {
  it("signs in with the mobile number alone while OTP is paused", async () => {
    liveStoreWithoutWhatsApp();
    expect(await signInWithoutCodeAction({ phone: "98123 45670" })).toEqual({ success: true });
    expect(createCustomerSession).toHaveBeenCalledWith("+919812345670");
  });

  it("refuses once OTP is back on, whatever the form sends", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("WHATSAPP_API_TOKEN", "token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "123");
    vi.stubEnv("WHATSAPP_OTP_TEMPLATE_NAME", "otp_code");
    const result = await signInWithoutCodeAction({ phone: "9812345670" });
    expect(result.success).toBe(false);
    expect(!result.success && result.error.type).toBe("OTP_REQUIRED");
    expect(createCustomerSession).not.toHaveBeenCalled();
  });

  it("rejects a bad number without signing anyone in", async () => {
    liveStoreWithoutWhatsApp();
    const result = await signInWithoutCodeAction({ phone: "12345" });
    expect(!result.success && result.error.type).toBe("INVALID_PHONE");
    expect(createCustomerSession).not.toHaveBeenCalled();
  });
});
