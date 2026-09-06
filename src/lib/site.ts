/**
 * The site's own absolute origin, for canonical URLs, sitemap entries and
 * social-card image resolution.
 *
 * Order matters: an explicit NEXT_PUBLIC_SITE_URL wins (that is the escape
 * hatch for a custom domain), then Vercel's own production URL — which is set
 * on every deployment of the project, so preview builds still emit canonicals
 * pointing at production rather than at their throwaway hostname — and finally
 * localhost for `next dev`.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Livyn";
export const SITE_TAGLINE = "Faith. Every Day. Every Step.";
export const SITE_DESCRIPTION =
  "Renungan harian, Alkitab, pengingat doa, jurnal, AI Pastor, khotbah, dan circle kecil untuk bertumbuh bersama — dalam satu aplikasi yang tenang, tanpa iklan dan tanpa feed tanpa akhir.";
