import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * The public pages only — the ones a stranger can open and read in full. The
 * app's routes are all behind authentication, so listing them would only feed
 * crawlers a wall of redirects.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/mulai`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/masuk`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/daftar`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/syarat-ketentuan`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/kebijakan-privasi`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
