import type { Metadata } from "next";
import { UniformSampleForm } from "@/components/admin/uniform-sample-form";
import { getSuppliersForSamplePicker } from "@/server/queries/uniform-samples";

export const metadata: Metadata = { title: "Add sample" };

export default async function NewSamplePage() {
  const suppliers = await getSuppliersForSamplePicker();
  return (
    <div>
      <h1 className="mb-5 font-heading text-xl font-semibold tracking-tight">Add sample</h1>
      <UniformSampleForm
        suppliers={suppliers}
        initial={{
          name: "",
          code: "",
          kind: "SHIRT",
          pattern: "PLAIN",
          colourHex: "#dce6f5",
          accentHex: "",
          description: "",
          photoUrl: "",
          supplierId: "",
          isActive: true,
          sortOrder: 0,
        }}
      />
    </div>
  );
}
