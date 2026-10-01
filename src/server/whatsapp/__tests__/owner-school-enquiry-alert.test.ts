import { describe, expect, it } from "vitest";
import { planOwnerEnquiryAlert } from "@/server/whatsapp/owner-school-enquiry-alert";

describe("owner enquiry alert", () => {
  const enquiry = { enquiryNumber: "SE-1", schoolName: "Sunrise", contactName: "Mrs Sharma", phone: "9812345670", studentCount: 450, itemsLine: "Shirt SH-1" };
  it("is skipped until its template is set, then sends 5 values to the shop number", () => {
    expect(planOwnerEnquiryAlert(enquiry, {})).toEqual({ send: false, reason: "no-template" });
    expect(planOwnerEnquiryAlert(enquiry, { WHATSAPP_OWNER_SCHOOL_ENQUIRY_TEMPLATE_NAME: "owner_school_enquiry" })).toEqual({
      send: true,
      phoneNormalized: "+918542843482",
      templateName: "owner_school_enquiry",
      bodyParameters: ["Sunrise", "Mrs Sharma", "9812345670", "450", "Shirt SH-1"],
    });
  });
});
