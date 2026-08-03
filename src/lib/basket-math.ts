/**
 * Pure basket/stock decision logic, kept free of DB/cookie IO so it can be
 * unit tested directly. This is where "never trust client stock/price"
 * actually gets enforced — server actions call these with numbers freshly
 * read from the database, never from the request body.
 */

export type OrderableVariant = {
  id: string;
  sortOrder: number;
  stockQuantity: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
};

/**
 * Computes the new line quantity when adding `requestedQuantity` more of an
 * item to a basket that may already contain `existingQuantity` of it.
 * Always clamped to what's actually in stock and to the per-line cap —
 * never allowed to exceed either, regardless of what was requested.
 */
export function clampAddQuantity(params: {
  existingQuantity: number;
  requestedQuantity: number;
  stockQuantity: number;
  maxPerLine: number;
}): number {
  const { existingQuantity, requestedQuantity, stockQuantity, maxPerLine } = params;
  return Math.max(
    0,
    Math.min(existingQuantity + requestedQuantity, stockQuantity, maxPerLine),
  );
}

/**
 * Clamps a directly-set quantity (e.g. from a basket page stepper) to what's
 * in stock and the per-line cap.
 */
export function clampSetQuantity(params: {
  requestedQuantity: number;
  stockQuantity: number;
  maxPerLine: number;
}): number {
  const { requestedQuantity, stockQuantity, maxPerLine } = params;
  return Math.max(0, Math.min(requestedQuantity, stockQuantity, maxPerLine));
}

/**
 * Picks which variant a "complete set" item should default to when added in
 * bulk — the lowest-sortOrder variant that's actually orderable. Returns
 * undefined if every size is out of stock, so the caller can skip it and
 * tell the parent instead of silently adding something unbuyable.
 */
export function pickDefaultOrderableVariant<T extends OrderableVariant>(
  variants: readonly T[],
): T | undefined {
  return [...variants]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((variant) => variant.stockStatus !== "OUT_OF_STOCK");
}
