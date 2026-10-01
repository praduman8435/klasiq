"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin/session";
import { db } from "@/lib/db";
import { updateSchoolEnquirySchema } from "@/lib/validation/admin-uniform-samples";

export type EnquiryActionResult = { success: true } | { success: false; error: { message: string } };

/** Moves an enquiry along (new → quoted → confirmed / closed) and keeps
 * the owner's note. */
export async function updateSchoolEnquiryAction(input: unknown): Promise<EnquiryActionResult> {
  if (!(await getAdminSession())) return { success: false, error: { message: "Please sign in again." } };
  const parsed = updateSchoolEnquirySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0]?.message ?? "Please check the form." } };
  const { id, ...data } = parsed.data;
  const updated = await db.schoolEnquiry.updateMany({ where: { id }, data });
  if (updated.count === 0) return { success: false, error: { message: "This enquiry no longer exists." } };
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
  return { success: true };
}
