import { describe, expect, it } from "vitest";
import { cleanDesignSelection, designSelectionToQuery, parseDesignSelection, type DesignSample } from "@/lib/uniform-design";
import { uniformSampleSchema } from "@/lib/validation/admin-uniform-samples";
import { schoolEnquirySchema } from "@/lib/validation/school-enquiry";

const sample = (id: string, kind: DesignSample["kind"]): DesignSample => ({
  id,
  code: null,
  name: id,
  kind,
  pattern: "PLAIN",
  colourHex: "#ffffff",
  accentHex: null,
  photoUrl: null,
});

describe("design links", () => {
  it("reads known parts and drops junk", () => {
    expect(parseDesignSelection({ shirt: "cmabc12345", tie: ["cmtie12345"], hack: "x", pant: "<script>" })).toEqual({
      shirt: "cmabc12345",
      tie: "cmtie12345",
    });
  });

  it("round-trips through the query string", () => {
    const query = designSelectionToQuery({ shirt: "cmabc12345", blazer: "cmblz12345" });
    expect(query).toBe("shirt=cmabc12345&blazer=cmblz12345");
    expect(parseDesignSelection(Object.fromEntries(new URLSearchParams(query)))).toEqual({ shirt: "cmabc12345", blazer: "cmblz12345" });
  });

  it("keeps only real samples of the right kind", () => {
    const samples = [sample("cmshirt0001", "SHIRT"), sample("cmtie000001", "TIE")];
    expect(cleanDesignSelection({ shirt: "cmshirt0001", pant: "cmtie000001", tie: "cmmissing01" }, samples)).toEqual({ shirt: "cmshirt0001" });
  });
});

describe("sample and quote forms", () => {
  const base = { name: "Sky blue oxford", kind: "SHIRT", pattern: "PLAIN", colourHex: "#a7c4e8" } as const;
  it("a check or stripe needs a second colour; colours must be hex", () => {
    expect(uniformSampleSchema.safeParse(base).success).toBe(true);
    expect(uniformSampleSchema.safeParse({ ...base, pattern: "CHECK" }).success).toBe(false);
    expect(uniformSampleSchema.safeParse({ ...base, pattern: "CHECK", accentHex: "#123456" }).success).toBe(true);
    expect(uniformSampleSchema.safeParse({ ...base, colourHex: "blue" }).success).toBe(false);
    expect(uniformSampleSchema.safeParse({ ...base, photoUrl: "https://x.com/a.jpg" }).success).toBe(false);
  });

  it("the quote form needs school, name and phone; student count is optional", () => {
    const ok = schoolEnquirySchema.safeParse({ schoolName: "Sunrise Public School", contactName: "Mrs Sharma", phone: "9812345670", studentCount: "", design: {} });
    expect(ok.success && ok.data.studentCount).toBe(null);
    expect(schoolEnquirySchema.safeParse({ schoolName: "", contactName: "A", phone: "9", design: {} }).success).toBe(false);
    expect(schoolEnquirySchema.safeParse({ schoolName: "Sunrise", contactName: "Ab", phone: "9812345670", design: {}, website: "spam" }).success).toBe(false);
  });
});
