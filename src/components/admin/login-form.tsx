"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin } from "@/server/actions/admin/auth";

export function AdminLoginForm() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const codeId = useId();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;
    setError(null);

    startTransition(async () => {
      const result = await adminLogin({ email, password, code: needsCode ? code : undefined });
      if (result.success) {
        router.push("/admin");
        router.refresh();
        return;
      }
      if (result.mfaRequired) {
        // First time through this is the prompt, not an error.
        if (needsCode) setError(result.message);
        setNeedsCode(true);
        setCode("");
        return;
      }
      setError(result.message);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}

      {needsCode ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={codeId}>6-digit code</Label>
          <p className="text-sm text-muted-foreground">Open your authenticator app and enter the code for Klasiq.</p>
          <Input
            id={codeId}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            className="h-12 text-center text-2xl tracking-[0.5em]"
          />
        </div>
      ) : (
        <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={passwordId}>Password</Label>
        <Input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
        </>
      )}

      <Button type="submit" size="lg" className="mt-2 h-12 w-full text-base" disabled={isPending || (needsCode && code.length !== 6)}>
        {isPending ? "Signing in..." : needsCode ? "Verify" : "Sign in"}
      </Button>
    </form>
  );
}
