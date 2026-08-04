"use server";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/admin/password";
import { createAdminSession, destroyAdminSession } from "@/lib/admin/session";
import { adminLoginSchema } from "@/lib/validation/admin-auth";

export type AdminLoginResult = { success: true } | { success: false; message: string };

export async function adminLogin(input: unknown): Promise<AdminLoginResult> {
  const parsed = adminLoginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please enter your email and password." };
  }
  const { email, password } = parsed.data;

  const user = await db.adminUser.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    // Still do a scrypt-equivalent amount of work on an unknown/inactive
    // email so the response takes roughly the same time either way — a
    // cheap guard against account-enumeration-by-timing on a login form
    // with no other rate limiting.
    await verifyPassword({
      plainPassword: password,
      storedHash: await hashPassword("decoy-comparison-value"),
    });
    return { success: false, message: "Invalid email or password." };
  }

  const valid = await verifyPassword({ plainPassword: password, storedHash: user.passwordHash });
  if (!valid) {
    return { success: false, message: "Invalid email or password." };
  }

  await createAdminSession(user.id);
  return { success: true };
}

export async function adminLogout(): Promise<{ success: true }> {
  await destroyAdminSession();
  return { success: true };
}
