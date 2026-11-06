import "server-only";
import { db } from "@/lib/db";

/**
 * Two rate limiters, picked by what's being protected:
 *
 * - `consumeRateLimit` — shared by every server instance (one atomic
 *   Postgres upsert per call). For actions where a determined attacker
 *   spreading requests across instances would matter: sign-in, admin
 *   login, checkout, coupons, quote requests.
 *
 * - `consumeMemoryRateLimit` — per server instance, zero I/O. For
 *   per-keystroke endpoints (search suggestions, address lookup) where a
 *   database write per key press would slow the site down for everyone.
 *   It's a brake on floods from one client, not an exact global count.
 */

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

type Limit = {
  /** Namespaced, e.g. `signin:ip:${ip}`. Never put a secret in a key. */
  key: string;
  limit: number;
  windowSeconds: number;
};

const CLEANUP_PROBABILITY = 0.01;
const CLEANUP_OLDER_THAN_MS = 24 * 60 * 60 * 1000;

export async function consumeRateLimit({ key, limit, windowSeconds }: Limit): Promise<RateLimitResult> {
  const now = new Date();
  const windowCutoff = new Date(now.getTime() - windowSeconds * 1000);

  // Atomic: concurrent requests for the same key each get a distinct count.
  const rows = await db.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "windowStart")
    VALUES (${key}, 1, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "rate_limit_buckets"."windowStart" <= ${windowCutoff}
                     THEN 1 ELSE "rate_limit_buckets"."count" + 1 END,
      "windowStart" = CASE WHEN "rate_limit_buckets"."windowStart" <= ${windowCutoff}
                     THEN ${now} ELSE "rate_limit_buckets"."windowStart" END
    RETURNING "count", "windowStart"`;

  if (Math.random() < CLEANUP_PROBABILITY) {
    db.rateLimitBucket
      .deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - CLEANUP_OLDER_THAN_MS) } } })
      .catch(() => {});
  }

  const row = rows[0];
  if (!row || row.count <= limit) return { allowed: true };
  const resetsAt = row.windowStart.getTime() + windowSeconds * 1000;
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((resetsAt - now.getTime()) / 1000)) };
}

/** Checks several limits; every one is counted, the first refusal wins. */
export async function consumeRateLimits(limits: Limit[]): Promise<RateLimitResult> {
  const results = await Promise.all(limits.map(consumeRateLimit));
  return results.find((r) => !r.allowed) ?? { allowed: true };
}

const MEMORY_MAX_KEYS = 10_000;
const memoryBuckets = new Map<string, { count: number; windowStart: number }>();

export function consumeMemoryRateLimit({ key, limit, windowSeconds }: Limit): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  let bucket = memoryBuckets.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    if (memoryBuckets.size >= MEMORY_MAX_KEYS) {
      for (const [k, b] of memoryBuckets) {
        if (now - b.windowStart >= windowMs) memoryBuckets.delete(k);
      }
      if (memoryBuckets.size >= MEMORY_MAX_KEYS) memoryBuckets.clear();
    }
    bucket = { count: 0, windowStart: now };
    memoryBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count <= limit) return { allowed: true };
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.windowStart + windowMs - now) / 1000)) };
}

export function tooManyRequestsResponse(retryAfterSeconds: number): Response {
  return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfterSeconds) },
  });
}
