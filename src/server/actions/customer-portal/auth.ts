"use server";

import { createCustomerSession, destroyCustomerSession } from "@/lib/customer-portal/session";
import { db } from "@/lib/db";
import { isValidOrderNumberFormat } from "@/lib/order-number";
import { getClientIp } from "@/lib/request-ip";
import { requestOtpSchema, signInWithOrderNumberSchema, verifyOtpSchema } from "@/lib/validation/customer-portal";
import { normalizePhoneNumber } from "@/lib/phone";
import { isOtpPaused, requestOtp, verifyOtp } from "@/server/customer-portal/otp";
import { consumeRateLimit, consumeRateLimits } from "@/server/rate-limit";

// Deliberately identical whether or not `phone` belongs to a real Klasiq
// customer — requestOtp() itself never checks Customer existence (see its
// own doc comment), so there is no existence-dependent branch to
// accidentally leak here. See docs/PHASE_3_4_REPORT.md "Customer existence
// privacy".
const GENERIC_SENT_MESSAGE = "If that number is registered with Klasiq, we've sent a verification code.";

export type RequestOtpActionResult =
  | { success: true; message: string }
  | {
      success: false;
      error: {
        type: "VALIDATION" | "INVALID_PHONE" | "COOLDOWN" | "RATE_LIMITED" | "PROVIDER_UNAVAILABLE";
        message: string;
        retryAfterSeconds?: number;
      };
    };

export async function requestOtpAction(input: unknown): Promise<RequestOtpActionResult> {
  const parsed = requestOtpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { type: "VALIDATION", message: "Please enter your mobile number." },
    };
  }

  // requestOtp() already caps each phone; this caps each client, so one
  // script can't send codes to many different numbers.
  const ipLimit = await consumeRateLimit({ key: `otp-request:ip:${await getClientIp()}`, limit: 10, windowSeconds: 15 * 60 });
  if (!ipLimit.allowed) {
    return { success: false, error: { type: "RATE_LIMITED", message: "Too many codes requested. Please wait a few minutes." } };
  }

  const result = await requestOtp(parsed.data.phone);
  if (result.success) {
    return { success: true, message: GENERIC_SENT_MESSAGE };
  }

  if (result.error.type === "COOLDOWN") {
    return {
      success: false,
      error: {
        type: "COOLDOWN",
        message: result.error.message,
        retryAfterSeconds: result.error.retryAfterSeconds,
      },
    };
  }
  return { success: false, error: { type: result.error.type, message: result.error.message } };
}

export type VerifyOtpActionResult =
  | { success: true }
  | {
      success: false;
      error: {
        type: "VALIDATION" | "INVALID_PHONE" | "NO_ACTIVE_CHALLENGE" | "EXPIRED" | "TOO_MANY_ATTEMPTS" | "WRONG_CODE";
        message: string;
      };
    };

export async function verifyOtpAction(input: unknown): Promise<VerifyOtpActionResult> {
  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: { type: "VALIDATION", message: "Enter the 6-digit code." } };
  }

  const result = await verifyOtp(parsed.data.phone, parsed.data.code);
  if (!result.success) {
    return { success: false, error: { type: result.error.type, message: result.error.message } };
  }

  // Always mints a fresh session token — never promotes any client-supplied
  // value into authenticated state (session-fixation resistance). See
  // docs/PHASE_3_4_REPORT.md "Session fixation".
  await createCustomerSession(result.phoneNormalized);
  return { success: true };
}

export type SignInWithOrderNumberActionResult =
  | { success: true }
  | {
      success: false;
      error: { type: "VALIDATION" | "INVALID_PHONE" | "OTP_REQUIRED" | "NO_MATCH" | "RATE_LIMITED"; message: string };
    };

const NO_MATCH_MESSAGE =
  "We couldn't match that mobile number and order number. Check the order number on your bill and try again.";

/**
 * Sign-in while WhatsApp codes are switched off (`isOtpPaused()`, checked
 * here on the server, never trusted from the form). A mobile number alone
 * is NOT proof of anything — anyone can type someone else's number — so
 * the customer must also give the number of one of THEIR OWN orders (on
 * every bill and order message). Both must match the same Customer, in
 * one query, and the answer is the same whichever half was wrong, so
 * neither half can be probed on its own. Rate limited per IP and per
 * phone across every server instance. Once WhatsApp is configured this
 * refuses and the code flow is the only way in.
 */
export async function signInWithOrderNumberAction(input: unknown): Promise<SignInWithOrderNumberActionResult> {
  if (!isOtpPaused()) {
    return { success: false, error: { type: "OTP_REQUIRED", message: "Please sign in with the code we send you." } };
  }
  const parsed = signInWithOrderNumberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { type: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Please check the form." },
    };
  }
  const phone = normalizePhoneNumber(parsed.data.phone);
  if (!phone.valid) {
    return { success: false, error: { type: "INVALID_PHONE", message: "Please enter a valid 10-digit mobile number." } };
  }

  const ip = await getClientIp();
  const limited = await consumeRateLimits([
    { key: `customer-signin:ip:${ip}`, limit: 10, windowSeconds: 15 * 60 },
    { key: `customer-signin:phone:${phone.normalized}`, limit: 5, windowSeconds: 15 * 60 },
  ]);
  if (!limited.allowed) {
    return {
      success: false,
      error: { type: "RATE_LIMITED", message: "Too many tries. Please wait a few minutes and try again." },
    };
  }

  const orderNumber = parsed.data.orderNumber.toUpperCase().replace(/\s+/g, "");
  const match = isValidOrderNumberFormat(orderNumber)
    ? await db.order.findFirst({
        where: { orderNumber, customer: { primaryPhoneNormalized: phone.normalized } },
        select: { id: true },
      })
    : null;
  if (!match) {
    return { success: false, error: { type: "NO_MATCH", message: NO_MATCH_MESSAGE } };
  }

  await createCustomerSession(phone.normalized);
  return { success: true };
}

export async function customerLogoutAction(): Promise<{ success: true }> {
  await destroyCustomerSession();
  return { success: true };
}
