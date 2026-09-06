import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Only the public marketing surface is crawlable. Everything behind sign-in is
 * either redirected by src/proxy.ts or personal to one reader, so it has no
 * business in an index — and /api is machine surface, not content.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/app/", "/admin/", "/contributor/", "/onboarding", "/persetujuan"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
