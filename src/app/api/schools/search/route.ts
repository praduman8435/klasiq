import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIpFromHeaders } from "@/lib/request-ip";
import { consumeMemoryRateLimit, tooManyRequestsResponse } from "@/server/rate-limit";

// Public catalogue data, the same for everyone: let the CDN answer repeat
// searches for a minute (and serve a stale copy while it refreshes), so
// typing in the search box rarely reaches the server or the database.
const CACHE_HEADERS = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" };
import { searchSchools } from "@/server/queries/schools";

const querySchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
});

export async function GET(request: Request) {
  const limit = consumeMemoryRateLimit({
    key: `search:${clientIpFromHeaders(request.headers)}`,
    limit: 120,
    windowSeconds: 60,
  });
  if (!limit.allowed) return tooManyRequestsResponse(limit.retryAfterSeconds);

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ q: url.searchParams.get("q") ?? "" });

  if (!parsed.success) {
    return NextResponse.json({ schools: [] }, { status: 400 });
  }

  const schools = await searchSchools(parsed.data.q);
  return NextResponse.json({ schools }, { headers: CACHE_HEADERS });
}
