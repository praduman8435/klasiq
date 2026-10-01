"use client";

import { useEffect, useId, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, MapPin, MessageCircle, Phone, Share2, Store } from "lucide-react";
import { SampleSwatch, UniformPreview, type ChosenParts, type PreviewView } from "@/components/schools/uniform-preview";
import { STORE_CONTACT } from "@/lib/constants";
import {
  DESIGN_PARTS,
  designSelectionToQuery,
  type DesignPartKey,
  type DesignSample,
  type DesignSelection,
} from "@/lib/uniform-design";
import { cn } from "@/lib/utils";
import { schoolDistanceAction, searchSchoolLocationAction, submitSchoolEnquiryAction } from "@/server/actions/school-enquiry";

const PART_LABEL: Record<DesignPartKey, string> = {
  shirt: "Shirt",
  pant: "Pant",
  skirt: "Skirt",
  tie: "Tie",
  belt: "Belt",
  sweater: "Sweater",
  blazer: "Blazer",
  socks: "Socks",
  shoes: "Shoes",
};

const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches;

/**
 * The uniform designer at /for-schools/design. Phone first: one child on
 * a big stage, one row of parts and one sideways row of fabrics, so the
 * whole design fits on one screen; a sticky bar leads to Review & quote.
 * On wider screens both children stand on the stage beside a calm
 * picker panel. The choice lives in the page link, so "Share" sends the
 * exact look to the school's owner or committee.
 */
