import { db } from "@/lib/db";
import type { DesignSample } from "@/lib/uniform-design";

const DESIGN_SELECT = {
  id: true,
  code: true,
  name: true,
  kind: true,
  pattern: true,
  colourHex: true,
  accentHex: true,
  photoUrl: true,
} as const;

/** The sample book schools see: active samples, in admin order. */
export async function getActiveSamples(): Promise<(DesignSample & { description: string | null })[]> {
  return db.uniformSample.findMany({
    where: { isActive: true },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: { ...DESIGN_SELECT, description: true },
  });
}

/** Admin → Sample book: every sample with its supplier's name. */
export async function getAllSamplesForAdmin() {
  return db.uniformSample.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { supplier: { select: { id: true, name: true, businessName: true } } },
  });
}

export async function getSampleById(id: string) {
  return db.uniformSample.findUnique({ where: { id } });
}

export async function getSuppliersForSamplePicker() {
  return db.supplier.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, businessName: true },
  });
}

export async function getSchoolEnquiries(status?: "NEW" | "QUOTED" | "CONFIRMED" | "CLOSED") {
  return db.schoolEnquiry.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getSchoolEnquiryById(id: string) {
  return db.schoolEnquiry.findUnique({ where: { id } });
}

export async function countNewSchoolEnquiries() {
  return db.schoolEnquiry.count({ where: { status: "NEW" } });
}
