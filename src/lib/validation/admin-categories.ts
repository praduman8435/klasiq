import { z } from "zod";

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(80),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(60)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens only."),
  description: z.string().trim().max(300).optional(),
});

export const createCategorySchema = categoryFormSchema;
export const updateCategorySchema = categoryFormSchema.extend({ id: z.string().min(1) });
export const deleteCategorySchema = z.object({ id: z.string().min(1) });
