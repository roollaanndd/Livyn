# Deployment environment variables

Set every variable below in Vercel under both **Production** and **Preview** scopes (Settings → Environment Variables). A missing required var means the endpoint that reads it throws or returns 503 at first request — this is intentional and prevents silent misconfiguration.

## Required (deploy fails at request time without them)

| Variable | Purpose | Where to get it |
|---|---|---|
| `DATABASE_URL` | Supabase Postgres connection string. Adapter derives Supabase project ID from it if `SUPABASE_URL` isn't set separately. | Supabase → Project Settings → Database → Connection string (URI, pooled if available) |
| `SUPABASE_ANON_KEY` | Supabase publishable key used by the REST adapter. RLS on every table is what actually protects data — this is not a secret in the cryptographic sense, but pinning it in code was pinning a specific project ID. | Supabase → Project Settings → API → `anon`/`publishable` key |
| `JWT_ACCESS_SECRET` | HS256 signing secret for the access-token cookie. Any random 32+ byte string. **Never share, never commit.** | `openssl rand -base64 48` |

## Web push (prayer reminders + daily verse)

Required if you want push notifications to actually deliver. Without them, `/api/cron/push` returns 503 with a legible reason.

| Variable | Purpose |
|---|---|
| `VAPID_PUBLIC_KEY` | Web push VAPID public key |
| `VAPID_PRIVATE_KEY` | Web push VAPID private key |
| `VAPID_SUBJECT` | `mailto:` address the push service can contact |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Same value as `VAPID_PUBLIC_KEY`, exposed to the browser for `pushManager.subscribe()` |
| `CRON_SECRET` | Bearer token the GitHub Actions cron uses to authenticate to `/api/cron/push`. Random 32+ bytes. Must ALSO be set in the repo's Actions secrets under the same name. |

Generate VAPID keys with `npx web-push generate-vapid-keys`.

## Email (password reset, future verification)

Required in production. Without them, `/api/auth/forgot-password` returns 500 rather than silently dropping the mail like the old `console.log` did.

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend API key (from resend.com) |
| `EMAIL_FROM` | e.g. `"Livyn <noreply@livyn.app>"`. Domain must be verified in Resend first, otherwise Resend refuses to send. |

## Sentry (error monitoring)

Optional but strongly recommended. Without a DSN, `Sentry.captureException()` calls are no-ops.

| Variable | Purpose |
|---|---|
| `SENTRY_DSN` | Server + edge transport (from sentry.io project settings) |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser transport. Same DSN value; separate name because it needs to be exposed to the client bundle. |
| `NEXT_PUBLIC_SENTRY_ENV` | Optional override; defaults to `NODE_ENV`. Set to `preview` on Vercel Preview to separate preview noise from production errors. |

## Rate limiting (Redis)

Optional. Without them the limiter falls back to in-memory Map, which is per-lambda-instance and therefore near-useless on serverless.

| Variable | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

## AI Pastor (OpenRouter LLM)

Optional. Without it, `/api/ai-pastor` returns 503 with a legible reason.

| Variable | Purpose |
|---|---|
| `OPENROUTER_API_KEY` | OpenRouter API key. AI Pastor auto-selects a free chat model from OpenRouter's live catalog. |

## Quick copy checklist

```
DATABASE_URL=
SUPABASE_ANON_KEY=
JWT_ACCESS_SECRET=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
CRON_SECRET=

RESEND_API_KEY=
EMAIL_FROM=

SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SENTRY_ENV=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

OPENROUTER_API_KEY=
```
