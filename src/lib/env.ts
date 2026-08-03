import "server-only";

/**
 * Fail loudly at boot when a production secret is missing, instead of
 * silently substituting a placeholder that leaves the deploy exploitable.
 *
 * The old shape — `process.env.X ?? "insecure-dev-default"` — is what let
 * an unset JWT_ACCESS_SECRET on Vercel accept any signed token. Route every
 * secret through here so a missing var is a boot failure, not a stealth
 * compromise.
 */

const isProd = process.env.NODE_ENV === "production";

export function requiredSecret(name: string, devFallback?: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  if (!isProd && devFallback !== undefined) return devFallback;
  throw new Error(
    `Missing required environment variable: ${name}. Set it in the deployment environment; there is no safe default in production.`,
  );
}

export function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}
