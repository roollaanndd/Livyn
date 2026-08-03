# Android shell — Bubblewrap TWA build & submit runbook

## What Bubblewrap does for us

Generates a Trusted Web Activity (TWA) — a native Android app whose one and only screen is a Chrome Custom Tab pointing at the Livyn PWA, but with the browser chrome hidden. It's what the Play Store lists as our app.

Because it's a TWA, it inherits everything the PWA already has: service worker, push, offline shell, manifest. The only Android-specific artifacts are the app signing certificate and the "digital asset link" that proves we own the web origin.

Config is at `android/twa-manifest.json`.

## Prerequisites

- **Google Play Console** account ($25 one-time).
- **Node ≥ 22**.
- **JDK 17+**: `brew install openjdk@17` or the Adoptium tarball.
- **Android SDK**: Bubblewrap auto-installs on first run if missing.
- Bubblewrap CLI: `npm install -g @bubblewrap/cli`.

## One-time setup

```bash
cd android/

# First run initialises Bubblewrap and reads twa-manifest.json.
bubblewrap init --manifest twa-manifest.json

# It'll prompt for signing key details. Choose "Generate a new key".
# The keystore file (android.keystore) is emitted into this directory —
# treat it as a secret; losing it means you can never update the app.
# Commit an encrypted copy (git-crypt / age / sops) to the repo, or
# stash it in a password manager.
```

`bubblewrap init` produces:

- `app-release-bundle.aab.template` — the Android app bundle.
- `assetlinks.json` — must be published at `https://livyn-six.vercel.app/.well-known/assetlinks.json` for the TWA to hide the URL bar. Copy it into `/public/.well-known/assetlinks.json` in the repo.

## Publishing the asset links

Create `public/.well-known/assetlinks.json` with the content Bubblewrap generated. Redeploy Vercel. Verify at:

```
https://livyn-six.vercel.app/.well-known/assetlinks.json
```

Without this, Play will still list the app, but every launch shows the Chrome address bar — which fails the "immersive app" review criterion.

## Build the AAB

```bash
cd android/
bubblewrap build
```

Produces `app-release-bundle.aab`. That's what you upload to Play.

## Play Console submission

1. Play Console → **Create app**.
2. App name: Livyn. Default language: Indonesian. App or game: App. Free or paid: Free. Declarations: yes to policies.
3. **App content** (left sidebar):
    - **Privacy policy**: `https://livyn.app/kebijakan-privasi`
    - **App access**: "All or some functionality is restricted" → provide the demo login (email `anaktuhan@livyn.app`, password `Livyn123!`). Reviewers need this to test the app.
    - **Ads**: No.
    - **Content ratings**: complete the questionnaire → likely PEGI 12 / ESRB Teen (UGC in Circles).
    - **Target audience**: 13+.
    - **News app**: No.
    - **Data safety**: fill from [`data-safety.md`](./data-safety.md).
    - **Government app**: No.
    - **Financial features**: No.
    - **Health apps**: No (it's spiritual, not medical).
4. **Store listing**:
    - Short description (80 chars): "Renungan harian, Alkitab, doa, dan AI Pastor dalam satu aplikasi."
    - Full description: pull from landing page.
    - Screenshots (phone): min 2, up to 8. Feature graphic: 1024×500.
5. **Production** → **Create new release** → upload `app-release-bundle.aab`. Use Play App Signing (recommended — Play manages the signing key so a lost keystore doesn't lock you out).
6. Complete all "not yet started" tasks. Submit.

## Iterating

After the first submission, every code change ships instantly via Vercel (the TWA reloads the live URL). Only shell changes (icon, package version, new native permission) require rebuilding the AAB and submitting a new version.

To bump the shell version:

```bash
cd android/
# Edit twa-manifest.json — increment appVersion and appVersionCode.
bubblewrap update
bubblewrap build
```

Upload the new AAB, publish.

## Common review rejections

- **"assetlinks.json missing or wrong"** — See above. Test with https://developers.google.com/digital-asset-links/tools/generator.
- **"App is thin / web wrapper"** — Play is more permissive than Apple here. A TWA is an accepted pattern. But make sure Circles + prayer requests are visible in screenshots so the reviewer sees the community depth.
- **"No delete-account path"** — Show them the Profil → Data & Akun flow.
- **"Ambiguous consent for religious content collection"** — declare Sensitive Info in Data Safety (already covered).
