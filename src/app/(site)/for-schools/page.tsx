import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import { SampleSwatch, UniformPreview, type ChosenParts } from "@/components/schools/uniform-preview";
import { BRAND, STORE_CONTACT } from "@/lib/constants";
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

/** The story a principal goes through, told in three short chapters. */
const CHAPTERS = [
  {
    title: "Sab kuch ek jagah dekhiye",
    text: "Shirting, pant aur skirt ke kapde, ties, belts, sweaters, blazers aur shoes. Supplier ki poori sample book yahin hai, bina dukaan aaye.",
  },
  {
    title: "Apni uniform khud banaiye",
    text: "Har cheez chuniye aur turant dekhiye ki ladke aur ladki par poori uniform kaisi lagegi. Pasand aaye to link committee ke saath share kijiye.",
  },
  {
    title: "Quote paaiye, baaki hum sambhaalenge",
    text: "Design ke saath students ki ginti bhejiye. Hum call karke aapke school ke liye daam batayenge, phir silai aur delivery tak saath rahenge.",
  },
];

/**
 * /for-schools — told as a story for principals, managers and owners of a
 * new school, or a school changing its uniform. Not in the menus: linked
 * from the footer and shared by the shop. No prices: schools ask for a quote.
 */
export default async function ForSchoolsPage({ searchParams }: PageProps) {
  const { kind } = await searchParams;
  const samples = await getActiveSamples();
  const kindsWithSamples = SAMPLE_KINDS.filter((k) => samples.some((s) => s.kind === k));
  const selectedKind = kindsWithSamples.includes(kind as SampleKind) ? (kind as SampleKind) : null;
  const shown = selectedKind ? samples.filter((s) => s.kind === selectedKind) : samples;
  const designKey = (k: SampleKind) => DESIGN_PARTS.find((part) => part.kind === k)?.key;

  // The hero shows a real uniform from the sample book: the first sample of
  // each main part, plus a tie when there is one.
  const heroParts: ChosenParts = {};
  for (const part of DESIGN_PARTS) {
    if (part.optional && part.key !== "tie") continue;
    const first = samples.find((s) => s.kind === part.kind);
    if (first) heroParts[part.key] = first;
  }
  const hasHeroUniform = Boolean(heroParts.shirt);

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-sm transition-colors",
      active ? "border-white/80 bg-white/10 font-semibold text-white" : "border-transparent text-foreground/65 hover:text-foreground",
    );

  return (
    <div className="flex flex-col">
      {/* Opening */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_35%,oklch(0.3_0.03_260),transparent_60%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pt-8 sm:px-6 md:grid-cols-[1.1fr_1fr] md:gap-10 md:py-14">
          <div>
            <h1 className="text-balance text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              Har school ki ek pehchaan hoti hai. Uski shuruaat uniform se hoti hai.
            </h1>
            <p className="mt-4 max-w-lg text-pretty text-base leading-7 text-muted-foreground">
              Naya school khul raha hai, ya purani uniform badalni hai? Pehle kai dukaanon ke chakkar, sample ke tukde aur
              andaaze lagte the. Ab aap yahin kapda chuniye, poori uniform dekhiye, aur ek call mein quote paaiye.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href="/for-schools/design"
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
              >
                Apni uniform design kijiye
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href={STORE_CONTACT.phoneHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Phone className="size-4" aria-hidden />
                Ya call kijiye {STORE_CONTACT.phone}
              </a>
            </div>
          </div>

          {hasHeroUniform && (
            <Link
              href="/for-schools/design"
              aria-label="Open the uniform designer"
              className="relative mx-auto block h-72 w-full max-w-sm sm:h-96 md:h-[28rem]"
            >
              <UniformPreview parts={heroParts} idPrefix="for-schools-hero" />
            </Link>
          )}
        </div>
      </section>

      {/* The story */}
      <section aria-labelledby="how-it-works" className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <h2 id="how-it-works" className="text-xl font-bold tracking-tight sm:text-2xl">
            Teen kadam mein aapki uniform taiyaar
          </h2>
          <ol className="mt-6">
            {CHAPTERS.map((chapter, index) => (
              <li key={chapter.title} className="relative flex gap-4 pb-8 last:pb-0">
                {index < CHAPTERS.length - 1 && (
                  <span aria-hidden className="absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-px bg-border" />
                )}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-sm font-semibold">
                  {index + 1}
                </span>
                <div className="pt-0.5">
                  <h3 className="font-semibold">{chapter.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{chapter.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <blockquote className="mt-10 border-l-2 border-primary pl-4 text-pretty text-base leading-7 text-foreground/85">
            {BRAND.heritageLine} Wahi bharosa ab aapke school ki uniform ke liye.
          </blockquote>
        </div>
      </section>

      {/* Sample book */}
      <section aria-labelledby="sample-book" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <h2 id="sample-book" className="text-xl font-bold tracking-tight sm:text-2xl">
            Sample book
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Koi bhi kapda chuniye aur designer mein aazmaaiye. Daam quote ke saath batayenge.
          </p>

          {samples.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-muted px-4 py-8 text-center">
              <p className="font-semibold">Sample book abhi tayyar ho rahi hai.</p>
              <p className="mt-1 text-sm text-muted-foreground">Call ya WhatsApp kijiye, hum samples dukaan par ya aapke school mein dikha denge.</p>
            </div>
          ) : (
            <>
              <nav aria-label="Filter samples" className="-mx-4 mt-5 sm:mx-0">
                <ul className="flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
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

              <ul className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
                {shown.map((sample) => {
                  const key = designKey(sample.kind);
                  const card = (
                    <>
                      <span className="block aspect-square overflow-hidden rounded-xl border border-border transition-colors group-hover:border-foreground/40">
                        <SampleSwatch sample={sample} className="size-full" />
                      </span>
                      <span className="mt-2 block truncate text-sm font-medium">{sample.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {SAMPLE_KIND_LABEL[sample.kind]}
                        {sample.code ? ` · ${sample.code}` : ""}
                      </span>
                    </>
                  );
                  return (
                    <li key={sample.id}>
                      {key ? (
                        <Link href={`/for-schools/design?${key}=${sample.id}`} className="group block" title="Try in the designer">
                          {card}
                        </Link>
                      ) : (
                        <div className="group">{card}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>

      {/* Closing */}
      <section className="mx-auto w-full max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
        <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">Aapke bachche, aapki uniform.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Design bana kar bhejiye, ya seedha baat kijiye. Hum aapke school ke hisaab se sab tay karenge.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3">
          <Link
            href="/for-schools/design"
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Design shuru kijiye
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <a
            href={`https://wa.me/${STORE_CONTACT.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp par baat kijiye
          </a>
        </div>
      </section>
    </div>
  );
}
