"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductPhotoPicker } from "@/components/admin/product-photo-picker";
import { SwitchRow } from "@/components/admin/switch-row";
import { SampleSwatch } from "@/components/schools/uniform-preview";
import {
  SAMPLE_KINDS,
  SAMPLE_KIND_LABEL,
  SAMPLE_PATTERNS,
  SAMPLE_PATTERN_LABEL,
  type SampleKind,
  type SamplePattern,
} from "@/lib/uniform-design";
import { cn } from "@/lib/utils";
import { createUniformSampleAction, updateUniformSampleAction } from "@/server/actions/admin/uniform-samples";

export type SampleFormValues = {
  id?: string;
  name: string;
  code: string;
  kind: SampleKind;
  pattern: SamplePattern;
  colourHex: string;
  accentHex: string;
  description: string;
  photoUrl: string;
  supplierId: string;
  isActive: boolean;
  sortOrder: number;
};

const selectClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Add or edit one swatch from a supplier's sample book. */
export function UniformSampleForm({
  initial,
  suppliers,
}: {
  initial: SampleFormValues;
  suppliers: { id: string; name: string; businessName: string | null }[];
}) {
  const router = useRouter();
  const ids = { name: useId(), code: useId(), kind: useId(), pattern: useId(), colour: useId(), accent: useId(), supplier: useId(), description: useId(), sort: useId() };
  const [values, setValues] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const set = <K extends keyof SampleFormValues>(key: K, value: SampleFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const isEditing = Boolean(initial.id);

  function save(event: React.FormEvent) {
    event.preventDefault();
    if (isPending || uploading) return;
    setError(null);
    startTransition(async () => {
      const payload = { ...values, accentHex: values.pattern === "PLAIN" ? "" : values.accentHex };
      const result = isEditing ? await updateUniformSampleAction(payload) : await createUniformSampleAction(payload);
      if (result.success) {
        toast.success(isEditing ? "Sample saved." : "Sample added.");
        router.push("/admin/samples");
        router.refresh();
      } else {
        setError(result.error.message);
      }
    });
  }

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="flex max-w-2xl flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.name}>Name</Label>
            <Input id={ids.name} value={values.name} placeholder="e.g. Sky blue oxford shirting" onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.code}>Supplier code (optional)</Label>
            <Input id={ids.code} value={values.code} placeholder="SH-204" onChange={(e) => set("code", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.kind}>It is a sample of</Label>
            <select id={ids.kind} value={values.kind} onChange={(e) => set("kind", e.target.value as SampleKind)} className={selectClass}>
              {SAMPLE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {SAMPLE_KIND_LABEL[kind]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.pattern}>Pattern</Label>
            <select id={ids.pattern} value={values.pattern} onChange={(e) => set("pattern", e.target.value as SamplePattern)} className={selectClass}>
              {SAMPLE_PATTERNS.map((pattern) => (
                <option key={pattern} value={pattern}>
                  {SAMPLE_PATTERN_LABEL[pattern]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ColourField id={ids.colour} label="Main colour" value={values.colourHex} onChange={(hex) => set("colourHex", hex)} />
          {values.pattern !== "PLAIN" && (
            <ColourField
              id={ids.accent}
              label={values.pattern === "CHECK" ? "Check line colour" : "Stripe colour"}
              value={values.accentHex || "#ffffff"}
              onChange={(hex) => set("accentHex", hex)}
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.supplier}>Supplier (optional)</Label>
          <select id={ids.supplier} value={values.supplierId} onChange={(e) => set("supplierId", e.target.value)} className={selectClass}>
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName ? `${s.businessName} (${s.name})` : s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.description}>Note for schools (optional)</Label>
          <textarea
            id={ids.description}
            rows={2}
            value={values.description}
            placeholder="e.g. Poly-cotton, wrinkle free, good for summer"
            onChange={(e) => set("description", e.target.value)}
            className="min-h-16 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium">Photo (optional)</p>
          <ProductPhotoPicker
            value={values.photoUrl}
            onChange={(url) => set("photoUrl", url)}
            productName={values.name || "Sample"}
            onUploadingChange={setUploading}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SwitchRow
            checked={values.isActive}
            onChange={(next) => set("isActive", next)}
            label="Show to schools"
            hint="Hidden samples stay here but aren't in the sample book."
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.sort}>Order in the book</Label>
            <Input
              id={ids.sort}
              type="number"
              min={0}
              value={values.sortOrder}
              onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
              className="w-24"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" className="h-9" disabled={isPending || uploading}>
            {isPending ? "Saving…" : isEditing ? "Save sample" : "Add sample"}
          </Button>
          <Button type="button" variant="outline" className="h-9" onClick={() => router.push("/admin/samples")}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-sm font-medium">How it looks</p>
        <div className={cn("storefront overflow-hidden rounded-2xl border border-border bg-card")}>
          <SampleSwatch
            sample={{
              id: initial.id ?? "new",
              code: values.code || null,
              name: values.name,
              kind: values.kind,
              pattern: values.pattern,
              colourHex: values.colourHex,
              accentHex: values.pattern === "PLAIN" ? null : values.accentHex || "#ffffff",
              photoUrl: values.photoUrl || null,
            }}
            className="aspect-square w-full"
          />
          <div className="p-3 text-foreground">
            <p className="text-sm font-semibold">{values.name || "Sample name"}</p>
            <p className="text-xs text-muted-foreground">
              {SAMPLE_KIND_LABEL[values.kind]}
              {values.code ? ` · ${values.code}` : ""}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

function ColourField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-14 cursor-pointer rounded-md border border-border bg-background p-1"
        />
        <Input
          aria-label={`${label} code`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-28 font-mono text-sm"
        />
      </div>
    </div>
  );
}
