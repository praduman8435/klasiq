import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ChangePasswordCard, SessionsCard } from "@/components/admin/account-security";
import { TwoStepSettings } from "@/components/admin/two-step-settings";
import { getAdminSession } from "@/lib/admin/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Security" };

export default async function AdminSecurityPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const activeSessions = await db.adminSession.count({
    where: { adminUserId: admin.id, expiresAt: { gt: new Date() } },
  });

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">Signed in as {admin.email}.</p>
      </div>
      <TwoStepSettings enabledAt={admin.totpEnabledAt?.toISOString() ?? null} />
      <ChangePasswordCard twoStepOn={Boolean(admin.totpEnabledAt)} />
      <SessionsCard activeSessions={activeSessions} />
    </div>
  );
}
