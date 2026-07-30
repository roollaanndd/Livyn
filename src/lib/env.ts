/**
 * Central, lazily-evaluated environment access.
 *
 * Two rules hold here:
 *
 * 1. Nothing secret is ever hardcoded as a fallback. A JWT secret that quietly
 *    defaults to a constant means anyone who can read this repository can mint
 *    an admin session token; a database key that defaults to a real project's
 *    key hands out that database. Missing config raises instead.
 * 2. Every accessor is a function, not a module-level constant, so importing
 *    this file during `next build` can never fail the build over config that is
 *    only needed while serving a request.
 */

/** Dev-only stand-in so `next dev` works from a bare checkout. Never used in production. */
const DEV_JWT_SECRET = "livyn-dev-only-secret-not-for-production";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function read(name: string): string | undefined {
  const trimmed = process.env[name]?.trim();
  return trimmed ? trimmed : undefined;
}

function requireEnv(name: string, hint: string): string {
  const value = read(name);
  if (value) return value;
  throw new Error(`Missing required environment variable ${name}. ${hint}`);
}

const warned = new Set<string>();

function warnOnce(name: string, message: string) {
  if (warned.has(name)) return;
  warned.add(name);
  console.warn(`[livyn/env] ${message}`);
}

/**
 * HMAC secret for access tokens, as the byte array `jose` expects.
 *
 * In production a missing secret throws. In development it falls back to a
 * fixed string so a fresh clone runs, with a warning on first use.
 */
export function accessTokenSecret(): Uint8Array {
  const secret = read("JWT_ACCESS_SECRET");
  if (!secret) {
    if (isProduction()) {
      throw new Error(
        "Missing required environment variable JWT_ACCESS_SECRET. " +
          "Generate one with `openssl rand -base64 48`.",
      );
    }
    warnOnce(
      "JWT_ACCESS_SECRET",
      "JWT_ACCESS_SECRET is unset — using the development secret. Set a real one before deploying.",
    );
    return new TextEncoder().encode(DEV_JWT_SECRET);
  }
  return new TextEncoder().encode(secret);
}

/**
 * Base URL of the Supabase project.
 *
 * Prefers an explicit SUPABASE_URL and otherwise recovers the project ref from
 * DATABASE_URL, which covers both the direct (`db.<ref>.supabase.co`) and
 * pooled (`<user>.<ref>:...@...pooler.supabase.com`) connection-string shapes.
 */
export function supabaseUrl(): string {
  const explicit = read("SUPABASE_URL");
  if (explicit) return explicit.replace(/\/+$/, "");

  const dbUrl = read("DATABASE_URL");
  const ref =
    dbUrl?.match(/\/\/[^.]+\.([a-z]{20})[.:@]/)?.[1] ?? dbUrl?.match(/db\.([a-z]{20})\.supabase/)?.[1];
  if (ref) return `https://${ref}.supabase.co`;

  throw new Error(
    "Cannot determine the Supabase URL. Set SUPABASE_URL, or a DATABASE_URL that contains the project ref.",
  );
}

/**
 * Supabase API key used for every PostgREST call.
 *
 * This is the app's only database credential, so it is required config with no
 * fallback — the anon key is "publishable" only in a deployment whose row-level
 * security actually constrains it, and it must never be committed regardless.
 */
export function supabaseKey(): string {
  return (
    read("SUPABASE_ANON_KEY") ??
    read("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    requireEnv(
      "SUPABASE_ANON_KEY",
      "Copy it from Supabase: Project Settings -> API -> Project API keys.",
    )
  );
}

/** Shared secret the push scheduler must present. Absent means the endpoint stays shut. */
export function cronSecret(): string | undefined {
  return read("CRON_SECRET");
}
