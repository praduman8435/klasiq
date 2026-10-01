import { z } from "zod";
import { DESIGN_PARTS } from "@/lib/uniform-design";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const designShape = Object.fromEntries(
  DESIGN_PARTS.map((part) => [part.key, z.string().trim().max(40).optional()]),
) as Record<(typeof DESIGN_PARTS)[number]["key"], z.ZodOptional<z.ZodString>>;

/** The quote request a school sends from the designer. */
export const schoolEnquirySchema = z.object({
  schoolName: z.string().trim().min(3, "Please enter the school's name.").max(120),
  contactName: z.string().trim().min(2, "Please enter your name.").max(80),
  role: optional(40),
  phone: z.string().trim().min(1, "Please enter a mobile number.").max(20),
  city: optional(80),
  studentCount: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(20000)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value)),
  classes: optional(120),
  neededBy: optional(60),
  message: optional(1000),
  design: z.object(designShape),
  /** Left empty by people; bots fill every field. */
  website: z.string().max(0).optional(),
});

export type SchoolEnquiryInput = z.input<typeof schoolEnquirySchema>;
