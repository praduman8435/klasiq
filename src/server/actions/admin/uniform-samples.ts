"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin/session";
import { db } from "@/lib/db";
import {
  uniformSampleIdSchema,
  uniformSampleSchema,
  updateSampleSchemaInput,
} from "@/lib/validation/admin-uniform-samples";

export type SampleActionResult = { success: true; id?: string } | { success: false; error: { message: string } };

function revalidateSampleViews() {
  revalidatePath("/admin/samples");
  revalidatePath("/for-schools");
  revalidatePath("/for-schools/design");
}

async function checkSupplier(supplierId: string | null) {
  if (!supplierId) return true;
  return Boolean(await db.supplier.findUnique({ where: { id: supplierId }, select: { id: true } }));
}

export async function createUniformSampleAction(input: unknown): Promise<SampleActionResult> {
  if (!(await getAdminSession())) return { success: false, error: { message: "Please sign in again." } };
  const parsed = uniformSampleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0]?.message ?? "Please check the form." } };
  if (!(await checkSupplier(parsed.data.supplierId))) return { success: false, error: { message: "That supplier no longer exists." } };
  const data = { ...parsed.data, accentHex: parsed.data.pattern === "PLAIN" ? null : parsed.data.accentHex };
  const sample = await db.uniformSample.create({ data });
  revalidateSampleViews();
  return { success: true, id: sample.id };
}

export async function updateUniformSampleAction(input: unknown): Promise<SampleActionResult> {
  if (!(await getAdminSession())) return { success: false, error: { message: "Please sign in again." } };
  const parsed = updateSampleSchemaInput.safeParse(input);
  if (!parsed.success) return { success: false, error: { message: parsed.error.issues[0]?.message ?? "Please check the form." } };
  const { id, ...rest } = parsed.data;
  if (!(await db.uniformSample.findUnique({ where: { id }, select: { id: true } }))) {
    return { success: false, error: { message: "This sample was deleted." } };
  }
  if (!(await checkSupplier(rest.supplierId))) return { success: false, error: { message: "That supplier no longer exists." } };
  await db.uniformSample.update({ where: { id }, data: { ...rest, accentHex: rest.pattern === "PLAIN" ? null : rest.accentHex } });
  revalidateSampleViews();
  return { success: true, id };
}

export async function deleteUniformSampleAction(input: unknown): Promise<SampleActionResult> {
  if (!(await getAdminSession())) return { success: false, error: { message: "Please sign in again." } };
  const parsed = uniformSampleIdSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: { message: "Invalid request." } };
  // Enquiries keep their own snapshot of the samples they chose, so a
  // sample can be deleted without breaking an old enquiry.
  await db.uniformSample.deleteMany({ where: { id: parsed.data.id } });
  revalidateSampleViews();
  return { success: true };
}
