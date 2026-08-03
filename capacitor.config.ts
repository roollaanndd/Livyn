/**
 * Capacitor configuration for the Livyn iOS shell.
 *
 * The `CapacitorConfig` type comes from `@capacitor/cli`, which we don't
 * install as a devDep of the web app (it's ~20 MB, only used when someone
 * scaffolds the native shell). The shape is documented at
 * https://capacitorjs.com/docs/config so we inline the minimal type below.
 */
type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    url?: string;
    cleartext?: boolean;
    allowNavigation?: string[];
  };
  ios?: Record<string, unknown>;
  android?: Record<string, unknown>;
};

/**
 * Capacitor configuration for the Livyn iOS shell.
 *
 * Strategy: the shell is a thin WebView that loads the same production
 * Vercel deployment. That keeps the "app" identical to the browser
 * experience — one codebase, one deploy, no separate iOS build per feature.
 * We keep the ability to fall back to a bundled offline shell later, but
 * for v1 the online-first path is enough to submit and iterate.
 *
 * To activate this config after `npm install`:
 *
 *   npx cap add ios
 *   npx cap sync ios
 *   npx cap open ios
 *
 * That opens Xcode; sign the target with your Apple Developer team and
 * archive to TestFlight from there. The full submission runbook is at
 * docs/store-submission/capacitor.md.
 */
const config: CapacitorConfig = {
  appId: "app.livyn.mobile",
  appName: "Livyn",
  // webDir is only used if you also ship the web bundle inside the app.
  // Since we're pointing `server.url` at the live Vercel deployment, this
  // directory just needs to exist — Capacitor's CLI requires it before
  // `cap sync`. Point at .next/static, which every build produces.
  webDir: ".next/static",
  server: {
    // Live-load the production site inside the native shell. Update to a
    // custom domain (e.g. app.livyn.com) before submitting so the App Store
    // review reviewer sees a branded URL rather than the vercel.app subdomain.
    url: "https://livyn-six.vercel.app",
    cleartext: false,
    // Allow only our origin — nothing else the WebView loads should be
    // navigable inside the app shell.
    allowNavigation: ["livyn-six.vercel.app", "livyn.app", "*.livyn.app"],
  },
  ios: {
    contentInset: "always",
    scrollEnabled: true,
    // Match the PWA manifest so the app icon backdrop is consistent.
    backgroundColor: "#0D1512",
  },
  android: {
    backgroundColor: "#0D1512",
    allowMixedContent: false,
  },
};

export default config;
