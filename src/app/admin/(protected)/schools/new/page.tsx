import type { Metadata } from "next";
import { SchoolForm } from "@/components/admin/school-form";

export const metadata: Metadata = { title: "Add School" };

export default function NewSchoolPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Add School</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You can configure classes, uniform items and recommended sets after creating it.
        </p>
      </div>
      <div className="max-w-xl rounded-2xl border bg-card p-5">
        <SchoolForm />
      </div>
    </div>
  );
}
