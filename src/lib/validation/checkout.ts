import { z } from "zod";

// Loosely validates an Indian mobile number: optional +91/91 prefix, then a
// 10-digit number starting 6-9. Spaces/hyphens are stripped before testing.
const MOBILE_PATTERN = /^(?:\+?91)?[6-9]\d{9}$/;

export const checkoutInputSchema = z
  .object({
    customerName: z.string().trim().min(2, "Please enter your name.").max(80),
    customerMobile: z
      .string()
      .trim()
      .transform((value) => value.replace(/[\s-]/g, ""))
      .refine((value) => MOBILE_PATTERN.test(value), {
        message: "Please enter a valid 10-digit mobile number.",
      }),
    fulfillmentType: z.enum(["STORE_PICKUP", "LOCAL_DELIVERY"]),
    deliveryAddressLine: z.string().trim().max(160).optional(),
    deliveryArea: z.string().trim().max(80).optional(),
    deliveryLandmark: z.string().trim().max(120).optional(),
    // Client-generated once per checkout attempt (crypto.randomUUID()) and
    // resent unchanged on retry — see docs/PHASE_2_REPORT.md "Idempotency".
    idempotencyKey: z.string().uuid(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType !== "LOCAL_DELIVERY") return;

    if (!data.deliveryAddressLine || data.deliveryAddressLine.length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryAddressLine"],
        message: "Please enter your delivery address.",
      });
    }
    if (!data.deliveryArea || data.deliveryArea.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryArea"],
        message: "Please enter your area/locality.",
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
