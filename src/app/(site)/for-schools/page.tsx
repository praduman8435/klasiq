import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { SampleSwatch } from "@/components/schools/uniform-preview";
import { STORE_CONTACT } from "@/lib/constants";
import { DESIGN_PARTS, SAMPLE_KINDS, SAMPLE_KIND_LABEL, type SampleKind } from "@/lib/uniform-design";
import { cn } from "@/lib/utils";
import { getActiveSamples } from "@/server/queries/uniform-samples";

export const metadata: Metadata = {
  title: "For schools: uniform sample book and bulk orders",
  description:
    "For principals, managers and school owners: browse our uniform sample book, design your school's uniform and get a bulk quote.",
  alternates: { canonical: "/for-schools" },
};

type PageProps = { searchParams: Promise<{ kind?: string }> };

const STEPS = [
  { title: "Sample book dekhiye", text: "Shirting, pant and skirt fabrics, ties, belts, blazers and more." },
  { title: "Uniform design kijiye", text: "Pick each part and see the full uniform on a boy and a girl." },
  { title: "Quote paaiye", text: "Send the design with your student count. We call you with the price." },
];

/**
 * /for-schools — for principals, managers and owners of a new school, or
 * a school changing its uniform. Not in the menus: linked from the
 * footer and shared by the shop. No prices: schools ask for a quote.
 */
export default async function ForSchoolsPage({ searchParams }: PageProps) {
  const { kind } = await searchParams;
  const samples = await getActiveSamples();
  const kindsWithSamples = SAMPLE_KINDS.filter((k) => samples.some((s) => s.kind === k));
  const selectedKind = kindsWithSamples.includes(kind as SampleKind) ? (kind as SampleKind) : null;
  const shown = selectedKind ? samples.filter((s) => s.kind === selectedKind) : samples;
  const designKey = (k: SampleKind) => DESIGN_PARTS.find((part) => part.kind === k)?.key;

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground/85 hover:bg-secondary",
    );

  return (
    <div className="flex flex-col divide-y divide-border">
      <section className="bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <h1 className="max-w-2xl text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Apne school ki uniform, apne hisaab se
          </h1>
          <p className="mt-3 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Starting a new school, or changing your uniform? See our supplier sample book here, design the full uniform,
            and get a bulk quote for your students.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/for-schools/design"
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground sm:text-base"
            >
              Design your uniform
              <ArrowRight className="size-4" strokeWidth={2.5} aria-hidden />
            </Link>
            <a
              href={STORE_CONTACT.phoneHref}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold sm:text-base"
            >
              <Phone className="size-4" aria-hidden />
              Call {STORE_CONTACT.phone}
            </a>
          </div>

          <ol className="mt-8 grid gap-3 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3 rounded-2xl border border-border bg-background/40 p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <span>
                  <span className="block font-bold">{step.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="sample-book" className="bg-card">
        <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="sample-book" className="text-xl font-bold tracking-tight sm:text-2xl">
                Sample book
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Price on request. Ask us for real swatches at the shop.</p>
            </div>
          </div>

          {samples.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-muted px-4 py-8 text-center">
              <p className="font-semibold">The sample book is being added.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Call or WhatsApp us and we&apos;ll show you the samples at the shop or at your school.
              </p>
              <a
                href={`https://wa.me/${STORE_CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-semibold"
              >
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp us
              </a>
            </div>
          ) : (
            <>
              <nav aria-label="Filter samples" className="-mx-4 mt-4 sm:mx-0">
                <ul className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
                  <li>
                    <Link href="/for-schools#sample-book" aria-current={!selectedKind ? "page" : undefined} className={chip(!selectedKind)}>
                      All
                    </Link>
                  </li>
                  {kindsWithSamples.map((k) => (
                    <li key={k}>
                      <Link
                        href={`/for-schools?kind=${k}#sample-book`}
                        aria-current={selectedKind === k ? "page" : undefined}
                        className={chip(selectedKind === k)}
                      >
                        {SAMPLE_KIND_LABEL[k]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {shown.map((sample) => {
                  const key = designKey(sample.kind);
                  return (
                    <li key={sample.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background/40">
                      <SampleSwatch sample={sample} className="aspect-square w-full" />
                      <div className="flex flex-1 flex-col p-3">
                        <p className="line-clamp-2 text-sm font-semibold leading-5">{sample.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {SAMPLE_KIND_LABEL[sample.kind]}
                          {sample.code ? ` · ${sample.code}` : ""}
                        </p>
                        {sample.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{sample.description}</p>}
                        {key && (
                          <Link
                            href={`/for-schools/design?${key}=${sample.id}`}
                            className="mt-auto inline-flex min-h-9 items-center gap-1 pt-2 text-sm font-semibold text-deal"
                          >
                            Try in designer
                            <ArrowRight className="size-3.5" aria-hidden />
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
