import "server-only";
import type { FulfillmentType, OrderSource } from "@prisma/client";
import { STORE_CONTACT } from "@/lib/constants";
import { formatPaise } from "@/lib/money";
import { normalizePhoneNumber } from "@/lib/phone";
import { getWhatsAppTransportConfig } from "@/server/whatsapp/config";
import { getNotificationSender } from "@/server/whatsapp/notification-sender";

export type OrderForOwnerAlert = {
  orderNumber: string;
  source: OrderSource;
  fulfillmentType: FulfillmentType;
  customerName: string | null;
  customerMobile: string | null;
  totalInPaise: number;
  deliveryAddressLine: string | null;
  deliveryArea: string | null;
  deliveryLandmark: string | null;
  schoolName: string | null;
};

export type OwnerAlertPlan =
  | { send: true; phoneNormalized: string; templateName: string; bodyParameters: string[] }
  | { send: false; reason: "counter-sale" | "no-template" | "bad-owner-number" };

/**
 * What the shop owner's "new online order" WhatsApp says. The Meta
 * template needs exactly 5 body variables, in this order: order number,
 * customer name, customer mobile, order value, and where it goes
 * ("Store pickup" or the delivery address). The school, when the order
 * has one, is added to the last line.
 */
export function planOwnerOrderAlert(order: OrderForOwnerAlert, env: Record<string, string | undefined> = process.env): OwnerAlertPlan {
  if (order.source === "COUNTER") return { send: false, reason: "counter-sale" };

  const templateName = env.WHATSAPP_OWNER_NEW_ORDER_TEMPLATE_NAME?.trim();
  if (!templateName) return { send: false, reason: "no-template" };

  const owner = normalizePhoneNumber(env.OWNER_WHATSAPP_NUMBER?.trim() || STORE_CONTACT.phone);
  if (!owner.valid) return { send: false, reason: "bad-owner-number" };

  const address = [order.deliveryAddressLine, order.deliveryArea, order.deliveryLandmark].filter(Boolean).join(", ");
  const where = order.fulfillmentType === "LOCAL_DELIVERY" ? `Delivery to ${address || "address not given"}` : "Store pickup";
  const whereWithSchool = order.schoolName ? `${where} · ${order.schoolName}` : where;

  return {
    send: true,
    phoneNormalized: owner.normalized,
    templateName,
    bodyParameters: [
      order.orderNumber,
      order.customerName?.trim() || "Customer",
      order.customerMobile?.trim() || "not given",
      formatPaise(order.totalInPaise),
      whereWithSchool,
    ],
  };
}

/**
 * Tells the shop owner on WhatsApp that an online order just came in.
 * Uses the same WhatsApp Business setup as the customer order messages;
 * until WHATSAPP_OWNER_NEW_ORDER_TEMPLATE_NAME is set (and WhatsApp is
 * configured) it's skipped with a log line. NEVER THROWS — a messaging
 * problem must never affect the order. Call it only after the order has
 * been committed, once per real order.
 */
export async function notifyOwnerOfNewOrder(order: OrderForOwnerAlert): Promise<void> {
  try {
    const plan = planOwnerOrderAlert(order);
    if (!plan.send) {
      if (plan.reason !== "counter-sale") {
        console.error("owner-order-alert: skipping", { reason: plan.reason, orderNumber: order.orderNumber });
      }
      return;
    }
    await getNotificationSender().send(getWhatsAppTransportConfig(), {
      phoneNormalized: plan.phoneNormalized,
      templateName: plan.templateName,
      templateLanguage: process.env.WHATSAPP_NOTIFICATION_TEMPLATE_LANGUAGE ?? "en_US",
      bodyParameters: plan.bodyParameters,
      logLabel: "owner-order-alert",
    });
  } catch {
    console.error("owner-order-alert: delivery failed", { orderNumber: order.orderNumber });
  }
}
