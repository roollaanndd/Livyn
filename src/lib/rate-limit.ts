// In-memory fixed-window rate limiter.
// Suitable for a single-instance deployment; swap for Redis (e.g. Upstash)
// once running multiple instances so limits are shared across them.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Hard ceiling on tracked keys. Keys are attacker-chosen (an IP, an email
 * address), so an unbounded map is itself a way to exhaust the process: spray
 * distinct addresses at /api/auth/login and it grows forever.
 */
const MAX_TRACKED_KEYS = 20_000;

/** Sweep expired buckets, then, if still over the ceiling, drop the ones expiring soonest. */
function evict(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size <= MAX_TRACKED_KEYS) return;

  const byExpiry = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
  for (const [key] of byExpiry.slice(0, buckets.size - MAX_TRACKED_KEYS)) {
    buckets.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // Sweeping only when a new window opens keeps the common path O(1); a
    // request that is merely counted against an existing bucket does no work.
    if (buckets.size >= MAX_TRACKED_KEYS) evict(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

/** Test seam: drops all tracked windows. */
export function resetRateLimits() {
  buckets.clear();
}

/**
 * Caller IP, taken from the left-most x-forwarded-for entry.
 *
 * That entry is client-controlled in general; it is only trustworthy because
 * Vercel's proxy rewrites the header at the edge. Behind any other proxy this
 * needs to read the hop the platform actually appends, or a single attacker can
 * present a fresh IP per request and never be limited.
 */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
