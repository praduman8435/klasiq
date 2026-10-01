import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

const notify = vi.fn().mockResolvedValue(undefined);
vi.mock("@/server/whatsapp/owner-school-enquiry-alert", () => ({ notifyOwnerOfSchoolEnquiry: (...a: unknown[]) => notify(...a) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { submitSchoolEnquiryAction } from "@/server/actions/school-enquiry";

const tag = randomUUID().slice(0, 6);
const phone = `9${Math.floor(100000000 + Math.random() * 899999999)}`;
const sampleIds: string[] = [];

afterAll(async () => {
  await db.schoolEnquiry.deleteMany({ where: { phoneNormalized: `+91${phone}` } });
  await db.uniformSample.deleteMany({ where: { id: { in: sampleIds } } });
  await db.$disconnect();
});

describe("submitSchoolEnquiryAction", () => {
  it("saves the enquiry with a snapshot of real samples, then alerts the owner", async () => {
    const shirt = await db.uniformSample.create({ data: { name: `Zse Shirt ${tag}`, code: "SH-1", kind: "SHIRT", colourHex: "#ffffff" } });
    const tie = await db.uniformSample.create({ data: { name: `Zse Tie ${tag}`, kind: "TIE", colourHex: "#7a1f2b" } });
    sampleIds.push(shirt.id, tie.id);

    const result = await submitSchoolEnquiryAction({
      schoolName: `Zse Public School ${tag}`,
      contactName: "Mrs Sharma",
      phone,
      studentCount: "450",
      design: { shirt: shirt.id, pant: tie.id, tie: tie.id },
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.enquiryNumber).toMatch(/^SE-\d{8}-[0-9A-F]{6}$/);

    const saved = await db.schoolEnquiry.findUniqueOrThrow({ where: { enquiryNumber: result.enquiryNumber } });
    expect(saved.studentCount).toBe(450);
    // the tie id sent as a "pant" is dropped: wrong kind
    expect(Object.keys(saved.design as object).sort()).toEqual(["shirt", "tie"]);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ schoolName: `Zse Public School ${tag}`, itemsLine: expect.stringContaining("SH-1") }));
  });

  it("stops after three requests from one phone in an hour", async () => {
    const send = () => submitSchoolEnquiryAction({ schoolName: `Zse School ${tag}`, contactName: "Mr Rao", phone, design: {} });
    expect((await send()).success).toBe(true);
    expect((await send()).success).toBe(true);
    const fourth = await send();
    expect(fourth.success).toBe(false);
  });

  it("rejects a bad mobile number", async () => {
    const result = await submitSchoolEnquiryAction({ schoolName: "Zse School", contactName: "Mr Rao", phone: "12345", design: {} });
    expect(!result.success && result.error.field).toBe("phone");
  });
});
