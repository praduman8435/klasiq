import { z } from "zod";
import { HEX_COLOUR, SAMPLE_KINDS, SAMPLE_PATTERNS } from "@/lib/uniform-design";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const uniformSampleSchema = z
  .object({
    name: z.string().trim().min(2, "Give the sample a name.").max(80),
    code: optional(40),
    kind: z.enum(SAMPLE_KINDS),
    pattern: z.enum(SAMPLE_PATTERNS),
    colourHex: z.string().trim().regex(HEX_COLOUR, "Pick the main colour."),
    accentHex: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : null))
      .refine((value) => value === null || HEX_COLOUR.test(value), { message: "Pick the second colour again." }),
    description: optional(300),
    photoUrl: optional(500).refine((value) => value === null || /^\/api\/product-photos\/[A-Za-z0-9_-]+$/.test(value), {
      message: "Choose the photo again.",
    }),
    supplierId: optional(40),
    isActive: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  })
  .superRefine((data, ctx) => {
    if (data.pattern !== "PLAIN" && !data.accentHex) {
      ctx.addIssue({ code: "custom", path: ["accentHex"], message: "A check or stripe needs a second colour." });
    }
  });

export const updateSampleSchemaInput = z.intersection(uniformSampleSchema, z.object({ id: z.string().min(1) }));
export const uniformSampleIdSchema = z.object({ id: z.string().min(1) });

export const SCHOOL_ENQUIRY_STATUSES = ["NEW", "QUOTED", "CONFIRMED", "CLOSED"] as const;
export const updateSchoolEnquirySchema = z.object({
  id: z.string().min(1),
  status: z.enum(SCHOOL_ENQUIRY_STATUSES),
  adminNote: optional(1000),
});
