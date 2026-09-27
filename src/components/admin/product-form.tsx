"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductPhotoPicker } from "@/components/admin/product-photo-picker";
import { SizeChips } from "@/components/admin/size-chips";
import { SwitchRow } from "@/components/admin/switch-row";
import { slugify } from "@/lib/slug";
import { createProductAction, updateProductAction } from "@/server/actions/admin/products";

type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  schoolId: string | null;
  imageUrl: string;
  isActive: boolean;
};

const fieldClass = "h-10";
const selectClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * A product's details: photo, name, category, school, description, and
 * whether customers can see it. Adding a product also takes its first size
 * (size, price, MRP, stock), so it's ready to sell in one go. The web
 * address is made from the name and tucked under More settings.
 */
export function ProductForm({
  initial,
  categories,
  schools,
}: {
  initial?: ProductFormValues;
  categories: Array<{ id: string; name: string }>;
  schools: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const isEditing = Boolean(initial?.id);
  const ids = {
    name: useId(),
    category: useId(),
    school: useId(),
    description: useId(),
    slug: useId(),
    size: useId(),
    price: useId(),
    mrp: useId(),
    stock: useId(),
  };

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "");
  const [schoolId, setSchoolId] = useState<string>(initial?.schoolId ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [first, setFirst] = useState({ size: "", price: "", mrp: "", stock: "" });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending || photoUploading) return;
    setError(null);
    if (name.trim().length < 2) return setError("Enter the product name.");
    if (!isEditing) {
      if (!first.size.trim()) return setError("Enter the first size, like 28 or M.");
      if (!(Number(first.price) > 0)) return setError("Enter the selling price.");
      if (first.mrp && Number(first.mrp) < Number(first.price)) return setError("Selling price can't be more than the MRP.");
    }

    startTransition(async () => {
      const payload = { name, slug, description, categoryId, schoolId: schoolId || null, imageUrl, isActive };

      if (isEditing) {
        const result = await updateProductAction({ ...payload, id: initial!.id });
        if (!result.success) return setError(result.error.message);
        toast.success("Saved");
        router.refresh();
        return;
      }

      const result = await createProductAction({
        ...payload,
        slug: slugTouched ? slug : "",
        firstSize: {
          size: first.size,
          priceInRupees: first.price,
          mrpInRupees: first.mrp ? first.mrp : null,
          stockQuantity: first.stock || 0,
        },
      });
      if (!result.success) return setError(result.error.message);
      toast.success(`${name.trim()} added`);
      router.push(`/admin/products/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Photo</Label>
        <ProductPhotoPicker value={imageUrl} onChange={setImageUrl} productName={name} onUploadingChange={setPhotoUploading} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={ids.name}>Product name</Label>
        <Input
          id={ids.name}
          className={fieldClass}
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. White Shirt"
          autoFocus={!isEditing}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.category}>Category</Label>
          <select id={ids.category} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.school}>School</Label>
          <select id={ids.school} value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className={selectClass}>
            <option value="">Generic — reusable by any school</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (exclusive)
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Most uniform items should stay Generic so schools can share them. Only pick a specific school for an
        item exclusive to it (e.g. a crested blazer).
      </p>

      {!isEditing && (
        <fieldset className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <legend className="px-1 text-sm font-semibold">First size</legend>
          <p className="-mt-1 text-xs text-muted-foreground">You can add the other sizes after saving.</p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.size}>Size</Label>
            <Input id={ids.size} className={fieldClass} placeholder="e.g. 28 or M" value={first.size} onChange={(e) => setFirst({ ...first, size: e.target.value })} />
            <SizeChips value={first.size} onPick={(size) => setFirst({ ...first, size })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.price}>Selling price</Label>
              <Input
                id={ids.price}
                className={fieldClass}
                inputMode="decimal"
                placeholder="₹"
                value={first.price}
                onChange={(e) => setFirst({ ...first, price: e.target.value.replace(/[^\d.]/g, "") })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.mrp}>
                MRP <span className="font-normal text-muted-foreground">(opt.)</span>
              </Label>
              <Input
                id={ids.mrp}
                className={fieldClass}
                inputMode="decimal"
                placeholder="₹"
                value={first.mrp}
                onChange={(e) => setFirst({ ...first, mrp: e.target.value.replace(/[^\d.]/g, "") })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.stock}>In stock</Label>
              <Input
                id={ids.stock}
                className={fieldClass}
                inputMode="numeric"
                placeholder="0"
                value={first.stock}
                onChange={(e) => setFirst({ ...first, stock: e.target.value.replace(/\D/g, "") })}
              />
            </div>
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={ids.description}>
          Description <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <textarea
          id={ids.description}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A line parents see on the product page"
          className="min-h-16 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <SwitchRow
        checked={isActive}
        onChange={setIsActive}
        label="Show on website"
        hint={isActive ? "Parents can find and order it." : "Hidden from the website. You can still sell it at the counter."}
      />

      <details className="group rounded-lg border border-border">
        <summary className="flex h-11 cursor-pointer list-none items-center justify-between px-3.5 text-sm text-muted-foreground hover:text-foreground">
          More settings
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="flex flex-col gap-1.5 border-t border-border p-3.5">
          <Label htmlFor={ids.slug}>Web address</Label>
          <div className="flex items-center overflow-hidden rounded-lg border border-border focus-within:ring-2 focus-within:ring-ring">
            <span className="shrink-0 bg-secondary px-2.5 py-2.5 text-xs text-muted-foreground">/product/</span>
            <input
              id={ids.slug}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"));
              }}
              placeholder="made from the name"
              className="h-10 min-w-0 flex-1 bg-background px-2.5 text-sm outline-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">Made from the name automatically. Change it only if you need a different link.</p>
        </div>
      </details>

      <Button type="submit" className="h-11 w-full text-base sm:w-auto sm:min-w-40" disabled={isPending || photoUploading}>
        {photoUploading ? "Uploading photo…" : isPending ? "Saving…" : isEditing ? "Save changes" : "Add product"}
      </Button>
    </form>
  );
}
