"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin/session";
import {
  createCategorySchema,
  deleteCategorySchema,
  updateCategorySchema,
} from "@/lib/validation/admin-categories";

export type AdminActionResult<T> =
  | T
  | {
      success: false;
      error: { type: "UNAUTHORIZED" | "VALIDATION" | "NOT_FOUND" | "CONFLICT"; message: string };
    };

async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) {
    return {
      unauthorized: {
        success: false as const,
        error: { type: "UNAUTHORIZED" as const, message: "Please sign in again." },
      },
    };
  }
  return { unauthorized: null };
}

function revalidateCategoryViews() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/", "layout");
}

export async function createCategoryAction(
  input: unknown,
): Promise<AdminActionResult<{ success: true }>> {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { type: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid request." },
    };
  }

  const existing = await db.category.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { success: false, error: { type: "CONFLICT", message: "That slug is already in use." } };
  }

  const maxSortOrder = await db.category.aggregate({ _max: { sortOrder: true } });
  await db.category.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
    },
  });

  revalidateCategoryViews();
  return { success: true };
}

export async function updateCategoryAction(
  input: unknown,
): Promise<AdminActionResult<{ success: true }>> {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { type: "VALIDATION", message: parsed.error.issues[0]?.message ?? "Invalid request." },
    };
  }

  const current = await db.category.findUnique({ where: { id: parsed.data.id } });
  if (!current) {
    return { success: false, error: { type: "NOT_FOUND", message: "Category not found." } };
  }

  if (parsed.data.slug !== current.slug) {
    const slugTaken = await db.category.findUnique({ where: { slug: parsed.data.slug } });
    if (slugTaken) {
      return { success: false, error: { type: "CONFLICT", message: "That slug is already in use." } };
    }
  }

  await db.category.update({
    where: { id: parsed.data.id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
    },
  });

  revalidateCategoryViews();
  return { success: true };
}

export async function deleteCategoryAction(
  input: unknown,
): Promise<AdminActionResult<{ success: true }>> {
  const { unauthorized } = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = deleteCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: { type: "VALIDATION", message: "Invalid request." } };
  }

  const category = await db.category.findUnique({ where: { id: parsed.data.id } });
  if (!category) {
    return { success: false, error: { type: "NOT_FOUND", message: "Category not found." } };
  }

  const productCount = await db.product.count({ where: { categoryId: parsed.data.id } });
  if (productCount > 0) {
    return {
      success: false,
      error: {
        type: "CONFLICT",
        message: `This category has ${productCount} product${productCount === 1 ? "" : "s"} — move or remove them first.`,
      },
    };
  }

  await db.category.delete({ where: { id: parsed.data.id } });
  revalidateCategoryViews();
  return { success: true };
}
