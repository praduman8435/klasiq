"use server";

import QRCode from "qrcode";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { destroyOtherAdminSessions, getAdminSession } from "@/lib/admin/session";
import { generateTotpSecret, openTotpSecret, sealTotpSecret, totpUri, verifyTotp } from "@/lib/admin/totp";
import { BRAND } from "@/lib/constants";
import { db } from "@/lib/db";
import { consumeRateLimit } from "@/server/rate-limit";

type Failure = { success: false; message: string };

const codeSchema = z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your app.") });

async function limited(adminUserId: string): Promise<boolean> {
  const result = await consumeRateLimit({ key: `admin-mfa:${adminUserId}`, limit: 10, windowSeconds: 10 * 60 });
  return !result.allowed;
}

export type StartTwoStepResult =
  | { success: true; secret: string; qrDataUrl: string }
  | Failure;

/** Step 1 of set-up: a fresh secret, held as "pending" until the admin
 * proves their app produces matching codes. */
export async function startTwoStepSetupAction(): Promise<StartTwoStepResult> {
  const admin = await getAdminSession();
  if (!admin) return { success: false, message: "Please sign in again." };
  if (admin.totpEnabledAt) return { success: false, message: "Two-step sign-in is already on." };

  const secret = generateTotpSecret();
  await db.adminUser.update({ where: { id: admin.id }, data: { totpPendingSecret: sealTotpSecret(secret) } });

  const uri = totpUri({ secretBase32: secret, accountName: admin.email, issuer: BRAND.name });
  const svg = await QRCode.toString(uri, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return { success: true, secret, qrDataUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` };
}

/** Step 2: the first code from the app turns two-step sign-in on, and
 * signs this admin out of every other device. */
export async function confirmTwoStepSetupAction(input: unknown): Promise<{ success: true } | Failure> {
  const admin = await getAdminSession();
  if (!admin) return { success: false, message: "Please sign in again." };
  const parsed = codeSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]!.message };
  if (await limited(admin.id)) return { success: false, message: "Too many tries. Please wait a few minutes." };

  const secret = admin.totpPendingSecret ? openTotpSecret(admin.totpPendingSecret) : null;
  if (!secret) return { success: false, message: "Set-up expired. Please start again." };
  const step = verifyTotp({ secretBase32: secret, code: parsed.data.code });
  if (step === null) return { success: false, message: "That code didn't match. Check the time on your phone and try the newest code." };

  await db.adminUser.update({
    where: { id: admin.id },
    data: { totpSecret: sealTotpSecret(secret), totpPendingSecret: null, totpEnabledAt: new Date(), totpLastStep: step },
  });
  await destroyOtherAdminSessions(admin.id);
  revalidatePath("/admin/security");
  return { success: true };
}

/** Turning it off needs a current code — a borrowed, unlocked laptop
 * alone isn't enough. */
export async function disableTwoStepAction(input: unknown): Promise<{ success: true } | Failure> {
  const admin = await getAdminSession();
  if (!admin) return { success: false, message: "Please sign in again." };
  const parsed = codeSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]!.message };
  if (await limited(admin.id)) return { success: false, message: "Too many tries. Please wait a few minutes." };

  const secret = admin.totpSecret ? openTotpSecret(admin.totpSecret) : null;
  if (!admin.totpEnabledAt || !secret) return { success: false, message: "Two-step sign-in isn't on." };
  const step = verifyTotp({ secretBase32: secret, code: parsed.data.code, lastUsedStep: admin.totpLastStep });
  if (step === null) return { success: false, message: "That code didn't work. Enter the newest code from your app." };

  await db.adminUser.update({
    where: { id: admin.id },
    data: { totpSecret: null, totpPendingSecret: null, totpEnabledAt: null, totpLastStep: null },
  });
  revalidatePath("/admin/security");
  return { success: true };
}
