import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UniformSampleForm } from "@/components/admin/uniform-sample-form";
import { getSampleById, getSuppliersForSamplePicker } from "@/server/queries/uniform-samples";

export const metadata: Metadata = { title: "Edit sample" };

export default async function EditSamplePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sample, suppliers] = await Promise.all([getSampleById(id), getSuppliersForSamplePicker()]);
  if (!sample) notFound();
  return (
    <div>
      <h1 className="mb-5 font-heading text-xl font-semibold tracking-tight">Edit sample</h1>
      <UniformSampleForm
        suppliers={suppliers}
        initial={{
          id: sample.id,
          name: sample.name,
          code: sample.code ?? "",
          kind: sample.kind,
          pattern: sample.pattern,
          colourHex: sample.colourHex,
          accentHex: sample.accentHex ?? "",
          description: sample.description ?? "",
          photoUrl: sample.photoUrl ?? "",
          supplierId: sample.supplierId ?? "",
          isActive: sample.isActive,
          sortOrder: sample.sortOrder,
        }}
      />
    </div>
  );
}
