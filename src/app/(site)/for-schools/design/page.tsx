import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UniformDesigner } from "@/components/schools/uniform-designer";
import { DESIGN_PARTS, cleanDesignSelection, parseDesignSelection } from "@/lib/uniform-design";
import { getActiveSamples } from "@/server/queries/uniform-samples";

export const metadata: Metadata = {
  title: "Design your school uniform",
  description: "Pick the shirt, pant, skirt, tie and more from our sample book and see the full uniform before you order.",
};

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** The uniform designer. A shared link opens with its design; otherwise
 * the shirt, pant and skirt start on the first sample of each, so the
 * preview is never empty. */
export default async function UniformDesignPage({ searchParams }: PageProps) {
  const samples = await getActiveSamples();
  const selection = cleanDesignSelection(parseDesignSelection(await searchParams), samples);
  for (const part of DESIGN_PARTS) {
    if (!part.optional && !selection[part.key]) {
      const first = samples.find((s) => s.kind === part.kind);
      if (first) selection[part.key] = first.id;
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-6 pt-3 sm:px-6 sm:py-8">
      <div className="flex items-center gap-2 sm:block">
        <Link
          href="/for-schools"
          aria-label="Back to the sample book"
          className="-ml-2 flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground sm:ml-0 sm:size-auto sm:justify-start sm:gap-1.5 sm:text-sm"
        >
          <ArrowLeft className="size-5 sm:size-4" aria-hidden />
          <span className="hidden sm:inline">Sample book</span>
        </Link>
        <h1 className="text-xl font-bold tracking-tight sm:mt-3 sm:text-3xl">Design your school uniform</h1>
      </div>
      <p className="mt-1 hidden max-w-2xl text-base text-muted-foreground sm:block">
        Choose each part from our sample book. Dekhiye poori uniform kaisi lagegi, phir link share kijiye ya quote maangiye.
      </p>
      <div className="mt-3 sm:mt-6">
        <UniformDesigner samples={samples} initial={selection} />
      </div>
    </div>
  );
}
