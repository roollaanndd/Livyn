import { NextResponse } from "next/server";

/**
 * Public deployment health probe. Returns 200 when the app boots and can
 * see its required config; 503 when something is missing. Never returns
 * actual secret values — only "set" / "unset" per key.
 *
 * The reason this exists: production issues like "the login button does
 * nothing" or "password reset never arrives" almost always come from a
 * missing or wrong env var. This endpoint tells you in one curl which one.
 *
 *   curl https://livyn.app/api/health
 *
 * Deliberately no auth: it must be reachable from a mobile network without
 * having to sign in first. The information it exposes (which categories of
 * env var are configured) is not sensitive on its own — attackers can
 * already infer the same from the app's behavior. What we never expose:
 * the values themselves, deploy IDs, or user-adjacent info.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CheckState = "set" | "unset";

function present(name: string): CheckState {
  const v = process.env[name];
  return v && v.length > 0 ? "set" : "unset";
}

/**
 * Reproduces the derivation in src/lib/prisma.ts / supabase-rest.ts: reports
 * "set" only when we can actually resolve a Supabase base URL — either
 * SUPABASE_URL is set directly, or DATABASE_URL is set AND the project ref
 * regex matches. Answering "set" from mere presence of DATABASE_URL misled
 * operators when the ref didn't match and every request threw at runtime.
 */
function supabaseUrlDerivable(): CheckState {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_URL.length > 0) return "set";
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl) return "unset";
  const poolerMatch = dbUrl.match(/\/\/[^.]+\.([a-z]{20})[.:@]/);
  const directMatch = dbUrl.match(/db\.([a-z]{20})\.supabase/);
  return poolerMatch || directMatch ? "set" : "unset";
}

export async function GET() {
  const checks = {
    // Required — the app cannot serve traffic without these.
    required: {
      JWT_ACCESS_SECRET: present("JWT_ACCESS_SECRET"),
      SUPABASE_URL_OR_DATABASE_URL: supabaseUrlDerivable(),
      SUPABASE_ANON_KEY:
        present("SUPABASE_ANON_KEY") === "set" || present("NEXT_PUBLIC_SUPABASE_ANON_KEY") === "set"
          ? "set"
          : "unset",
    },
    // Optional but tied to specific features. Missing = that feature disabled.
    features: {
      pushNotifications: {
        VAPID_PUBLIC_KEY: present("VAPID_PUBLIC_KEY"),
        VAPID_PRIVATE_KEY: present("VAPID_PRIVATE_KEY"),
        VAPID_SUBJECT: present("VAPID_SUBJECT"),
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: present("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
        CRON_SECRET: present("CRON_SECRET"),
      },
      email: {
        RESEND_API_KEY: present("RESEND_API_KEY"),
        EMAIL_FROM: present("EMAIL_FROM"),
      },
      monitoring: {
        SENTRY_DSN: present("SENTRY_DSN"),
        NEXT_PUBLIC_SENTRY_DSN: present("NEXT_PUBLIC_SENTRY_DSN"),
      },
      rateLimit: {
        UPSTASH_REDIS_REST_URL: present("UPSTASH_REDIS_REST_URL"),
        UPSTASH_REDIS_REST_TOKEN: present("UPSTASH_REDIS_REST_TOKEN"),
      },
      aiPastor: {
        OPENROUTER_API_KEY: present("OPENROUTER_API_KEY"),
      },
    },
  };

  const requiredOk = Object.values(checks.required).every((v) => v === "set");
  const status = requiredOk ? 200 : 503;

  return NextResponse.json(
    {
      ok: requiredOk,
      time: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
      region: process.env.VERCEL_REGION ?? "unknown",
      checks,
    },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
