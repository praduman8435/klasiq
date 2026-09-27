import { describe, expect, it } from "vitest";
import { planOwnerOrderAlert, type OrderForOwnerAlert } from "@/server/whatsapp/owner-order-alert";

const order: OrderForOwnerAlert = {
  orderNumber: "ORD-20260928-K7M3P",
  source: "ONLINE",
  fulfillmentType: "LOCAL_DELIVERY",
  customerName: "Sunita Devi",
  customerMobile: "9812345670",
  totalInPaise: 125000,
  deliveryAddressLine: "12 MG Road",
  deliveryArea: "Ghazipur",
  deliveryLandmark: null,
  schoolName: null,
};
const env = { WHATSAPP_OWNER_NEW_ORDER_TEMPLATE_NAME: "owner_new_order" };

describe("planOwnerOrderAlert", () => {
  it("sends the order number, name, mobile, value and address to the shop number", () => {
    expect(planOwnerOrderAlert(order, env)).toEqual({
      send: true,
      phoneNormalized: "+918542843482",
      templateName: "owner_new_order",
      bodyParameters: ["ORD-20260928-K7M3P", "Sunita Devi", "9812345670", "₹1,250", "Delivery to 12 MG Road, Ghazipur"],
    });
  });

  it("says Store pickup, and adds the school when the order has one", () => {
    const plan = planOwnerOrderAlert({ ...order, fulfillmentType: "STORE_PICKUP", schoolName: "Sunrise Public School" }, env);
    expect(plan.send && plan.bodyParameters[4]).toBe("Store pickup · Sunrise Public School");
  });

  it("goes to OWNER_WHATSAPP_NUMBER when set", () => {
    const plan = planOwnerOrderAlert(order, { ...env, OWNER_WHATSAPP_NUMBER: "98765 43210" });
    expect(plan.send && plan.phoneNormalized).toBe("+919876543210");
  });

  it("is skipped until the template is set up, for counter sales, and for a bad owner number", () => {
    expect(planOwnerOrderAlert(order, {})).toEqual({ send: false, reason: "no-template" });
    expect(planOwnerOrderAlert({ ...order, source: "COUNTER" }, env)).toEqual({ send: false, reason: "counter-sale" });
    expect(planOwnerOrderAlert(order, { ...env, OWNER_WHATSAPP_NUMBER: "12345" })).toEqual({ send: false, reason: "bad-owner-number" });
  });
});
