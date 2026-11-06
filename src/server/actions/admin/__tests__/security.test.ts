import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

const { store } = vi.hoisted(() => ({ store: new Map<string, string>() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (store.has(name) ? { name, value: store.get(name)! } : undefined),
    set: (name: string, value: string) => void store.set(name, value),
    delete: (arg: string | { name: string }) => void store.delete(typeof arg === "string" ? arg : arg.name),
  }),
  headers: async () => new Headers({ "x-real-ip": `test-${randomUUID()}` }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { hashPassword, verifyPassword } from "@/lib/admin/password";
import { adminPasswordProblem } from "@/lib/admin/password-policy";
import { createAdminSession } from "@/lib/admin/session";
import { currentTotpStep, generateTotpSecret, sealTotpSecret, totpCode } from "@/lib/admin/totp";
import { changeAdminPasswordAction, signOutOtherDevicesAction } from "@/server/actions/admin/security";

const OLD = "the-old-long-password";
const NEW = "a brand new passphrase";
const adminIds: string[] = [];

beforeEach(() => store.clear());
afterAll(async () => {
  await db.adminSession.deleteMany({ where: { adminUserId: { in: adminIds } } });
  await db.rateLimitBucket.deleteMany({ where: { key: { in: adminIds.map((id) => `admin-mfa:${id}`) } } });
  await db.adminUser.deleteMany({ where: { id: { in: adminIds } } });
  await db.$disconnect();
});

async function signedInAdmin(extra: { totpSecret?: string } = {}) {
  const admin = await db.adminUser.create({
    data: {
      name: "Test Security Admin",
      email: `test-security-${randomUUID()}@example.com`,
      passwordHash: await hashPassword(OLD),
      ...(extra.totpSecret ? { totpSecret: sealTotpSecret(extra.totpSecret), totpEnabledAt: new Date() } : {}),
    },
  });
  adminIds.push(admin.id);
  // Another device's session, then this browser's.
  await createAdminSession(admin.id);
  store.clear();
  await createAdminSession(admin.id);
  return admin;
}

describe("adminPasswordProblem", () => {
  it("wants 12+ characters, nothing common, and not the email name", () => {
    expect(adminPasswordProblem("short", "a@b.c")).toMatch(/12 characters/);
    expect(adminPasswordProblem("password1234", "a@b.c")).toMatch(/too common/);
    expect(adminPasswordProblem("aaaaaaaaaaaaaa", "a@b.c")).toMatch(/too common/);
    expect(adminPasswordProblem("praduman-shop-2026", "praduman@x.com")).toMatch(/email name/);
    expect(adminPasswordProblem("blue mango bicycle", "praduman@x.com")).toBeNull();
  });
});

describe("changeAdminPasswordAction", () => {
  it("changes the password and signs every other device out", async () => {
    const admin = await signedInAdmin();
    expect(await db.adminSession.count({ where: { adminUserId: admin.id } })).toBe(2);
    expect(await changeAdminPasswordAction({ currentPassword: OLD, newPassword: NEW })).toEqual({ success: true });
    const updated = await db.adminUser.findUniqueOrThrow({ where: { id: admin.id } });
    expect(await verifyPassword({ plainPassword: NEW, storedHash: updated.passwordHash })).toBe(true);
    expect(await db.adminSession.count({ where: { adminUserId: admin.id } })).toBe(1);
  });

  it("refuses a wrong current password and a weak new one", async () => {
    await signedInAdmin();
    expect(await changeAdminPasswordAction({ currentPassword: "nope", newPassword: NEW })).toMatchObject({ success: false });
    expect(await changeAdminPasswordAction({ currentPassword: OLD, newPassword: "short" })).toMatchObject({ success: false });
  });

  it("needs a current app code when two-step sign-in is on", async () => {
    const secret = generateTotpSecret();
    await signedInAdmin({ totpSecret: secret });
    expect(await changeAdminPasswordAction({ currentPassword: OLD, newPassword: NEW })).toMatchObject({ success: false });
    const code = totpCode(secret, currentTotpStep());
    expect(await changeAdminPasswordAction({ currentPassword: OLD, newPassword: NEW, code })).toEqual({ success: true });
  });

  it("does nothing without a session", async () => {
    expect(await changeAdminPasswordAction({ currentPassword: OLD, newPassword: NEW })).toMatchObject({ success: false });
  });
});

describe("signOutOtherDevicesAction", () => {
  it("ends every session except this browser's", async () => {
    const admin = await signedInAdmin();
    expect(await signOutOtherDevicesAction()).toEqual({ success: true, signedOut: 1 });
    expect(await db.adminSession.count({ where: { adminUserId: admin.id } })).toBe(1);
  });
});
