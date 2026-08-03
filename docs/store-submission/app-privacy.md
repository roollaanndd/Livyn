# Apple App Store — App Privacy nutrition labels

Fill this into App Store Connect → App Privacy. Apple's structure differs from Play's; the underlying facts are identical.

## Overall

- **Do you or your third-party partners collect data from this app?** Yes.
- **Is data linked to the user's identity?** Yes — all data below is stored against the signed-in user's account.
- **Is data used for tracking across other companies' apps or websites?** No.

## Data Types

### Contact info

- **Name** — Linked to user, used for App Functionality (personalization) and Analytics (habit histogram)
- **Email Address** — Linked to user, used for App Functionality (login, notifications, password reset)

### User Content

- **Emails or Text Messages** — Not collected.
- **Photos or Videos** — Not collected.
- **Audio Data** — Not collected.
- **Gameplay Content** — Not applicable.
- **Customer Support** — If a user emails support, that email is stored; declare it here.
- **Other User Content** — Yes. Journal entries, prayer requests, favorite verses. Linked to user. App Functionality only.

### Identifiers

- **User ID** — Yes. Linked. App Functionality.
- **Device ID** — No advertising ID collected. `Device` model stores user-agent string only. Do not check "Advertising Identifier".

### Usage Data

- **Product Interaction** — Yes. Linked. App Functionality + Analytics (habit hour histogram powers reminder timing).
- **Advertising Data** — No.
- **Other Usage Data** — No.

### Diagnostics

- **Crash Data** — Yes (Sentry). Linked (user ID is attached to reports). Analytics + App Functionality.
- **Performance Data** — Yes (Sentry traces at 10% sample). Linked.
- **Other Diagnostic Data** — No.

### Sensitive Info

- **Sensitive Info** — Yes. Religious/spiritual practice content (prayer entries, journal entries about spiritual state). Linked. App Functionality only.

### Financial Info

- Not collected.

### Location

- Not collected.

### Health & Fitness

- Not collected.

### Contacts

- Not collected.

### Browsing History

- Not collected.

### Search History

- Not collected inside the app. In-app search (`/app/cari`) queries are not persisted.

## Privacy Manifest (`PrivacyInfo.xcprivacy`)

Required for apps built with Xcode 15+ (which any submission after May 2024 is). Capacitor's iOS shell needs a `PrivacyInfo.xcprivacy` inside the iOS project.

Declare the following required-reason APIs used by our stack:

- **User Defaults** (`NSPrivacyAccessedAPICategoryUserDefaults`) — reason `CA92.1` (access info from the same app's or group's User Defaults)
- **File Timestamp** (`NSPrivacyAccessedAPICategoryFileTimestamp`) — reason `C617.1` (inside-app usage)
- **System Boot Time** (`NSPrivacyAccessedAPICategorySystemBootTime`) — reason `35F9.1` (measure time elapsed for user-initiated events)
- **Disk Space** (`NSPrivacyAccessedAPICategoryDiskSpace`) — reason `E174.1` (display disk usage to user)

Declare tracked domains for **Sentry** if `SENTRY_DSN` is set, and any custom analytics if added later.

The template that Capacitor generates already contains stub entries — fill in the reasons above.

## Data Retention & Deletion URL

Apple asks for a URL where users can request account deletion. Point at:

```
https://livyn.app/app/profil
```

The Profil page's "Hapus Akun" button self-serves the deletion; users don't need to email us.
