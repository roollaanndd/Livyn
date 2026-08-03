/**
 * Sentry initialization for the browser runtime.
 *
 * All three Sentry configs (client, server, edge) share the same policy:
 * NEXT_PUBLIC_SENTRY_DSN (or SENTRY_DSN for the server-side files) drives
 * whether Sentry does anything. When the env var is absent the SDK is left
 * uninitialised — every `Sentry.captureException(...)` call becomes a no-op,
 * so wiring boundaries to it costs nothing in the "not configured" case.
 *
 * Sample rate defaults are tuned for a small but growing production: capture
 * every error, sample 10% of traces. Adjust once you have volume — until
 * then, 100% error capture is what surfaces the issues nobody would
 * otherwise report.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Session replay opt-in only — enable once you have a paid Sentry seat
    // and have decided that recording user sessions fits your privacy story.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Never surface a Sentry error dialog to the user; the app's own error
    // boundaries handle presentation, Sentry is just the backend record.
    beforeSend(event) {
      return event;
    },
  });
}
