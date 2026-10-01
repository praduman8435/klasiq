import "server-only";
import { STORE_CONTACT } from "@/lib/constants";
import { normalizePhoneNumber } from "@/lib/phone";
import { getWhatsAppTransportConfig } from "@/server/whatsapp/config";
import { getNotificationSender } from "@/server/whatsapp/notification-sender";

export type EnquiryForOwnerAlert = {
  enquiryNumber: string;
  schoolName: string;
  contactName: string;
  phone: string;
  studentCount: number | null;
  itemsLine: string;
};

export type OwnerEnquiryAlertPlan =
  | { send: true; phoneNormalized: string; templateName: string; bodyParameters: string[] }
  | { send: false; reason: "no-template" | "bad-owner-number" };

/**
 * The owner's "new school enquiry" WhatsApp. The Meta template needs
 * exactly 5 body variables, in order: school name, contact name, contact
 * mobile, student count, and the chosen items. Goes to the same number as
 * the new-order alert.
 */
export function planOwnerEnquiryAlert(
  enquiry: EnquiryForOwnerAlert,
  env: Record<string, string | undefined> = process.env,
): OwnerEnquiryAlertPlan {
  const templateName = env.WHATSAPP_OWNER_SCHOOL_ENQUIRY_TEMPLATE_NAME?.trim();
  if (!templateName) return { send: false, reason: "no-template" };
  const owner = normalizePhoneNumber(env.OWNER_WHATSAPP_NUMBER?.trim() || STORE_CONTACT.phone);
  if (!owner.valid) return { send: false, reason: "bad-owner-number" };
  return {
    send: true,
    phoneNormalized: owner.normalized,
    templateName,
    bodyParameters: [
      enquiry.schoolName,
      enquiry.contactName,
      enquiry.phone,
      enquiry.studentCount ? String(enquiry.studentCount) : "not given",
      enquiry.itemsLine || "no items chosen",
    ],
  };
}

/** NEVER THROWS — a messaging problem must never lose an enquiry. */
export async function notifyOwnerOfSchoolEnquiry(enquiry: EnquiryForOwnerAlert): Promise<void> {
  try {
    const plan = planOwnerEnquiryAlert(enquiry);
    if (!plan.send) {
      console.error("owner-school-enquiry-alert: skipping", { reason: plan.reason, enquiryNumber: enquiry.enquiryNumber });
      return;
    }
    await getNotificationSender().send(getWhatsAppTransportConfig(), {
      phoneNormalized: plan.phoneNormalized,
      templateName: plan.templateName,
      templateLanguage: process.env.WHATSAPP_NOTIFICATION_TEMPLATE_LANGUAGE ?? "en_US",
      bodyParameters: plan.bodyParameters,
      logLabel: "owner-school-enquiry-alert",
    });
  } catch {
    console.error("owner-school-enquiry-alert: delivery failed", { enquiryNumber: enquiry.enquiryNumber });
  }
}
