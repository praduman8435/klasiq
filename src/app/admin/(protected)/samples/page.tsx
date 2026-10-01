import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniformSampleList } from "@/components/admin/uniform-sample-list";
import { getAllSamplesForAdmin } from "@/server/queries/uniform-samples";

export const metadata: Metadata = { title: "Sample book" };

export default async function AdminSamplesPage() {
  const samples = (await getAllSamplesForAdmin()).map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    kind: s.kind,
    pattern: s.pattern,
    colourHex: s.colourHex,
    accentHex: s.accentHex,
    photoUrl: s.photoUrl,
    isActive: s.isActive,
    supplierName: s.supplier ? (s.supplier.businessName ?? s.supplier.name) : null,
  }));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight">Sample book</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Supplier swatches that schools browse and design with ·{" "}
            <a href="/for-schools" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
              open what schools see
              <ExternalLink className="size-3" aria-hidden />
            </a>
          </p>
        </div>
        <Button render={<Link href="/admin/samples/new" />} nativeButton={false} className="h-9">
          <Plus className="size-4" aria-hidden />
          Add sample
        </Button>
      </div>
      <UniformSampleList samples={samples} />
    </div>
  );
}
