/**
 * The icons an admin can pick for a category (Admin → Categories). Kept
 * apart from the icon drawings (category-icons.ts) so validation can use
 * the list without importing any icon code. Order = order in the picker.
 */
export const CATEGORY_ICONS = [
  { key: "uniform", label: "Uniform" },
  { key: "shirt", label: "Shirt" },
  { key: "trousers", label: "Jeans / pants" },
  { key: "kurta", label: "Kurta / kurti" },
  { key: "dress", label: "Dress / frock" },
  { key: "shoes", label: "Shoes" },
  { key: "socks", label: "Socks" },
  { key: "bag", label: "School bag" },
  { key: "handbag", label: "Bag / purse" },
  { key: "stationery", label: "Stationery" },
  { key: "baby", label: "Kids / baby" },
  { key: "jewellery", label: "Jewellery" },
  { key: "watch", label: "Watch" },
  { key: "gift", label: "Gifts" },
  { key: "school", label: "School" },
  { key: "sale", label: "Offers / other" },
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICONS)[number]["key"];

export const CATEGORY_ICON_KEYS = CATEGORY_ICONS.map((icon) => icon.key) as [CategoryIconKey, ...CategoryIconKey[]];

export function isCategoryIconKey(value: unknown): value is CategoryIconKey {
  return typeof value === "string" && (CATEGORY_ICON_KEYS as readonly string[]).includes(value);
}
