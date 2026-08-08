/**
 * Client-side instrumentation. Next.js auto-loads this file (root or `src/`)
 * before the app becomes interactive — no `withSentryConfig` wrapper needed.
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
 *
 * Historical note: this file used to live at `sentry.client.config.ts` at
 * the repo root. That path is only auto-loaded by `@sentry/nextjs` when the
 * Next.js config is wrapped with `withSentryConfig(nextConfig)` — which we
 * don't do. Without the wrapper, that file is orphaned and every client
 * `Sentry.captureException(...)` becomes a silent no-op. Using Next.js's
 * native `instrumentation-client.ts` convention loads Sentry the same way
 * regardless of any Sentry build-time plumbing.
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
