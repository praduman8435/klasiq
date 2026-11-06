import "server-only";
import { headers } from "next/headers";

/**
 * The one place this codebase resolves a caller's IP address, for rate
 * limiting. Server Actions get no request object, so it reads
 * `headers()`; route handlers pass their own `request.headers`.
 *
 * Order matters — prefer headers the hosting platform sets itself and a
 * client cannot forge:
 * 1. `x-vercel-forwarded-for` — set by Vercel's edge, never passed
 *    through from the client.
 * 2. `x-real-ip` — set by Vercel and most reverse proxies.
 * 3. the first hop of `x-forwarded-for` — standard proxies.
 * With none present (a bare `next start`, local dev) every request shares
 * one "unknown" bucket — failing toward MORE restrictive, never toward
 * disabling the limit.
 */
export function clientIpFromHeaders(headerList: Headers): string {
  for (const name of ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"]) {
    const value = headerList.get(name)?.split(",")[0]?.trim();
    if (value && value.length <= 64) return value;
  }
  return "unknown";
}

export async function getClientIp(): Promise<string> {
  return clientIpFromHeaders(await headers());
}
