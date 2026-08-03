/**
 * Rate limiter with a Redis backend when configured, in-memory otherwise.
 *
 * The in-memory implementation this replaced was ineffective on Vercel
 * serverless: every cold start reset the buckets, and each request may
 * hit a different lambda instance, so a `limit=5 per 10 min` login gate
 * was in practice `limit=5 per fresh lambda`. Setting UPSTASH_REDIS_REST_URL
 * and UPSTASH_REDIS_REST_TOKEN routes the limiter through Upstash's REST
 * API (no client library needed — pure fetch, Edge-runtime compatible) and
 * every instance sees the same counter.
 *
 * Sliding-window is approximated with fixed-window buckets keyed by
 * floor(now / windowMs). It over-permits by up to windowMs at bucket
 * boundaries, but for auth throttling that's fine — the goal is to price
 * out brute-force, not to enforce exact per-second SLAs.
 *
 * When the Upstash env vars aren't set, the module falls back to an
 * in-memory Map so local dev and single-instance deploys still work.
 * The signature is now `Promise<{...}>` (was sync), so every callsite
 * awaits.
 */

type Bucket = { count: number; resetAt: number };
const memoryBuckets = new Map<string, Bucket>();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const HAS_REDIS = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

export type RateLimitResult = { ok: boolean; retryAfterMs: number };

async function upstashPipeline(commands: (string | number)[][]): Promise<unknown[]> {
  const res = await fetch(`${UPSTASH_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upstash pipeline failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as Array<{ result?: unknown; error?: string }>;
  return data.map((r) => (r.error ? null : r.result));
}

async function rateLimitRedis(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const bucketKey = `rl:${key}:${bucket}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

  try {
    const [countRaw] = await upstashPipeline([
      ["INCR", bucketKey],
      ["EXPIRE", bucketKey, windowSec],
    ]);
    const count = typeof countRaw === "number" ? countRaw : Number(countRaw ?? 0);
    if (count > limit) {
      const resetAt = (bucket + 1) * windowMs;
      return { ok: false, retryAfterMs: resetAt - now };
    }
    return { ok: true, retryAfterMs: 0 };
  } catch (err) {
    // Upstash flake or transient outage: fall through to memory instead of
    // taking every rate-limited endpoint down with a 500. Log so it's
    // visible in Sentry if configured.
    console.error("[rate-limit] Redis unavailable, falling back to memory:", err);
    return rateLimitMemory(key, limit, windowMs);
  }
}

function rateLimitMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (HAS_REDIS) return rateLimitRedis(key, limit, windowMs);
  return rateLimitMemory(key, limit, windowMs);
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
