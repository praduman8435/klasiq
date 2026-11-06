import { NextResponse } from "next/server";
import { getBasketItemCount } from "@/lib/basket";
import { clientIpFromHeaders } from "@/lib/request-ip";
import { consumeMemoryRateLimit, tooManyRequestsResponse } from "@/server/rate-limit";

/** The header's bag badge. Per-visitor (reads the basket cookie), so it
 * must never be cached by the CDN or shared between visitors. */
export async function GET(request: Request) {
  const limit = consumeMemoryRateLimit({ key: `bag-count:${clientIpFromHeaders(request.headers)}`, limit: 120, windowSeconds: 60 });
  if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const count = await getBasketItemCount();
  return NextResponse.json({ count }, { headers: { "Cache-Control": "private, no-store" } });
}
