import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Livyn's end-to-end smoke tests.
 *
 * These are meant to run against a **deployed** environment (Vercel preview
 * or production), not a locally-spun-up dev server, because Livyn's data
 * plane is Supabase and setting up an isolated test DB is a separate
 * project. Point PLAYWRIGHT_BASE_URL at whatever URL you want to hit:
 *
 *   PLAYWRIGHT_BASE_URL=https://livyn-git-your-branch.vercel.app npm run test:e2e
 *
 * Locally, `npm run dev` on port 3000 satisfies the default base URL, so
 * you can also run these against a local server if you have the DB env.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-chrome",
      // Mobile-first app; test on the form factor users actually run.
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
