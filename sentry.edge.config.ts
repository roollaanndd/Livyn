/**
 * Sentry initialization for the Edge runtime (src/proxy.ts and any Edge
 * route handlers). Separate file because the Edge runtime cannot use the
 * Node SDK's built-in transports. No-op if SENTRY_DSN isn't set.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
