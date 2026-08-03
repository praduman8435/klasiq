import type { StockStatus } from "@prisma/client";

/**
 * Derives the correct stock status for a given quantity/threshold pair.
 * Used whenever stock quantity changes, so `stockStatus` never drifts out
 * of sync with `stockQuantity`. Staff can still be given a way to force
 * OUT_OF_STOCK ahead of quantity hitting zero (e.g. discontinued item) —
 * that override happens by writing stockStatus directly and is not
 * something this function needs to account for.
 */
export function deriveStockStatus(
  quantity: number,
  lowStockThreshold: number,
): StockStatus {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

export function isOrderable(stockStatus: StockStatus): boolean {
  return stockStatus !== "OUT_OF_STOCK";
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};
