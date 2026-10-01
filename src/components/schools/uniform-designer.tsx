"use client";

import { useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Copy, MessageCircle, Phone } from "lucide-react";
import { SampleSwatch, UniformPreview, type ChosenParts } from "@/components/schools/uniform-preview";
import { STORE_CONTACT } from "@/lib/constants";
import {
  DESIGN_PARTS,
  SAMPLE_KIND_LABEL,
  designSelectionToQuery,
  type DesignPartKey,
  type DesignSample,
  type DesignSelection,
} from "@/lib/uniform-design";
import { cn } from "@/lib/utils";
import { submitSchoolEnquiryAction } from "@/server/actions/school-enquiry";

const ROLES = ["Principal", "Manager", "Owner / trustee", "Teacher", "Other"];

/**
 * The uniform designer at /for-schools/design. A principal or manager
 * picks a sample for each part; the boy and girl preview recolours as
 * they go. The choice lives in the page link, so "Share design" sends
 * the exact look to the school's owner or committee. The quote form
 * below sends it to the shop.
 */
export function UniformDesigner({ samples, initial }: { samples: DesignSample[]; initial: DesignSelection }) {
  const [selection, setSelection] = useState<DesignSelection>(initial);
  const [copied, setCopied] = useState(false);
  const byId = new Map(samples.map((s) => [s.id, s]));
  const parts: ChosenParts = {};
  for (const part of DESIGN_PARTS) {
    const sample = selection[part.key] ? byId.get(selection[part.key]!) : undefined;
    if (sample) parts[part.key] = sample;
  }

  useEffect(() => {
    const query = designSelectionToQuery(selection);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [selection]);

  function choose(key: DesignPartKey, id: string | undefined) {
    setSelection((current) => ({ ...current, [key]: id }));
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Our school uniform design", url });
        return;
      } catch {
        // cancelled: fall through to copying
      }
    }
    await navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card px-6 pb-2 pt-5 sm:px-10">
          <UniformPreview parts={parts} idPrefix="designer" className="mx-auto max-w-sm" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={share}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-secondary"
          >
            {copied ? <Check className="size-4 text-deal" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Link copied" : "Share design"}
          </button>
          <a
            href="#quote"
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Get a quote
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {DESIGN_PARTS.map((part) => {
          const options = samples.filter((s) => s.kind === part.kind);
          const chosen = parts[part.key];
          return (
            <fieldset key={part.key} className="min-w-0">
              <legend className="text-base font-bold">
                {SAMPLE_KIND_LABEL[part.kind]}
                {part.optional && <span className="ml-1.5 text-sm font-medium text-muted-foreground">(optional)</span>}
              </legend>
              {options.length === 0 ? (
                <p className="mt-1.5 text-sm text-muted-foreground">No samples added yet. Ask us when you call.</p>
              ) : (
                <>
                  <div role="radiogroup" aria-label={SAMPLE_KIND_LABEL[part.kind]} className="-mx-1 mt-2 flex flex-wrap gap-2 px-1">
                    {part.optional && (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={!chosen}
                        onClick={() => choose(part.key, undefined)}
                        className={cn(
                          "flex size-14 items-center justify-center rounded-xl border text-xs font-semibold",
                          !chosen ? "border-primary ring-2 ring-primary" : "border-border bg-card hover:bg-secondary",
                        )}
                      >
                        None
                      </button>
                    )}
                    {options.map((sample) => {
                      const active = chosen?.id === sample.id;
                      return (
                        <button
                          key={sample.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          aria-label={`${sample.name}${sample.code ? `, ${sample.code}` : ""}`}
                          title={sample.name}
                          onClick={() => choose(part.key, sample.id)}
                          className={cn(
                            "relative size-14 overflow-hidden rounded-xl border",
                            active ? "border-primary ring-2 ring-primary" : "border-border hover:border-foreground/40",
                          )}
                        >
                          <SampleSwatch sample={sample} className="size-full" />
                          {active && (
                            <span className="absolute bottom-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3" strokeWidth={3} aria-hidden />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {chosen ? `${chosen.name}${chosen.code ? ` · ${chosen.code}` : ""}` : "Not included"}
                  </p>
                </>
              )}
            </fieldset>
          );
        })}
      </div>

      <div id="quote" className="scroll-mt-28 lg:col-span-2">
        <QuoteForm selection={selection} />
      </div>
    </div>
  );
}

function QuoteForm({ selection }: { selection: DesignSelection }) {
  const ids = { school: useId(), name: useId(), role: useId(), phone: useId(), city: useId(), count: useId(), classes: useId(), when: useId(), message: useId() };
  const [values, setValues] = useState({
    schoolName: "",
    contactName: "",
    role: "",
    phone: "",
    city: "",
    studentCount: "",
    classes: "",
    neededBy: "",
    message: "",
    website: "",
  });
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const set = (key: keyof typeof values, value: string) => setValues((v) => ({ ...v, [key]: value }));

  if (done) {
    return (
      <div role="status" className="rounded-2xl border border-border bg-card p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-deal" aria-hidden />
        <h2 className="mt-3 text-xl font-bold">Request sent. Dhanyavaad!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your request number is <span className="font-semibold text-foreground">{done}</span>. We&apos;ll call you on{" "}
          {values.phone} soon with a quote.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <a href={STORE_CONTACT.phoneHref} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold">
            <Phone className="size-4" aria-hidden />
            Call us now
          </a>
          <Link href="/for-schools" className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold">
            Back to the sample book
          </Link>
        </div>
      </div>
    );
  }

  const field =
    "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring";
  const invalid = (name: string) => error?.field === name;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (isPending) return;
        setError(null);
        startTransition(async () => {
          const result = await submitSchoolEnquiryAction({ ...values, design: selection });
          if (result.success) setDone(result.enquiryNumber);
          else setError(result.error);
        });
      }}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <h2 className="text-xl font-bold">Get a quote for your school</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Send this design with a few details. We&apos;ll call you with the price for your school, no obligation.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field id={ids.school} label="School name" required>
          <input id={ids.school} value={values.schoolName} onChange={(e) => set("schoolName", e.target.value)} aria-invalid={invalid("schoolName")} className={field} />
        </Field>
        <Field id={ids.name} label="Your name" required>
          <input id={ids.name} value={values.contactName} onChange={(e) => set("contactName", e.target.value)} aria-invalid={invalid("contactName")} className={field} autoComplete="name" />
        </Field>
        <Field id={ids.role} label="You are the">
          <select id={ids.role} value={values.role} onChange={(e) => set("role", e.target.value)} className={field}>
            <option value="">Choose…</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </Field>
        <Field id={ids.phone} label="Mobile number" required>
          <input
            id={ids.phone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-invalid={invalid("phone")}
            className={field}
          />
        </Field>
        <Field id={ids.city} label="City / town">
          <input id={ids.city} value={values.city} onChange={(e) => set("city", e.target.value)} className={field} />
        </Field>
        <Field id={ids.count} label="About how many students?">
          <input id={ids.count} type="number" inputMode="numeric" min={1} value={values.studentCount} onChange={(e) => set("studentCount", e.target.value)} aria-invalid={invalid("studentCount")} className={field} />
        </Field>
        <Field id={ids.classes} label="Classes">
          <input id={ids.classes} placeholder="e.g. Nursery to Class 8" value={values.classes} onChange={(e) => set("classes", e.target.value)} className={field} />
        </Field>
        <Field id={ids.when} label="Needed by">
          <input id={ids.when} placeholder="e.g. before April" value={values.neededBy} onChange={(e) => set("neededBy", e.target.value)} className={field} />
        </Field>
        <div className="sm:col-span-2">
          <Field id={ids.message} label="Anything else? (sizes, logo, house T-shirts…)">
            <textarea
              id={ids.message}
              rows={3}
              value={values.message}
              onChange={(e) => set("message", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring"
            />
          </Field>
        </div>
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={values.website}
          onChange={(e) => set("website", e.target.value)}
          className="absolute -left-[9999px] size-px opacity-0"
          name="website"
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error.message}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground disabled:opacity-60"
        >
          {isPending ? "Sending…" : "Send request"}
        </button>
        <a
          href={`https://wa.me/${STORE_CONTACT.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="size-4" aria-hidden />
          Or chat on WhatsApp
        </a>
      </div>
    </form>
  );
}

function Field({ id, label, required = false, children }: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required && <span className="text-deal"> *</span>}
      </label>
      {children}
    </div>
  );
}
