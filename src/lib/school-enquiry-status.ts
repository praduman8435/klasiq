export const ENQUIRY_STATUS_LABEL = {
  NEW: "New",
  QUOTED: "Quote sent",
  CONFIRMED: "Confirmed",
  CLOSED: "Closed",
} as const;

export type EnquiryStatus = keyof typeof ENQUIRY_STATUS_LABEL;

export const ENQUIRY_STATUS_BADGE: Record<EnquiryStatus, string> = {
  NEW: "border-red-500/40 bg-red-500/15 text-red-300",
  QUOTED: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  CONFIRMED: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  CLOSED: "border-border text-muted-foreground",
};
