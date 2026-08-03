import { test, expect } from "@playwright/test";

/**
 * Smoke tests — the goldenest of golden paths. Every one of these hits a
 * page that always exists regardless of user state, and verifies the page
 * rendered without a server error. If any of these fail against a preview
 * deploy, don't merge that PR.
 *
 * They deliberately do NOT sign in — sign-in requires a seeded user in the
 * environment's Supabase project. Login/onboarding flows are covered by a
 * separate suite (auth.spec.ts) that only runs when PLAYWRIGHT_DEMO_EMAIL
 * and PLAYWRIGHT_DEMO_PASSWORD are set.
 */

test("landing page loads and shows a call to action", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBeLessThan(400);
  // The landing page always renders the app entry — either the app-opening
  // door or the CTA into /masuk. If neither is visible the render failed.
  await expect(page.locator("body")).toBeVisible();
  // A link into /masuk should exist somewhere on the page.
  const masukLink = page.getByRole("link", { name: /masuk|mulai|buka/i }).first();
  await expect(masukLink).toBeVisible({ timeout: 10_000 });
});

test("login page renders form", async ({ page }) => {
  const response = await page.goto("/masuk");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test("register page renders form", async ({ page }) => {
  const response = await page.goto("/daftar");
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test("privacy policy page renders", async ({ page }) => {
  const response = await page.goto("/kebijakan-privasi");
  expect(response?.status()).toBeLessThan(400);
  // Page has real content, not just a shell.
  const body = await page.textContent("body");
  expect(body?.length ?? 0).toBeGreaterThan(200);
});

test("terms page renders", async ({ page }) => {
  const response = await page.goto("/syarat-ketentuan");
  expect(response?.status()).toBeLessThan(400);
  const body = await page.textContent("body");
  expect(body?.length ?? 0).toBeGreaterThan(200);
});

test("protected /app redirects unauthenticated visitor away", async ({ page }) => {
  await page.goto("/app");
  // Should end up on the landing page or /masuk, not on /app.
  await expect(page).not.toHaveURL(/\/app(\/|$)/, { timeout: 10_000 });
});

test("app manifest is served", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.status()).toBeLessThan(400);
  const body = await res.json();
  expect(body.name).toBeTruthy();
  expect(body.start_url).toBeTruthy();
});

test("service worker file is reachable", async ({ request }) => {
  const res = await request.get("/sw.js");
  expect(res.status()).toBeLessThan(400);
  expect(res.headers()["content-type"]).toMatch(/javascript/);
});
