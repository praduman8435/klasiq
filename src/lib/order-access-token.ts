import { randomBytes } from "node:crypto";

/**
 * An unguessable token required (alongside the human-friendly order number)
 * to view an order's public confirmation page. 24 bytes of CSPRNG output,
 * base64url-encoded (32 chars, URL-safe, no padding) — see "Order lookup
 * security" in docs/PHASE_2_REPORT.md for why the order number alone is
 * never sufficient to authorize access.
 */
export function generateOrderAccessToken(): string {
  return randomBytes(24).toString("base64url");
}
