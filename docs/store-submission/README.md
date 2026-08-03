# Livyn — App Store & Play Store submission playbook

This directory is everything you need to take the current PWA to a listing on both stores. Nothing here changes at runtime; it's config + docs + disclosure copy.

## Overview

Livyn is deployed as a PWA on Vercel. To ship in the stores we wrap it:

- **iOS**: [Capacitor](https://capacitorjs.com/) — a thin native shell whose WebView loads the live Vercel deployment. `capacitor.config.ts` at the repo root is preconfigured. Full build/submit runbook: [`capacitor.md`](./capacitor.md).
- **Android**: [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) generating a Trusted Web Activity (TWA). Manifest lives at `android/twa-manifest.json`. Full runbook: [`bubblewrap.md`](./bubblewrap.md).

The web app itself is identical in both wrappers. That means:

- One codebase, one deploy, one set of features.
- Store submissions are cheap after the first one (bump `appVersion`, regenerate icons if they changed, resubmit).
- Any web change is instant for every user without a store review, **except** for the shell itself (icon, splash, native permissions declaration).

## Prerequisites you must have before submitting

The code side is done. Everything below requires accounts + credentials I can't provision from here.

**Both stores:**
- A verified sending domain in Resend (so password reset emails actually deliver).
- Terms of Service and Privacy Policy live at `livyn.app/syarat-ketentuan` and `livyn.app/kebijakan-privasi` (already in the app).
- App icon in 1024×1024, splash artwork, feature graphic (Play).
- Screenshots at each store's required sizes.

**Apple:**
- Apple Developer Program membership ($99/yr).
- Mac with Xcode ≥ 15 for signing and archival.
- App Store Connect account.

**Google:**
- Google Play Console account ($25 one-time).
- A JDK 17+ and the Android SDK (Bubblewrap will bootstrap the SDK if not present).
- A Play Signing key (Play generates and manages this if you opt in).

## Sequence

1. [`env-vars.md`](./env-vars.md) — confirm every required Vercel env var is set for both Preview and Production scopes.
2. [`data-safety.md`](./data-safety.md) — fill in the Google Play Data Safety form using this doc as the source of truth.
3. [`app-privacy.md`](./app-privacy.md) — same for Apple's App Privacy nutrition labels.
4. [`capacitor.md`](./capacitor.md) — build the iOS shell, upload to TestFlight.
5. [`bubblewrap.md`](./bubblewrap.md) — build the Android AAB, upload to Play Internal Testing.
6. Fill in listing metadata (description, keywords, category, age rating).
7. Submit for review.

Realistic timeline from "everything in this repo is in your accounts" to "first store submission that survives review": ~5 working days.

## What still can't be done from code

- **Sign in with Apple** — required by App Store the moment we add any other social login (Google, Facebook). Not needed today because we're email-only. Add before adding Google sign-in.
- **In-app purchases** — if we ever monetize digital content, both stores require their own IAP with 15-30% cut. Physical goods or external services are exempt.
- **Age gating** — user community features (Circles, prayer requests) are user-generated content. Play Store will ask about UGC moderation. Have a plan for reports and moderator response times before submission.
