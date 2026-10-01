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
 * the shirt, pant and skirt start on the first sample of each. */
export default async function UniformDesignPage({ searchParams }: PageProps) {
  const samples = await getActiveSamples();
  const fromLink = parseDesignSelection(await searchParams);
  const selection = cleanDesignSelection(fromLink, samples);
  // A fresh visit starts the shirt, pant and skirt on a sample; a shared
  // link is shown exactly as sent (a part it leaves out stays None).
  if (Object.keys(fromLink).length === 0) {
    for (const part of DESIGN_PARTS) {
      if (!part.optional) {
        const first = samples.find((s) => s.kind === part.kind);
        if (first) selection[part.key] = first.id;
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-6 pt-3 sm:px-6 sm:py-8">
      <div className="flex items-center gap-1.5 text-sm">
        <Link
          href="/for-schools"
          aria-label="Back to the sample book"
          className="-ml-2 flex h-9 items-center gap-1 rounded-lg px-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          <span className="hidden sm:inline">Sample book</span>
        </Link>
        <span aria-hidden className="text-muted-foreground/50">/</span>
        <h1 className="font-semibold">Uniform designer</h1>
      </div>
      <div className="mt-2 sm:mt-3">
        <UniformDesigner samples={samples} initial={selection} />
      </div>
    </div>
  );
}
