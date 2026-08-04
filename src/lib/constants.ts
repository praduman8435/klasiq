/**
 * Centralized brand/site identity. Nothing else in the codebase should
 * hard-code the brand name, tagline, or heritage copy — import from here so
 * a future rename or copy change happens in one place, not scattered across
 * components. See docs/PHASE_3_REPORT.md ("Branding") for the rename from
 * the Phase 1/2 placeholder name to Klasiq.
 */
export const BRAND = {
  /** Normal running-text presentation: "Klasiq". */
  name: "Klasiq",
  /** All-caps wordmark/logo treatment — visual only, never used as the
   * textual brand name in copy. */
  wordmark: "KLASIQ",
  tagline: "School essentials, made simple.",
  description:
    "Find your child's school uniform, shoes and school bags online — search your school, pick the size, and get the right essentials without running around the market.",
  /** Deliberately vague on an exact founding year — see PHASE_3_REPORT.md
   * "Heritage claims". Update only when a specific founding year is
   * explicitly confirmed for production copy. */
  heritageLine: "Serving local families for around 30 years.",
  /** The physical retail businesses Klasiq's catalog and fulfillment are
   * backed by. Referenced sparingly (About/footer/trust areas), never as
   * the primary brand on every screen. */
  legacyStoreNames: ["Milan Readymade & General Store", "Shubham Vashtralaya"] as const,
} as const;

export const ADMIN_BRAND_NAME = `${BRAND.name} Admin`;

/** "Backed by X and Y" — built from legacyStoreNames so the wording only
 * needs to change in one place if the backing stores ever change. */
export function getBackedByLine(): string {
  const [first, second] = BRAND.legacyStoreNames;
  return `Backed by ${first} and ${second}`;
}
