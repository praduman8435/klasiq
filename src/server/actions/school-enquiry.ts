"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/phone";
import { DESIGN_PARTS, SAMPLE_KIND_LABEL } from "@/lib/uniform-design";
import { schoolEnquirySchema } from "@/lib/validation/school-enquiry";
import { notifyOwnerOfSchoolEnquiry } from "@/server/whatsapp/owner-school-enquiry-alert";

/** A phone can send this many enquiries per hour — plenty for a real
 * school, a brake on someone filling the inbox. */
const MAX_ENQUIRIES_PER_PHONE_PER_HOUR = 3;

export type SchoolEnquiryResult =
  | { success: true; enquiryNumber: string }
  | { success: false; error: { message: string; field?: string } };

export type DesignSnapshot = Partial<Record<string, { id: string; kind: string; code: string | null; name: string }>>;

function enquiryNumber(now: Date): string {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const day = ist.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `SE-${day}-${suffix}`;
}

/** A school asks for a quote with its chosen design. Public: no login. */
export async function submitSchoolEnquiryAction(input: unknown): Promise<SchoolEnquiryResult> {
  const parsed = schoolEnquirySchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { success: false, error: { message: issue?.message ?? "Please check the form.", field: issue?.path[0]?.toString() } };
  }
  const data = parsed.data;
  if (data.website) return { success: false, error: { message: "Please try again." } };

  const phone = normalizePhoneNumber(data.phone);
  if (!phone.valid) return { success: false, error: { message: "Please enter a valid 10-digit mobile number.", field: "phone" } };

  const recent = await db.schoolEnquiry.count({
    where: { phoneNormalized: phone.normalized, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= MAX_ENQUIRIES_PER_PHONE_PER_HOUR) {
    return { success: false, error: { message: "We already have your request. We'll call you soon, or call us directly." } };
  }

  // Keep a snapshot of the chosen samples (only real, active ones of the
  // right kind), so the enquiry still reads correctly later.
  const ids = Object.values(data.design).filter((id): id is string => Boolean(id));
  const samples = ids.length
    ? await db.uniformSample.findMany({
        where: { id: { in: ids }, isActive: true },
        select: { id: true, kind: true, code: true, name: true },
      })
    : [];
  const byId = new Map(samples.map((s) => [s.id, s]));
  const design: DesignSnapshot = {};
  for (const part of DESIGN_PARTS) {
    const sample = data.design[part.key] ? byId.get(data.design[part.key]!) : undefined;
    if (sample && sample.kind === part.kind) design[part.key] = sample;
  }

  const enquiry = await db.schoolEnquiry.create({
    data: {
      enquiryNumber: enquiryNumber(new Date()),
      schoolName: data.schoolName,
      contactName: data.contactName,
      role: data.role,
      phone: data.phone,
      phoneNormalized: phone.normalized,
      city: data.city,
      studentCount: data.studentCount,
      classes: data.classes,
      neededBy: data.neededBy,
      message: data.message,
      design,
    },
  });
  revalidatePath("/admin/enquiries");

  await notifyOwnerOfSchoolEnquiry({
    enquiryNumber: enquiry.enquiryNumber,
    schoolName: enquiry.schoolName,
    contactName: enquiry.contactName,
    phone: enquiry.phone,
    studentCount: enquiry.studentCount,
    itemsLine: Object.values(design)
      .map((s) => `${SAMPLE_KIND_LABEL[s!.kind as keyof typeof SAMPLE_KIND_LABEL]} ${s!.code ?? s!.name}`)
      .join(", "),
  });

  return { success: true, enquiryNumber: enquiry.enquiryNumber };
}
