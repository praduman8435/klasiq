"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, KeyRound, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_PASSWORD_MIN_LENGTH } from "@/lib/admin/password-policy";
import { changeAdminPasswordAction, signOutOtherDevicesAction } from "@/server/actions/admin/security";

function ErrorNote({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  );
}

export function ChangePasswordCard({ twoStepOn }: { twoStepOn: boolean }) {
  const router = useRouter();
  const ids = { current: useId(), next: useId(), confirm: useId(), code: useId() };
  const [isPending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const tooShort = newPassword.length > 0 && newPassword.length < ADMIN_PASSWORD_MIN_LENGTH;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;
    if (newPassword !== confirm) {
      setError("The two new passwords don't match.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await changeAdminPasswordAction({ currentPassword, newPassword, code: twoStepOn ? code : undefined });
      if (!result.success) {
        setError(result.message);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setCode("");
      toast.success("Password changed. Every other device was signed out.");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <h2 className="font-semibold">Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            At least {ADMIN_PASSWORD_MIN_LENGTH} characters. A short phrase you&apos;ll remember beats a jumble of symbols.
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3 border-t pt-4" noValidate>
        {error && <ErrorNote message={error} />}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.current}>Current password</Label>
          <Input id={ids.current} type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-11" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.next}>New password</Label>
            <Input
              id={ids.next}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-invalid={tooShort}
              aria-describedby={`${ids.next}-hint`}
              className="h-11"
            />
            <p id={`${ids.next}-hint`} className="text-xs text-muted-foreground tabular-nums">
              {newPassword.length}/{ADMIN_PASSWORD_MIN_LENGTH}+ characters
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.confirm}>Type it again</Label>
            <Input
              id={ids.confirm}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={mismatch}
              className="h-11"
            />
            {mismatch && <p className="text-xs text-destructive">Doesn&apos;t match yet.</p>}
          </div>
        </div>
        {twoStepOn && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.code}>6-digit code from your app</Label>
            <Input
              id={ids.code}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-11 max-w-40 text-center tracking-[0.3em]"
            />
          </div>
        )}
        <Button
          type="submit"
          className="mt-1 self-start"
          disabled={isPending || !currentPassword || newPassword.length < ADMIN_PASSWORD_MIN_LENGTH || mismatch || (twoStepOn && code.length !== 6)}
        >
          {isPending ? "Changing..." : "Change password"}
        </Button>
      </form>
    </section>
  );
}

export function SessionsCard({ activeSessions }: { activeSessions: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const others = Math.max(0, activeSessions - 1);

  function signOutOthers() {
    startTransition(async () => {
      const result = await signOutOtherDevicesAction();
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.signedOut > 0 ? `Signed out ${result.signedOut} other device${result.signedOut === 1 ? "" : "s"}.` : "No other devices were signed in.");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-3">
        <MonitorSmartphone className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <h2 className="font-semibold">Signed-in devices</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {others === 0
              ? "Only this device is signed in."
              : `This device and ${others} other${others === 1 ? "" : "s"}. Don't recognise one? Sign them out and change your password.`}
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" onClick={signOutOthers} disabled={isPending || others === 0} className="self-start sm:self-center">
        {isPending ? "Signing out..." : "Sign out other devices"}
      </Button>
    </section>
  );
}
