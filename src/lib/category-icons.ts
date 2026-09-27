import {
  Backpack,
  Baby,
  Footprints,
  Gem,
  Gift,
  GraduationCap,
  PencilRuler,
  Shirt,
  ShoppingBag,
  Tag,
  Watch,
  createLucideIcon,
  type LucideIcon,
} from "lucide-react";
import { isCategoryIconKey, type CategoryIconKey } from "@/lib/category-icon-keys";

// Drawn in lucide's own 24px, 2px-stroke grammar, for clothes lucide
// doesn't have. Uniform is a shirt with a tie, so it never looks like the
// plain Shirt category next to it.
const Uniform = createLucideIcon("Uniform", [
  [
    "path",
    {
      d: "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z",
      key: "uniform-shirt",
    },
  ],
  ["path", { d: "M12 6.5 10.9 8.2 12 15.5l1.1-7.3Z", key: "uniform-tie" }],
]);
const Sock = createLucideIcon("Sock", [
  ["path", { d: "M9 2h6v8.5l3.6 3.6a3 3 0 0 1-4.2 4.3l-5.2-5.2A3 3 0 0 1 9 11Z", key: "sock-body" }],
  ["path", { d: "M9 6h6", key: "sock-cuff" }],
]);
const Trousers = createLucideIcon("Trousers", [
  ["path", { d: "M6 2h12l1 20h-5l-2-12-2 12H5Z", key: "trousers-legs" }],
  ["path", { d: "M6 6h12", key: "trousers-waist" }],
]);
const Kurta = createLucideIcon("Kurta", [
  ["path", { d: "M8 2h8l4.5 4.5-2.5 2.5L17 8v14H7V8L6 9 3.5 6.5Z", key: "kurta-body" }],
  ["path", { d: "M10 2l2 4 2-4", key: "kurta-neck" }],
  ["path", { d: "M12 6v5", key: "kurta-placket" }],
]);
const Dress = createLucideIcon("Dress", [
  ["path", { d: "M9 2v3l1 3-5 14h14L14 8l1-3V2", key: "dress-body" }],
  ["path", { d: "M10 8h4", key: "dress-waist" }],
]);

const ICONS: Record<CategoryIconKey, LucideIcon> = {
  uniform: Uniform,
  shirt: Shirt,
  trousers: Trousers,
  kurta: Kurta,
  dress: Dress,
  shoes: Footprints,
  socks: Sock,
  bag: Backpack,
  handbag: ShoppingBag,
  stationery: PencilRuler,
  baby: Baby,
  jewellery: Gem,
  watch: Watch,
  gift: Gift,
  school: GraduationCap,
  sale: Tag,
};

/** Used when the admin leaves the icon on "Auto": matched by keyword on
 * the category's slug or name, so a renamed or new category still gets a
 * sensible icon without anyone choosing one. */
const CATEGORY_ICON_KEYWORDS: [pattern: RegExp, icon: CategoryIconKey][] = [
  [/uniform/, "uniform"],
  [/shoe|footwear|sandal|sneaker|chappal/, "shoes"],
  [/sock/, "socks"],
  [/school-?bag|backpack|trolley/, "bag"],
  [/bag|purse|wallet/, "handbag"],
  [/jean|denim|trouser|pant|lower/, "trousers"],
  [/kurt|ethnic|suit/, "kurta"],
  [/dress|frock|gown|skirt/, "dress"],
  [/shirt|top|tee|sweater|blazer|jacket/, "shirt"],
  [/station|book|pen|copy/, "stationery"],
  [/baby|kid|infant/, "baby"],
  [/jewel|jewell|bangle|earring/, "jewellery"],
  [/watch/, "watch"],
  [/gift|toy/, "gift"],
];

export function guessCategoryIconKey(categorySlugOrName: string): CategoryIconKey {
  const value = categorySlugOrName.toLowerCase();
  for (const [pattern, key] of CATEGORY_ICON_KEYWORDS) {
    if (pattern.test(value)) return key;
  }
  return "handbag";
}

/**
 * The ONE category → icon lookup for the storefront (category tiles, the
 * menu, product placeholders): the icon the admin picked, else a guess
 * from the slug or name.
 */
export function getCategoryIcon(categorySlugOrName: string, chosenIcon?: string | null): LucideIcon {
  if (isCategoryIconKey(chosenIcon)) return ICONS[chosenIcon];
  return ICONS[guessCategoryIconKey(categorySlugOrName)];
}

export function getIconByKey(key: CategoryIconKey): LucideIcon {
  return ICONS[key];
}
