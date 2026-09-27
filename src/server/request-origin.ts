import "server-only";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/site-config";

/**
 * The site's origin for absolute links we hand to customers (a bill link
 * in a WhatsApp message). SITE_URL wins when it's set; otherwise the
 * request's own host, so links still work on a deployment where SITE_URL
 * hasn't been configured (its fallback is http://localhost:3000).
 */
export async function getRequestOrigin(): Promise<string> {
  if (process.env.SITE_URL?.trim()) return SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return SITE_URL;
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}
