"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SampleSwatch } from "@/components/schools/uniform-preview";
import { SAMPLE_KINDS, SAMPLE_KIND_LABEL, type DesignSample } from "@/lib/uniform-design";
import { deleteUniformSampleAction } from "@/server/actions/admin/uniform-samples";

export type AdminSample = DesignSample & { isActive: boolean; supplierName: string | null };

/** Admin → Sample book, grouped by what each sample is. */
export function UniformSampleList({ samples }: { samples: AdminSample[] }) {
  if (samples.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <p className="text-sm font-medium">No samples yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the swatches from your supplier&apos;s sample book. Schools see them at /for-schools.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      {SAMPLE_KINDS.filter((kind) => samples.some((s) => s.kind === kind)).map((kind) => (
        <section key={kind}>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{SAMPLE_KIND_LABEL[kind]}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {samples
              .filter((s) => s.kind === kind)
              .map((sample) => (
                <SampleRow key={sample.id} sample={sample} />
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SampleRow({ sample }: { sample: AdminSample }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <span className="size-14 shrink-0 overflow-hidden rounded-md border border-border">
        <SampleSwatch sample={sample} className="size-full" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{sample.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {[sample.code, sample.supplierName].filter(Boolean).join(" · ") || "—"}
        </span>
        {!sample.isActive && (
          <Badge variant="outline" className="mt-1">
            Hidden
          </Badge>
        )}
      </span>
      <Link
        href={`/admin/samples/${sample.id}`}
        aria-label={`Edit ${sample.name}`}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
      >
        <Pencil className="size-4" aria-hidden />
      </Link>
      <button
        type="button"
        aria-label={`Delete ${sample.name}`}
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`Delete the sample "${sample.name}"?`)) return;
          startTransition(async () => {
            const result = await deleteUniformSampleAction({ id: sample.id });
            if (result.success) {
              toast.success("Sample deleted.");
              router.refresh();
            } else toast.error(result.error.message);
          });
        }}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  );
}
