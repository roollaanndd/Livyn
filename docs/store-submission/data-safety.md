# Google Play Data Safety disclosure

Fill this into Play Console → App content → Data safety. Every answer is the truth as of the current schema; if you add a new data type, update this doc first, then the form.

## Data collection & sharing summary

**Does your app collect or share any of the required user data types?** Yes.

**Is all user data collected transmitted using a secure connection?** Yes — HTTPS everywhere, HSTS in production, cookies are `httpOnly` + `secure` in prod.

**Do you provide a way for users to request that their data be deleted?** Yes — in-app: `Profil → Data & Akun → Hapus Akun`. That endpoint hard-deletes the User row and cascades to every related model.

## Personal info

| Type | Collected? | Shared? | Purpose | Optional? |
|---|---|---|---|---|
| Name | Yes | No | Account setup, personalization (greeting, community display name) | No |
| Email address | Yes | No | Account creation, authentication, password reset, notifications about the account | No |
| User IDs | Yes | No | Internal user identifier (cuid), stored alongside every user record | No |

## App activity

| Type | Collected? | Shared? | Purpose | Optional? |
|---|---|---|---|---|
| App interactions | Yes | No | Recording when the user opens Livyn (habit histogram) to time reminders | No |
| Other in-app actions | Yes | No | Prayer logs, journal entries, favorites, reading progress, challenge progress — the app's core function | No |

## Personal info — sensitive / religious

| Type | Collected? | Shared? | Purpose | Optional? |
|---|---|---|---|---|
| Religious/spiritual practice data | Yes | No | The app is a spiritual companion; prayer entries, journal entries, and devotional selections are the product. | No |

Declare this in the "Sensitive Info" section of Play's form — it's a required category for apps in the Lifestyle / Health & Fitness / religious space.

## Personal messages

| Type | Collected? | Shared? | Purpose | Optional? |
|---|---|---|---|---|
| Journal entries ("Curhat kepada Tuhan") | Yes | No | The user's own private journal, stored server-side for cross-device sync | No |
| Prayer requests in Circles | Yes | Yes (with other members of the same Circle) | Community prayer feature. Sharing is scoped to the Circle members the user joined. | Yes (feature is opt-in) |
| Direct verse pings between friends | Yes | Yes (with the invited friend) | Sharing a verse via the friend-invite feature | Yes |

## Device / other identifiers

| Type | Collected? | Shared? | Purpose | Optional? |
|---|---|---|---|---|
| Device or other IDs | Yes | No | `Device` model records user-agent + first-seen for the security page ("perangkat terhubung") | No |
| IP address | Yes | No | Recorded on login events (`LoginEvent`) for security review and rate limiting | No |
| Push notification tokens | Yes | Shared with Google (FCM) / Apple (APNs) / Mozilla (autopush) as inherent to the Web Push protocol | Delivering prayer reminders and the daily verse | Yes (users can decline notifications) |

## Data types NOT collected

Explicitly declare "not collected" for everything below so the reviewer sees an intentional answer:

- Location (precise or approximate)
- Photos or videos
- Voice or sound recordings
- Health & fitness data (heart rate, workouts)
- Contacts
- Calendar events
- Files & docs
- Payment info
- Credit info
- Racial / ethnic info
- Political / union / trade info
- Sexual orientation

## Security practices

- **Data encrypted in transit**: Yes (HTTPS + HSTS).
- **Data encrypted at rest**: Yes (Supabase Postgres default encryption).
- **User can request deletion**: Yes (see above).
- **Committed to Play Families Policy**: Not applicable — app is not directed at children under 13. Age rating claim is Everyone 13+.
- **Independent security review**: Not yet. If you engage one, list it.

## Third parties that receive data

- **Supabase** — hosts the database (all user data, encrypted at rest).
- **Vercel** — hosts the app runtime; may briefly hold request bodies in edge caches for response construction; no persistent copy.
- **Resend** — transactional email transport (email address + message body for password reset).
- **OpenRouter** — AI Pastor forwards the user's chat message to the selected LLM upstream. Message body only, no user identifier.
- **Sentry** (if `SENTRY_DSN` is set) — error stack traces, which may include partial URLs; no bodies. Sentry is configured to strip PII.
- **Google/Apple/Mozilla push services** — inherent to Web Push delivery.

All of these are listed as sub-processors in the Privacy Policy.

## Sample screenshots to attach

Reviewer wants proof the delete-account and data-export flows work as described. Attach two screenshots:

1. `Profil → Data & Akun` section showing both buttons.
2. The confirmation dialog for account deletion.
