"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmTwoStepSetupAction,
  disableTwoStepAction,
  startTwoStepSetupAction,
} from "@/server/actions/admin/security";

function CodeInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="123456"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
      className="h-12 max-w-48 text-center text-2xl tracking-[0.4em]"
    />
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  );
}

export function TwoStepSettings({ enabledAt }: { enabledAt: string | null }) {
  const router = useRouter();
  const codeId = useId();
  const [isPending, startTransition] = useTransition();
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function begin() {
    setError(null);
    startTransition(async () => {
      const result = await startTwoStepSetupAction();
      if (result.success) setSetup({ secret: result.secret, qrDataUrl: result.qrDataUrl });
      else setError(result.message);
    });
  }

  function confirm(event: React.FormEvent) {
    event.preventDefault();
    if (isPending || code.length !== 6) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmTwoStepSetupAction({ code });
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSetup(null);
      setCode("");
      toast.success("Two-step sign-in is on. Other devices were signed out.");
      router.refresh();
    });
  }

  function disable(event: React.FormEvent) {
    event.preventDefault();
    if (isPending || code.length !== 6) return;
    setError(null);
    startTransition(async () => {
      const result = await disableTwoStepAction({ code });
      if (!result.success) {
        setError(result.message);
        return;
      }
      setCode("");
      toast.success("Two-step sign-in is off.");
      router.refresh();
    });
  }

  if (enabledAt) {
    return (
      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-400 light:text-emerald-700" aria-hidden />
          <div>
            <h2 className="font-semibold">Two-step sign-in is on</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Since {new Date(enabledAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}. Signing in needs your
              password and a code from your authenticator app.
            </p>
          </div>
        </div>
        <form onSubmit={disable} className="flex flex-col gap-3 border-t pt-4">
          <Label htmlFor={codeId}>To turn it off, enter a current code</Label>
          {error && <ErrorNote message={error} />}
          <div className="flex flex-wrap items-center gap-3">
            <CodeInput id={codeId} value={code} onChange={setCode} />
            <Button type="submit" variant="outline" disabled={isPending || code.length !== 6}>
              {isPending ? "Turning off..." : "Turn off"}
            </Button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-400 light:text-amber-700" aria-hidden />
        <div>
          <h2 className="font-semibold">Two-step sign-in is off</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn it on so a stolen or guessed password alone can never open the shop&apos;s admin. You&apos;ll need an
            authenticator app — Google Authenticator, Microsoft Authenticator or 1Password all work.
          </p>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {!setup ? (
        <Button onClick={begin} disabled={isPending} className="self-start">
          {isPending ? "Preparing..." : "Set up two-step sign-in"}
        </Button>
      ) : (
        <form onSubmit={confirm} className="flex flex-col gap-4 border-t pt-4">
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm">
            <li>
              In your authenticator app, add an account and scan this code.
              {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, nothing to optimise */}
              <img
                src={setup.qrDataUrl}
                alt="QR code for your authenticator app"
                width={176}
                height={176}
                className="mt-3 rounded-xl bg-white p-2"
              />
              <p className="mt-2 text-muted-foreground">
                Can&apos;t scan? Enter this key instead:{" "}
                <code className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                  {setup.secret.match(/.{1,4}/g)?.join(" ")}
                </code>
              </p>
            </li>
            <li>
              <Label htmlFor={codeId}>Enter the 6-digit code it shows</Label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <CodeInput id={codeId} value={code} onChange={setCode} />
                <Button type="submit" disabled={isPending || code.length !== 6}>
                  {isPending ? "Checking..." : "Turn on"}
                </Button>
              </div>
            </li>
          </ol>
        </form>
      )}
    </section>
  );
}
