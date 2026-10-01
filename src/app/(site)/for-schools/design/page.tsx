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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Link href="/for-schools" className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Sample book
      </Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Design your school uniform</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
        Choose each part from our sample book. Dekhiye poori uniform kaisi lagegi, phir link share kijiye ya quote maangiye.
      </p>
      <div className="mt-6">
        <UniformDesigner samples={samples} initial={selection} />
      </div>
    </div>
  );
}