export function UniformDesigner({ samples, initial }: { samples: DesignSample[]; initial: DesignSelection }) {
  const [selection, setSelection] = useState<DesignSelection>(initial);
  const [active, setActive] = useState<DesignPartKey>("shirt");
  /** "auto" = the boy on phones, both on wider screens. */
  const [view, setView] = useState<PreviewView | "auto">("auto");
  const [copied, setCopied] = useState(false);
  const [reviewInView, setReviewInView] = useState(false);
  const byId = new Map(samples.map((s) => [s.id, s]));
  const parts: ChosenParts = {};
  for (const part of DESIGN_PARTS) {
    const sample = selection[part.key] ? byId.get(selection[part.key]!) : undefined;
    if (sample) parts[part.key] = sample;
  }
  const activePart = DESIGN_PARTS.find((part) => part.key === active)!;
  const options = samples.filter((s) => s.kind === activePart.kind);
  const chosenCount = Object.keys(parts).length;

  // The phone's sticky "Review & quote" bar steps aside once the review
  // section is on screen, so it never covers the form.
  useEffect(() => {
    const review = document.getElementById("review");
    if (!review) return;
    const observer = new IntersectionObserver(([entry]) => setReviewInView(entry.isIntersecting), { rootMargin: "0px 0px -20% 0px" });
    observer.observe(review);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const query = designSelectionToQuery(selection);
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [selection]);

  function openPart(key: DesignPartKey) {
    setActive(key);
    // On a phone only one child shows: switch to the one who wears it.
    if (key === "skirt" && (view === "boy" || (view === "auto" && isPhone()))) setView("girl");
    if (key === "pant" && view === "girl") setView("boy");
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

  const viewPill = (value: PreviewView) => {
    const selected = view === value;
    const autoSelected =
      view === "auto" && (value === "boy" ? "bg-white text-black sm:bg-transparent sm:text-white/80" : value === "both" ? "sm:bg-white sm:text-black" : "");
    return cn(
      "h-7 rounded-full px-3 text-xs font-semibold transition-colors",
      selected ? "bg-white text-black" : "text-white/75 hover:text-white",
      autoSelected,
    );
  };

  return (
    <>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8">
        {/* Stage */}
        <div className="-mx-4 sm:mx-0 lg:sticky lg:top-24 lg:self-start">
          <div className="relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_28%,oklch(0.34_0.02_260),oklch(0.18_0.02_260)_58%,oklch(0.12_0.02_260))] sm:rounded-3xl sm:border sm:border-border">
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute left-3 top-3 z-10 flex rounded-full bg-black/45 p-1 backdrop-blur" role="radiogroup" aria-label="Show">
              {(["boy", "girl", "both"] as PreviewView[]).map((value) => (
                <button key={value} type="button" role="radio" aria-checked={view === value} onClick={() => setView(value)} className={viewPill(value)}>
                  {value === "both" ? "Both" : value === "boy" ? "Boy" : "Girl"}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={share}
              aria-label={copied ? "Link copied" : "Share this design"}
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center gap-1.5 rounded-full bg-black/45 text-xs font-semibold text-white backdrop-blur hover:bg-black/60 sm:w-auto sm:px-3"
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
            </button>
            <div className="relative h-[45vh] min-h-72 max-h-[30rem] px-2 pb-2 pt-14 sm:h-[36rem] sm:max-h-none lg:h-[40rem]">
              <UniformPreview
                parts={parts}
                idPrefix="designer"
                view={view === "auto" ? "both" : view}
                className={cn(view === "auto" && "[&>svg:nth-child(2)]:hidden sm:[&>svg:nth-child(2)]:block")}
              />
            </div>
          </div>
        </div>

        {/* Picker */}
        <div className="flex min-w-0 flex-col gap-3 sm:gap-5 lg:pt-1">
          <div role="tablist" aria-label="Uniform parts" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-1.5 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {DESIGN_PARTS.map((part) => {
              const chosen = parts[part.key];
              const isActive = part.key === active;
              return (
                <button
                  key={part.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="part-options"
                  onClick={() => openPart(part.key)}
                  className={cn(
                    "flex h-9 shrink-0 items-center gap-1.5 rounded-full border pl-1 pr-3 text-sm font-medium transition-colors",
                    isActive ? "border-white/80 bg-white/10 text-white" : "border-transparent text-foreground/65 hover:text-foreground",
                  )}
                >
                  <span className="size-6 shrink-0 overflow-hidden rounded-full border border-border">
                    {chosen ? <SampleSwatch sample={chosen} className="size-full" /> : <span className="block size-full bg-muted" />}
                  </span>
                  {PART_LABEL[part.key]}
                </button>
              );
            })}
          </div>

          <div id="part-options" role="tabpanel" aria-label={PART_LABEL[active]}>
            <p className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-bold">{PART_LABEL[active]}</span>
              <span className="truncate text-muted-foreground">
                {parts[active] ? `${parts[active]!.name}${parts[active]!.code ? ` · ${parts[active]!.code}` : ""}` : "None · not part of the uniform"}
              </span>
            </p>
            {options.length === 0 ? (
              <p className="mt-2 rounded-2xl bg-muted px-4 py-4 text-sm text-muted-foreground">No samples for this yet. Ask us when we call.</p>
            ) : (
              <div
                role="radiogroup"
                aria-label={PART_LABEL[active]}
                className="-mx-4 mt-2 flex snap-x gap-3 overflow-x-auto px-4 pb-1 pt-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
              >
                <Swatch selected={!parts[active]} onClick={() => choose(undefined)} label="None">
                  <span className="flex size-full items-center justify-center bg-muted text-xs font-bold text-muted-foreground">None</span>
                </Swatch>
                {options.map((sample) => (
                  <Swatch key={sample.id} selected={parts[active]?.id === sample.id} onClick={() => choose(sample.id)} label={sample.name}>
                    <SampleSwatch sample={sample} className="size-full" />
                  </Swatch>
                ))}
              </div>
            )}
          </div>

          <a
            href="#review"
            className="hidden h-10 w-fit items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground sm:inline-flex"
          >
            Review &amp; get a quote
            <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
      </div>

      {/* Review & quote */}
      <section id="review" aria-labelledby="review-heading" className="mt-8 scroll-mt-28 sm:mt-12">
        <h2 id="review-heading" className="text-lg font-bold tracking-tight">
          Your uniform
        </h2>
        <ul className="mt-2 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
          {DESIGN_PARTS.map((part) => {
            const chosen = parts[part.key];
            return (
              <li key={part.key}>
                <button
                  type="button"
                  onClick={() => {
                    openPart(part.key);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex min-h-11 w-full items-center gap-3 border-b border-border text-left text-sm"
                >
                  <span className="size-6 shrink-0 overflow-hidden rounded-md border border-border">
                    {chosen ? <SampleSwatch sample={chosen} className="size-full" /> : <span className="block size-full bg-muted" />}
                  </span>
                  <span className="w-16 shrink-0 text-muted-foreground">{PART_LABEL[part.key]}</span>
                  <span className={cn("min-w-0 truncate", chosen ? "font-medium" : "text-muted-foreground")}>{chosen ? chosen.name : "None"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-5">
          <QuoteForm selection={selection} />
        </div>
      </section>

      {/* Phone: sticky way to review */}
      <div
        data-sticky-bar
        aria-hidden={reviewInView}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-[opacity,transform] duration-300 sm:hidden",
          reviewInView && "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        <a
          href="#review"
          tabIndex={reviewInView ? -1 : undefined}
          className="flex h-12 items-center gap-3 rounded-2xl bg-primary px-4 text-primary-foreground shadow-[0_8px_24px_-8px_oklch(0_0_0/70%)]"
        >
          <span className="flex -space-x-2">
            {DESIGN_PARTS.filter((part) => parts[part.key])
              .slice(0, 4)
              .map((part) => (
                <span key={part.key} className="size-6 overflow-hidden rounded-full border-2 border-primary">
                  <SampleSwatch sample={parts[part.key]!} className="size-full" />
                </span>
              ))}
          </span>
          <span className="min-w-0 flex-1 text-xs font-semibold text-primary-foreground/85">{chosenCount} parts chosen</span>
          <span className="flex items-center gap-1 text-sm font-bold">
            Review &amp; quote
            <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
          </span>
        </a>
      </div>
    </>
  );
}

function Swatch({ selected, onClick, label, children }: { selected: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onClick}
      className="group w-16 shrink-0 snap-start text-left sm:w-auto"
    >
      <span
        className={cn(
          "relative block aspect-square overflow-hidden rounded-xl border transition-[border-color,box-shadow]",
          selected ? "border-white ring-2 ring-white ring-offset-2 ring-offset-background" : "border-border group-hover:border-foreground/40",
        )}
      >
        {children}
        {selected && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-white text-black">
            <Check className="size-3" strokeWidth={3} aria-hidden />
          </span>
        )}
      </span>
      <span className="mt-1 block truncate text-xs font-medium text-foreground/80">{label}</span>
    </button>
  );
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toLocaleString("en-IN", { maximumFractionDigits: 1 })} km`;
}

type Place = { label: string; latitude: number; longitude: number };

/** "School kahan hai?" — suggestions appear as you type (Geoapify, via the
 * server), and once a place is picked its road distance from the shop
 * shows underneath. Typing without picking still works. */
function LocationInput({
  id,
  value,
  onChange,
  onPick,
}: {
  id: string;
  value: string;
  onChange: (text: string) => void;
  onPick: (place: Place | null) => void;
}) {
  const [suggestions, setSuggestions] = useState<{ id: string; formattedAddress: string; lat: number; lon: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [distance, setDistance] = useState<number | null | "loading">(null);
  const listId = useId();
  const query = value.trim();

  useEffect(() => {
    if (!open || query.length < 3) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const result = await searchSchoolLocationAction({ query });
      if (!cancelled) setSuggestions(result.success ? result.suggestions : []);
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  async function pick(suggestion: { formattedAddress: string; lat: number; lon: number }) {
    onChange(suggestion.formattedAddress);
    onPick({ label: suggestion.formattedAddress, latitude: suggestion.lat, longitude: suggestion.lon });
    setOpen(false);
    setSuggestions([]);
    setDistance("loading");
    const result = await schoolDistanceAction({ latitude: suggestion.lat, longitude: suggestion.lon });
    setDistance(result.success ? result.distanceMeters : null);
  }

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3.5 top-3 size-5 text-muted-foreground" aria-hidden />
      <input
        id={id}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Mohalla, town ya village"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onPick(null);
          setDistance(null);
          setOpen(true);
          if (e.target.value.trim().length < 3) setSuggestions([]);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        className="h-11 w-full rounded-xl border border-transparent bg-muted pl-11 pr-3.5 text-base outline-none placeholder:text-muted-foreground/70 focus-visible:border-white/30 focus-visible:bg-background"
      />
      {open && suggestions.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-12 z-20 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-[0_12px_32px_-12px_oklch(0_0_0/0.7)]">
          {suggestions.map((s) => (
            <li key={s.id} role="option" aria-selected={false}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
                className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-muted"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="line-clamp-2">{s.formattedAddress}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {distance !== null && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
          <Store className="size-3.5" aria-hidden />
          {distance === "loading" ? "Distance dekh rahe hain…" : `Humari dukaan se ${formatDistance(distance)}`}
        </p>
      )}
    </div>
  );
}

/**
 * "Apna design humein bhejiye" — the school sends the uniform it designed.
 * Asked as a few short questions rather than a form: school name, new or
 * running school, where it is, who to call. A note is optional.
 */
function QuoteForm({ selection }: { selection: DesignSelection }) {
  const ids = { school: useId(), place: useId(), name: useId(), phone: useId(), message: useId() };
  const [values, setValues] = useState({ schoolName: "", city: "", contactName: "", phone: "", message: "", website: "" });
  const [schoolType, setSchoolType] = useState<"NEW" | "EXISTING" | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const set = (key: keyof typeof values, value: string) => setValues((v) => ({ ...v, [key]: value }));

  if (done) {
    return (
      <div role="status" className="rounded-3xl border border-border bg-card px-5 py-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
          <CheckCircle2 className="size-6 text-deal" aria-hidden />
        </span>
        <h2 className="mt-3 text-lg font-bold">Design mil gaya. Dhanyavaad!</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Request <span className="font-semibold text-foreground">{done}</span>. Hum {values.phone} par call karke daam aur samay batayenge.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <a href={STORE_CONTACT.phoneHref} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            <Phone className="size-4" aria-hidden />
            Abhi call kijiye
          </a>
          <Link href="/for-schools" className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-muted-foreground hover:text-foreground">
            Sample book par wapas
          </Link>
        </div>
      </div>
    );
  }

  const field =
    "h-11 w-full rounded-xl border border-transparent bg-muted px-3.5 text-base outline-none placeholder:text-muted-foreground/70 focus-visible:border-white/30 focus-visible:bg-background aria-invalid:border-destructive";
  const invalid = (name: string) => error?.field === name;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (isPending) return;
        setError(null);
        startTransition(async () => {
          const result = await submitSchoolEnquiryAction({
            ...values,
            schoolType: schoolType ?? undefined,
            latitude: place?.latitude,
            longitude: place?.longitude,
            design: selection,
          });
          if (result.success) setDone(result.enquiryNumber);
          else setError(result.error);
        });
      }}
      className="rounded-3xl border border-border bg-card p-4 sm:p-6"
    >
      <h2 className="text-lg font-bold">Apna design humein bhejiye</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Aapki banayi uniform hum tak pahunch jaayegi. Hum call karke daam aur samay batayenge. Abhi koi payment nahi.
      </p>

      <ol className="mt-5 flex flex-col gap-5">
        <Question n={1} label="School ka naam" htmlFor={ids.school}>
          <input id={ids.school} placeholder="Jaise: Sunrise Public School" value={values.schoolName} onChange={(e) => set("schoolName", e.target.value)} aria-invalid={invalid("schoolName")} className={field} />
        </Question>

        <Question n={2} label="School naya hai ya pehle se chal raha hai?">
          <div role="radiogroup" aria-label="School type" className="grid grid-cols-2 gap-2">
            {(
              [
                { value: "NEW", title: "Naya school", hint: "Abhi khul raha hai" },
                { value: "EXISTING", title: "Chal raha school", hint: "Uniform badalni hai" },
              ] as const
            ).map((option) => {
              const active = schoolType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSchoolType(active ? null : option.value)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active ? "border-white/80 bg-white/10" : "border-border hover:bg-muted",
                  )}
                >
                  <span className="flex items-center justify-between text-sm font-semibold">
                    {option.title}
                    {active && <Check className="size-4" aria-hidden />}
                  </span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </Question>

        <Question n={3} label="School kahan hai?" htmlFor={ids.place}>
          <LocationInput id={ids.place} value={values.city} onChange={(text) => set("city", text)} onPick={setPlace} />
        </Question>

        <Question n={4} label="Kisse baat karein?">
          <div className="grid gap-2 sm:grid-cols-2">
            <input id={ids.name} aria-label="Your name" placeholder="Aapka naam" value={values.contactName} onChange={(e) => set("contactName", e.target.value)} aria-invalid={invalid("contactName")} className={field} autoComplete="name" />
            <input
              id={ids.phone}
              aria-label="Mobile number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Mobile number"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              aria-invalid={invalid("phone")}
              className={field}
            />
          </div>
        </Question>
      </ol>

      {showNote ? (
        <div className="mt-5">
          <label htmlFor={ids.message} className="text-sm font-medium">
            Note
          </label>
          <textarea
            id={ids.message}
            rows={3}
            autoFocus
            placeholder="Students ki ginti, logo, house T-shirts, kab tak chahiye…"
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-transparent bg-muted px-3.5 py-2.5 text-base outline-none placeholder:text-muted-foreground/70 focus-visible:border-white/30 focus-visible:bg-background"
          />
        </div>
      ) : (
        <button type="button" onClick={() => setShowNote(true)} className="mt-5 text-sm font-medium text-deal hover:underline">
          + Note joden (students, logo, kab tak chahiye)
        </button>
      )}

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

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error.message}
        </p>
      )}

      <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {isPending ? "Bhej rahe hain…" : "Design bhejiye"}
          {!isPending && <ArrowRight className="size-4" aria-hidden />}
        </button>
        <a
          href={`https://wa.me/${STORE_CONTACT.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <MessageCircle className="size-4" aria-hidden />
          Ya WhatsApp par baat kijiye
        </a>
      </div>
    </form>
  );
}

function Question({ n, label, htmlFor, children }: { n: number; label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold">
            {label}
          </label>
        ) : (
          <p className="mb-2 text-sm font-semibold">{label}</p>
        )}
        {children}
      </div>
    </li>
  );
}
