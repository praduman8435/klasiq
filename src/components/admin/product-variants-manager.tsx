"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/money";
import { STOCK_STATUS_LABEL } from "@/lib/stock";
import {
  createVariantAction,
  deleteVariantAction,
  setVariantActiveAction,
  updateVariantAction,
} from "@/server/actions/admin/products";

type Variant = {
  id: string;
  size: string;
  sku: string;
  priceInPaise: number;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  isActive: boolean;
};

function VariantEditForm({
  variant,
  onDone,
}: {
  variant: Variant;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [size, setSize] = useState(variant.size);
  const [sku, setSku] = useState(variant.sku);
  const [price, setPrice] = useState(String(variant.priceInPaise / 100));
  const [stock, setStock] = useState(String(variant.stockQuantity));

  function handleSave() {
    if (isPending) return;
    startTransition(async () => {
      const result = await updateVariantAction({
        id: variant.id,
        size,
        sku,
        priceInRupees: Number(price),
        stockQuantity: Number(stock),
      });
      if (result.success) {
        toast.success("Size updated.");
        onDone();
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-secondary/40 p-2">
      <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size" className="h-8 w-20 text-xs" />
      <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="h-8 w-28 text-xs" />
      <Input
        type="number"
        step="0.01"
        min={0}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price (₹)"
        className="h-8 w-24 text-xs"
      />
      <Input
        type="number"
        min={0}
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        placeholder="Stock"
        className="h-8 w-20 text-xs"
      />
      <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
        Save
      </Button>
      <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={onDone}>
        Cancel
      </Button>
    </div>
  );
}

function VariantRow({ variant }: { variant: Variant }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  function handleToggleActive() {
    if (isPending) return;
    startTransition(async () => {
      const result = await setVariantActiveAction({ id: variant.id, isActive: !variant.isActive });
      if (result.success) {
        toast.success(variant.isActive ? "Size deactivated." : "Size activated.");
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    });
  }

  function handleDelete() {
    if (isPending) return;
    const confirmed = window.confirm(`Delete size ${variant.size} (SKU ${variant.sku})? This cannot be undone.`);
    if (!confirmed) return;
    startTransition(async () => {
      const result = await deleteVariantAction({ id: variant.id });
      if (result.success) {
        toast.success("Size deleted.");
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    });
  }

  if (editing) {
    return (
      <li className="py-2">
        <VariantEditForm variant={variant} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
      <div className={variant.isActive ? "" : "opacity-50"}>
        <span className="font-medium">Size {variant.size}</span>{" "}
        <span className="text-muted-foreground">
          &middot; SKU {variant.sku} &middot; {formatPaise(variant.priceInPaise)} &middot; Stock{" "}
          {variant.stockQuantity} ({STOCK_STATUS_LABEL[variant.stockStatus]})
          {!variant.isActive && " · Inactive"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Edit size ${variant.size}`}
          disabled={isPending}
          onClick={() => setEditing(true)}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          <Pencil className="size-4" aria-hidden />
        </button>
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleToggleActive}>
          {variant.isActive ? "Deactivate" : "Activate"}
        </Button>
        <button
          type="button"
          aria-label={`Delete size ${variant.size}`}
          disabled={isPending}
          onClick={handleDelete}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export function ProductVariantsManager({
  productId,
  variants,
}: {
  productId: string;
  variants: Variant[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [size, setSize] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    if (isPending || !size.trim() || !sku.trim() || !price) return;
    startTransition(async () => {
      const result = await createVariantAction({
        productId,
        size: size.trim(),
        sku: sku.trim(),
        priceInRupees: Number(price),
        stockQuantity: Number(stock) || 0,
      });
      if (result.success) {
        toast.success("Size added.");
        setSize("");
        setSku("");
        setPrice("");
        setStock("0");
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    });
  }

  return (
    <div>
      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sizes added yet.</p>
      ) : (
        <ul className="divide-y">
          {variants.map((v) => (
            <VariantRow key={v.id} variant={v} />
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed p-3">
        <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size (e.g. 28)" className="h-9 w-28" />
        <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="h-9 w-32" />
        <Input
          type="number"
          step="0.01"
          min={0}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (₹)"
          className="h-9 w-28"
        />
        <Input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="Stock"
          className="h-9 w-24"
        />
        <Button type="submit" variant="outline" disabled={isPending || !size.trim() || !sku.trim() || !price}>
          Add size
        </Button>
      </form>
    </div>
  );
}
