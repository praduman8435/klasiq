"use client";

import { useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Copy, MessageCircle, Phone, Share2 } from "lucide-react";
import { SampleSwatch, UniformPreview, type ChosenParts, type PreviewView } from "@/components/schools/uniform-preview";
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

const VIEWS: { value: PreviewView; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
];

/** Parts that only one figure wears: choosing them shows that figure. */
const PART_VIEW: Partial<Record<DesignPartKey, PreviewView>> = { pant: "boy", skirt: "girl" };

/**
 * The uniform designer at /for-schools/design, built like a product
 * configurator: a lit stage with the boy and girl, part tabs that show
 * the current pick, fabric swatch cards, and a "Your uniform" summary.
 * The choice lives in the page link, so "Share design" sends the exact
 * look to the school's owner or committee; the quote form below sends it
 * to the shop.
 */
export function UniformDesigner({ samples, initial }: { samples: DesignSample[]; initial: DesignSelection }) {
  const [selection, setSelection] = useState<DesignSelection>(initial);
  const [active, setActive] = useState<DesignPartKey>("shirt");
  const [view, setView] = useState<PreviewView>("both");
  const [copied, setCopied] = useState(false);
  const byId = new Map(samples.map((s) => [s.id, s]));
  const parts: ChosenParts = {};
  for (const part of DESIGN_PARTS) {
    const sample = selection[part.key] ? byId.get(selection[part.key]!) : undefined;
    if (sample) parts[part.key] = sample;
  }
  const activeIndex = DESIGN_PARTS.findIndex((part) => part.key === active);
  const activePart = DESIGN_PARTS[activeIndex];
  const options = samples.filter((s) => s.kind === activePart.kind);
  const nextPart = DESIGN_PARTS[activeIndex + 1];

  useEffect(() => {
    const query = designSelectionToQuery(selection);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [selection]);

  function openPart(key: DesignPartKey) {
    setActive(key);
    const only = PART_VIEW[key];
    if (only && view !== "both") setView(only);
  }

  function choose(id: string | undefined) {
    setSelection((current) => ({ ...current, [active]: id }));
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Our school uniform design", url });
        return;
      } catch {
        // cancelled: fall back to copying
      }
    }
    await navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-8">
      {/* Stage */}
      <div className="sticky top-[6.75rem] z-10 -mx-4 sm:mx-0 md:top-20 lg:top-24 lg:self-start">
        <div className="relative overflow-hidden border-y border-border bg-[radial-gradient(ellipse_at_50%_30%,oklch(0.32_0.02_260),oklch(0.17_0.02_260)_62%,oklch(0.13_0.02_260))] sm:rounded-3xl sm:border">
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-black/35 to-transparent" />
          <div className="absolute left-3 top-3 z-10 flex rounded-full bg-black/40 p-1 backdrop-blur" role="radiogroup" aria-label="Show">
            {VIEWS.map((v) => (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={view === v.value}
                onClick={() => setView(v.value)}
                className={cn(
                  "h-8 rounded-full px-3.5 text-xs font-bold transition-colors",
                  view === v.value ? "bg-white text-black" : "text-white/80 hover:text-white",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={share}
            aria-label={copied ? "Link copied" : "Share design"}
            className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/55"
          >
            {copied ? <Check className="size-4.5" aria-hidden /> : <Share2 className="size-4.5" aria-hidden />}
          </button>
          <div className="relative h-[42vh] min-h-64 max-h-[30rem] px-4 pb-3 pt-14 sm:h-[34rem] sm:max-h-none lg:h-[38rem]">
            <UniformPreview parts={parts} idPrefix="designer" view={view} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex min-w-0 flex-col gap-5">
        <div role="tablist" aria-label="Uniform parts" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
          {DESIGN_PARTS.map((part) => {
            const chosen = parts[part.key];
            const isActive = part.key === active;
            return (
              <button
                key={part.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="part-panel"
                onClick={() => openPart(part.key)}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-sm font-semibold transition-colors",
                  isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary",
                )}
              >
                <span className={cn("size-8 overflow-hidden rounded-full border", isActive ? "border-white/40" : "border-border")}>
                  {chosen ? (
                    <SampleSwatch sample={chosen} className="size-full" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs opacity-60">—</span>
                  )}
                </span>
                {SAMPLE_KIND_LABEL[part.kind].replace(" / frock", "")}
              </button>
            );
          })}
        </div>

        <section id="part-panel" role="tabpanel" aria-label={SAMPLE_KIND_LABEL[activePart.kind]} className="rounded-3xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold">
              Choose the {SAMPLE_KIND_LABEL[activePart.kind].toLowerCase()}
              {activePart.optional && <span className="ml-1.5 text-sm font-medium text-muted-foreground">(optional)</span>}
            </h2>
            <span className="text-xs text-muted-foreground">
              {activeIndex + 1} of {DESIGN_PARTS.length}
            </span>
          </div>

          {options.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-muted px-4 py-5 text-sm text-muted-foreground">
              No {SAMPLE_KIND_LABEL[activePart.kind].toLowerCase()} samples yet. Ask us when we call.
            </p>
          ) : (
            <div role="radiogroup" aria-label={SAMPLE_KIND_LABEL[activePart.kind]} className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {activePart.optional && (
                <OptionCard selected={!parts[activePart.key]} onClick={() => choose(undefined)} label="None" detail="Not part of the uniform">
                  <span className="flex size-full items-center justify-center bg-muted text-sm font-semibold text-muted-foreground">None</span>
                </OptionCard>
              )}
              {options.map((sample) => (
                <OptionCard
                  key={sample.id}
                  selected={parts[activePart.key]?.id === sample.id}
                  onClick={() => choose(sample.id)}
                  label={sample.name}
                  detail={sample.code}
                >
                  <SampleSwatch sample={sample} className="size-full" />
                </OptionCard>
              ))}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            {nextPart ? (
              <button
                type="button"
                onClick={() => openPart(nextPart.key)}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-secondary"
              >
                Next: {SAMPLE_KIND_LABEL[nextPart.kind].replace(" / frock", "")}
                <ArrowRight className="size-4" aria-hidden />
              </button>
            ) : (
              <a href="#quote" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
                Done, get a quote
                <ArrowRight className="size-4" aria-hidden />
              </a>
            )}
          </div>
        </section>

        <section aria-labelledby="your-uniform" className="rounded-3xl border border-border bg-card p-4 sm:p-5">
          <h2 id="your-uniform" className="text-lg font-bold">
            Your uniform
          </h2>
          <ul className="mt-2 divide-y divide-border">
            {DESIGN_PARTS.map((part) => {
              const chosen = parts[part.key];
              return (
                <li key={part.key}>
                  <button type="button" onClick={() => openPart(part.key)} className="flex min-h-12 w-full items-center gap-3 py-2 text-left">
                    <span className="size-9 shrink-0 overflow-hidden rounded-lg border border-border">
                      {chosen ? <SampleSwatch sample={chosen} className="size-full" /> : <span className="block size-full bg-muted" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-muted-foreground">{SAMPLE_KIND_LABEL[part.kind]}</span>
                      <span className="block truncate text-sm font-semibold">
                        {chosen ? `${chosen.name}${chosen.code ? ` · ${chosen.code}` : ""}` : "Not included"}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-deal">Change</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={share}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary"
            >
              {copied ? <Check className="size-4 text-deal" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Link copied" : "Share design"}
            </button>
            <a href="#quote" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              Get a quote
            </a>
          </div>
        </section>
      </div>

      <div id="quote" className="scroll-mt-28 lg:col-span-2">
        <QuoteForm selection={selection} />
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  label,
  detail,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  detail: string | null;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border text-left transition-[border-color,box-shadow]",
        selected ? "border-primary ring-2 ring-primary" : "border-border hover:border-foreground/30",
      )}
    >
      <span className="relative block aspect-square overflow-hidden">
        {children}
        {selected && (
          <span className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
          </span>
        )}
      </span>
      <span className="block px-2 py-1.5">
        <span className="line-clamp-1 text-xs font-semibold">{label}</span>
        {detail && <span className="block truncate text-xs text-muted-foreground">{detail}</span>}
      </span>
    </button>
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
