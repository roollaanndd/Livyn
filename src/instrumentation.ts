/**
 * Next.js `instrumentation` hook — the framework calls `register()` once per
 * runtime at startup. We dispatch to the appropriate Sentry config so the
 * SDK is initialised before any request is handled.
 *
 * Only fires on the server; the browser side is initialised from the root
 * `sentry.client.config.ts` (loaded via Next.js's Sentry auto-wiring).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
