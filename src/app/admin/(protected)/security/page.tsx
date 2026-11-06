import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TwoStepSettings } from "@/components/admin/two-step-settings";
import { getAdminSession } from "@/lib/admin/session";

export const metadata: Metadata = { title: "Security" };

export default async function AdminSecurityPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">Signed in as {admin.email}.</p>
      </div>
      <TwoStepSettings enabledAt={admin.totpEnabledAt?.toISOString() ?? null} />
    </div>
  );
}
