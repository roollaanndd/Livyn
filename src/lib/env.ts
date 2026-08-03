import "server-only";

/**
 * Env-var gate. The old shape — `process.env.X ?? "insecure-default"` at
 * module scope — was how an unset JWT_ACCESS_SECRET on Vercel silently
 * accepted every signed token. This forces a real value or an explicit
 * failure, without breaking the build.
 *
 * The check is lazy on purpose. Module-scope throws blow up `next build`
 * on any deploy platform (Vercel, self-hosted) that does not expose runtime
 * env vars during static analysis — even when the same vars are set for
 * runtime. Deferring to first request means the build always succeeds and
 * any actual traffic under a missing secret fails loudly instead.
 */

const isProd = process.env.NODE_ENV === "production";

export function requiredSecret(name: string, devFallback?: string): () => string {
  let cached: string | undefined;
  return () => {
    if (cached !== undefined) return cached;
    const value = process.env[name];
    if (value && value.length > 0) {
      cached = value;
      return cached;
    }
    if (!isProd && devFallback !== undefined) {
      cached = devFallback;
      return cached;
    }
    throw new Error(
      `Missing required environment variable: ${name}. Set it in the deployment environment; there is no safe default in production.`,
    );
  };
}

export function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}
