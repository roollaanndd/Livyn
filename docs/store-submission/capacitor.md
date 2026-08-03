# iOS shell — Capacitor build & submit runbook

## What Capacitor does for us

Wraps the live Vercel deployment inside a native WKWebView so we can list on the App Store. The web app runs unchanged; the shell adds the native capabilities Apple demands (bundle ID, code signing, privacy manifest, splash screen, native push if we ever move off Web Push).

`capacitor.config.ts` at the repo root is preconfigured; `server.url` points at `https://livyn-six.vercel.app`. Change it to a custom domain before submission — App Store reviewers prefer branded URLs.

## Prerequisites

- macOS with **Xcode ≥ 15** and Command Line Tools.
- **Apple Developer Program** membership ($99/yr). Same Apple ID must be signed into Xcode.
- **Node ≥ 22** (matches the CI runner).
- CocoaPods: `sudo gem install cocoapods` or `brew install cocoapods`.

## One-time setup

```bash
# Install Capacitor's iOS platform packages.
npm install --save @capacitor/core @capacitor/ios
npm install --save-dev @capacitor/cli

# Scaffold the iOS project. Creates ./ios/App/
npx cap add ios

# Copy web bundle references into the iOS project.
npx cap sync ios
```

`.gitignore` already excludes `.next/` and `node_modules/`; commit the generated `ios/` directory so the shell config is tracked.

Open the project in Xcode:

```bash
npx cap open ios
```

In Xcode:

1. Select the `App` target.
2. **Signing & Capabilities** → Team: your Apple Developer team. Bundle ID: `app.livyn.mobile` (matches `capacitor.config.ts`). Automatic signing on.
3. **Capabilities** → add:
    - **Push Notifications** (only if you migrate to native push later; web push runs in the WebView already).
    - **Associated Domains** with `applinks:livyn.app` (once you have a custom domain), so external links open in the app.

## Icons and splash

Replace defaults in Xcode → `Assets.xcassets`:
- `AppIcon` — 1024×1024 source, Xcode generates every downstream size.
- `Splash` — dark background matching our theme (`#0D1512`). Use the leaf logo centered.

## Privacy Manifest

Xcode will nag you for `PrivacyInfo.xcprivacy` on first archive. Copy from [`app-privacy.md`](./app-privacy.md) — the required-reason API declarations are already written up.

## TestFlight build

```bash
# From the repo root, whenever the JS bundle needs a refresh:
npx cap sync ios
```

Then in Xcode:

1. Set version to `1.0.0` and build number to `1`.
2. Product → Archive.
3. When the Organizer opens, click **Distribute App** → App Store Connect → Upload.
4. In App Store Connect → TestFlight, the build appears in ~5 min. Add internal testers to try it before submitting for external review.

## App Store submission

1. App Store Connect → **My Apps** → **+** → New App.
2. Bundle ID: `app.livyn.mobile`. SKU: `livyn-ios`. Primary language: Indonesian.
3. **App Privacy**: fill from [`app-privacy.md`](./app-privacy.md).
4. **Pricing**: Free.
5. **App Information**:
    - Category: Lifestyle (Primary), Reference (Secondary).
    - Age Rating: 12+ (User-Generated Content: Yes, infrequent/mild).
    - Content Rights: no third-party content requires disclosure.
6. **App Store**:
    - Screenshots: iPhone 6.7" and iPhone 6.5" required. iPad optional (we're iPhone-first).
    - Description: pull from the landing page copy.
    - Keywords: `renungan, alkitab, doa, kekristenan, rohani, pastor, ai`
    - Support URL: `https://livyn.app`
    - Marketing URL: `https://livyn.app`
    - Version release: manually.
7. Attach the TestFlight build, submit for review.

## Common review rejections (and pre-emptions)

- **"App requires an account before showing content"** — Landing page and the entry to `/masuk` are public, so this doesn't apply. If a reviewer complains, remind them the landing page at `/` is publicly browsable.
- **"No account deletion path"** — Show them `Profil → Data & Akun → Hapus Akun`.
- **"Password reset doesn't work"** — Set `RESEND_API_KEY` and `EMAIL_FROM` in production Vercel env; the reviewer will test.
- **"WebView-only app is thin"** — App Store discourages pure WebView wrappers. We're borderline; if rejected on 4.2 (minimum functionality), consider adding a small native feature (native share sheet integration for verse cards, native calendar for prayer reminders). Capacitor makes both easy.
