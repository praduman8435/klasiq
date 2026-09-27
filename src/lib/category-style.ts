/**
 * The colour a category wears on the storefront: its circle on the
 * homepage and menu, and the photo placeholder of its products until a
 * real photo is added. The brand is black, red and grey only, so every
 * category shares one grey; the icon tells them apart.
 */
export type CategoryTint = { bg: string; fg: string };

const GREY: CategoryTint = { bg: "bg-secondary", fg: "text-foreground/85" };

export function getCategoryTint(_categorySlugOrName: string): CategoryTint {
  return GREY;
}
