/**
 * Shared rules for the For-schools sample book and uniform designer:
 * sample kinds and their labels, the parts the designer draws, and how a
 * design is written into a shareable link (`?shirt=<id>&tie=<id>…`).
 * No server code here, so the designer, the admin and the server can all
 * use it.
 */
export const SAMPLE_KINDS = ["SHIRT", "PANT", "SKIRT", "TIE", "BELT", "BLAZER", "SWEATER", "SOCKS", "SHOES", "TSHIRT", "OTHER"] as const;
export type SampleKind = (typeof SAMPLE_KINDS)[number];

export const SAMPLE_PATTERNS = ["PLAIN", "CHECK", "STRIPE"] as const;
export type SamplePattern = (typeof SAMPLE_PATTERNS)[number];

export const SAMPLE_KIND_LABEL: Record<SampleKind, string> = {
  SHIRT: "Shirt",
  PANT: "Pant",
  SKIRT: "Skirt / frock",
  TIE: "Tie",
  BELT: "Belt",
  BLAZER: "Blazer",
  SWEATER: "Sweater",
  SOCKS: "Socks",
  SHOES: "Shoes",
  TSHIRT: "House / sports T-shirt",
  OTHER: "Other",
};

export const SAMPLE_PATTERN_LABEL: Record<SamplePattern, string> = {
  PLAIN: "Plain",
  CHECK: "Check",
  STRIPE: "Stripe",
};

/** The parts the designer lets a school choose, in picker order, and the
 * URL key each is saved under. Every part can be set to None (not part of
 * the uniform); the child is then shown in a plain base vest or shorts, or
 * bare feet, never a chosen-looking piece. `optional:
 * false` parts start on a sample on a fresh visit. */
export const DESIGN_PARTS = [
  { kind: "SHIRT", key: "shirt", optional: false },
  { kind: "PANT", key: "pant", optional: false },
  { kind: "SKIRT", key: "skirt", optional: false },
  { kind: "TIE", key: "tie", optional: true },
  { kind: "BELT", key: "belt", optional: true },
  { kind: "SWEATER", key: "sweater", optional: true },
  { kind: "BLAZER", key: "blazer", optional: true },
  { kind: "SOCKS", key: "socks", optional: true },
  { kind: "SHOES", key: "shoes", optional: false },
] as const satisfies readonly { kind: SampleKind; key: string; optional: boolean }[];

export type DesignPartKey = (typeof DESIGN_PARTS)[number]["key"];
export type DesignSelection = Partial<Record<DesignPartKey, string>>;

/** A sample as the designer and preview need it. */
export type DesignSample = {
  id: string;
  code: string | null;
  name: string;
  kind: SampleKind;
  pattern: SamplePattern;
  colourHex: string;
  accentHex: string | null;
  photoUrl: string | null;
};

const ID_PATTERN = /^[a-z0-9]{8,40}$/i;

/** Reads a design from a link's search params. Unknown keys and anything
 * that isn't a plausible id are dropped. */
export function parseDesignSelection(params: Record<string, string | string[] | undefined>): DesignSelection {
  const selection: DesignSelection = {};
  for (const part of DESIGN_PARTS) {
    const raw = params[part.key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value && ID_PATTERN.test(value)) selection[part.key] = value;
  }
  return selection;
}

export function designSelectionToQuery(selection: DesignSelection): string {
  const search = new URLSearchParams();
  for (const part of DESIGN_PARTS) {
    const id = selection[part.key];
    if (id) search.set(part.key, id);
  }
  return search.toString();
}

/** Keeps only choices that point at a real sample of the right kind. */
export function cleanDesignSelection(selection: DesignSelection, samples: DesignSample[]): DesignSelection {
  const byId = new Map(samples.map((s) => [s.id, s]));
  const clean: DesignSelection = {};
  for (const part of DESIGN_PARTS) {
    const sample = selection[part.key] ? byId.get(selection[part.key]!) : undefined;
    if (sample && sample.kind === part.kind) clean[part.key] = sample.id;
  }
  return clean;
}

/** Colours for parts drawn without a sample (the boy's shoes before any
 * shoe sample exists, the belt buckle's strap, and so on). */
export const DEFAULT_PART_COLOUR: Record<DesignPartKey, string> = {
  shirt: "#f4f5f7",
  pant: "#5b6170",
  skirt: "#5b6170",
  tie: "#7a1f2b",
  belt: "#1c1f26",
  sweater: "#26304a",
  blazer: "#1f2a44",
  socks: "#f4f5f7",
  shoes: "#16181d",
};

export const HEX_COLOUR = /^#[0-9a-f]{6}$/i;
