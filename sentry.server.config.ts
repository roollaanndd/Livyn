/**
 * Sentry initialization for the Node.js server runtime (route handlers,
 * server components, server actions). No-op if SENTRY_DSN isn't set — see
 * sentry.client.config.ts for the shared policy.
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
