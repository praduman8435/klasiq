"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/money";
import { STOCK_STATUS_LABEL } from "@/lib/stock";
import { cn } from "@/lib/utils";
import {
  adjustInventoryByDeltaAction,
  setInventoryQuantityAction,
} from "@/server/actions/admin/inventory";

const STOCK_STATUS_CLASS: Record<string, string> = {
  IN_STOCK: "text-emerald-700 dark:text-emerald-400",
  LOW_STOCK: "text-amber-700 dark:text-amber-400",
  OUT_OF_STOCK: "text-destructive",
};

export type InventoryRowData = {
  id: string;
  productName: string;
  categoryName: string;
  size: string;
  sku: string;
  priceInPaise: number;
  stockQuantity: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
};

export function InventoryRow({ item }: { item: InventoryRowData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "receive" | "set">("idle");
  const [inputValue, setInputValue] = useState("");

  function runDelta(delta: number, reason: "STOCK_RECEIVED" | "MANUAL_CORRECTION") {
    if (isPending) return;
    startTransition(async () => {
      const result = await adjustInventoryByDeltaAction({ productVariantId: item.id, delta, reason });
      if (result.success) {
        toast.success(`Stock updated to ${result.newQuantity}.`);
        setMode("idle");
        setInputValue("");
        router.refresh();
      } else {
        toast.error(result.error.message);
        router.refresh();
      }
    });
  }

  function runSet() {
    const newQuantity = Number.parseInt(inputValue, 10);
    if (Number.isNaN(newQuantity) || newQuantity < 0) {
      toast.error("Enter a valid stock count.");
      return;
    }
    if (isPending) return;
    startTransition(async () => {
      const result = await setInventoryQuantityAction({
        productVariantId: item.id,
        newQuantity,
        expectedPreviousQuantity: item.stockQuantity,
        reason: "MANUAL_CORRECTION",
      });
      if (result.success) {
        toast.success(`Stock set to ${result.newQuantity}.`);
        setMode("idle");
        setInputValue("");
        router.refresh();
      } else {
        toast.error(result.error.message);
        router.refresh();
      }
    });
  }

  function runReceive() {
    const received = Number.parseInt(inputValue, 10);
    if (Number.isNaN(received) || received <= 0) {
      toast.error("Enter how many units arrived.");
      return;
    }
    runDelta(received, "STOCK_RECEIVED");
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">{item.productName}</p>
        <p className="text-xs text-muted-foreground">
          {item.categoryName} &middot; Size {item.size} &middot; SKU {item.sku}
        </p>
        <p className="mt-0.5 text-sm">
          {formatPaise(item.priceInPaise)} &middot;{" "}
          <span className={STOCK_STATUS_CLASS[item.stockStatus]}>
            {STOCK_STATUS_LABEL[item.stockStatus]}
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border">
            <button
              type="button"
              aria-label={`Decrease stock for ${item.productName} size ${item.size}`}
              disabled={isPending || item.stockQuantity <= 0}
              onClick={() => runDelta(-1, "MANUAL_CORRECTION")}
              className="flex size-10 items-center justify-center text-muted-foreground disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="w-10 text-center text-sm font-semibold tabular-nums">
              {item.stockQuantity}
            </span>
            <button
              type="button"
              aria-label={`Increase stock for ${item.productName} size ${item.size}`}
              disabled={isPending}
              onClick={() => runDelta(1, "MANUAL_CORRECTION")}
              className="flex size-10 items-center justify-center text-muted-foreground disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setMode(mode === "receive" ? "idle" : "receive")}
          >
            <Package className="size-3.5" aria-hidden />
            Receive stock
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setInputValue(String(item.stockQuantity));
              setMode(mode === "set" ? "idle" : "set");
            }}
          >
            Set exact
          </Button>
        </div>

        {mode !== "idle" && (
          <div className={cn("flex items-center gap-2")}>
            <Input
              type="number"
              inputMode="numeric"
              min={mode === "set" ? 0 : 1}
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-9 w-24"
              placeholder={mode === "receive" ? "Qty received" : "New count"}
            />
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={mode === "receive" ? runReceive : runSet}
            >
              Save
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}
