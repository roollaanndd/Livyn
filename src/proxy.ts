import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Same requiredSecret contract as src/lib/env.ts, inlined here because the
// proxy runs on the Edge runtime and cannot import "server-only" modules.
// Lazy on first request so `next build` never throws over a missing env var
// that will in fact be present at runtime.
let cachedAccessSecret: Uint8Array | null = null;
function getAccessSecret(): Uint8Array {
  if (cachedAccessSecret) return cachedAccessSecret;
  const value = process.env.JWT_ACCESS_SECRET;
  if (value && value.length > 0) {
    cachedAccessSecret = new TextEncoder().encode(value);
    return cachedAccessSecret;
  }
  if (process.env.NODE_ENV !== "production") {
    cachedAccessSecret = new TextEncoder().encode("insecure-dev-secret-do-not-use-in-prod");
    return cachedAccessSecret;
  }
  throw new Error(
    "Missing required environment variable: JWT_ACCESS_SECRET. Set it in the deployment environment; there is no safe default in production.",
  );
}

const ROLE_RANK: Record<string, number> = {
  user: 0,
  contributor: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

const PROTECTED_PREFIXES: Array<{ prefix: string; minRole: string }> = [
  { prefix: "/app", minRole: "user" },
  { prefix: "/contributor", minRole: "contributor" },
  { prefix: "/admin", minRole: "moderator" },
];

const isProd = process.env.NODE_ENV === "production";

/**
 * CSP for a Next.js app on Vercel.
 *
 * We tried nonce + 'strict-dynamic' in Phase 4. It broke every statically
 * prerendered page (including /masuk) in production: Edge middleware can
 * set headers but cannot rewrite the CDN-cached HTML body, so the nonce in
 * the CSP header never matched any script tag on the page, every script
 * was blocked, and the login button did nothing. Reverted here — Next.js
 * on Vercel does not have a clean nonce story for pre-rendered pages.
 *
 * Kept from Phase 4: base-uri, form-action, object-src, frame-ancestors,
 * font-src, connect-src wildcard for Sentry ingest, script CDN for
 * Sentry — none of these depend on request-time nonce injection.
 */
function buildCsp(): string {
  // 'unsafe-eval' only in dev (React/Turbopack HMR); dropped in production.
  const scriptSrc = isProd
    ? `script-src 'self' 'unsafe-inline' https://js.sentry-cdn.com`
    : `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com`;

  const styleSrc = "style-src 'self' 'unsafe-inline'";
  // Cover every Sentry ingest region — the DSN's host varies by the Sentry
  // organization's data residency (US, EU, .de). Limiting to us.sentry.io
  // silently blocked EU-hosted org events at the browser CSP layer.
  const connectSrc =
    "connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.eu.sentry.io https://*.ingest.de.sentry.io";

  return [
    `default-src 'self'`,
    `img-src 'self' data: https:`,
    `media-src 'self' https:`,
    scriptSrc,
    styleSrc,
    connectSrc,
    `font-src 'self' data:`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join("; ") + ";";
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProd) {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  res.headers.set("Content-Security-Policy", buildCsp());
  return res;
}

function nextWithHeaders(): NextResponse {
  return applySecurityHeaders(NextResponse.next());
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const match = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return nextWithHeaders();

  const token = req.cookies.get("livyn_at")?.value;
  const refreshToken = req.cookies.get("livyn_rt")?.value;

  if (!token) {
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const refreshUrl = new URL("/api/auth/refresh", req.url);
    const refreshRes = await fetch(refreshUrl, {
      method: "POST",
      headers: { Cookie: `livyn_rt=${refreshToken}` },
    });

    if (!refreshRes.ok) {
      const redirect = NextResponse.redirect(new URL("/", req.url));
      redirect.cookies.delete("livyn_at");
      redirect.cookies.delete("livyn_rt");
      return redirect;
    }

    const refreshedRes = nextWithHeaders();
    const setCookies = refreshRes.headers.getSetCookie();
    for (const cookie of setCookies) {
      refreshedRes.headers.append("Set-Cookie", cookie);
    }
    return refreshedRes;
  }

  try {
    const { payload } = await jwtVerify(token, getAccessSecret(), { issuer: "livyn" });
    const role = String(payload.role ?? "user");
    if ((ROLE_RANK[role] ?? 0) < (ROLE_RANK[match.minRole] ?? 0)) {
      return NextResponse.redirect(new URL("/app", req.url));
    }
  } catch {
    if (!refreshToken) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const refreshUrl = new URL("/api/auth/refresh", req.url);
    const refreshRes = await fetch(refreshUrl, {
      method: "POST",
      headers: { Cookie: `livyn_rt=${refreshToken}` },
    });

    if (!refreshRes.ok) {
      const redirect = NextResponse.redirect(new URL("/", req.url));
      redirect.cookies.delete("livyn_at");
      redirect.cookies.delete("livyn_rt");
      return redirect;
    }

    const refreshedRes = nextWithHeaders();
    const setCookies = refreshRes.headers.getSetCookie();
    for (const cookie of setCookies) {
      refreshedRes.headers.append("Set-Cookie", cookie);
    }
    return refreshedRes;
  }

  return nextWithHeaders();
}

export const config = {
  matcher: [
    // Skip static assets, image optimizer output, favicons, the manifest,
    // the service worker + workbox chunks, robots.txt and sitemap.xml —
    // headers on those don't change app behavior and running the middleware
    // there just adds latency to every asset request.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-|apple-touch-icon|sw\\.js|workbox-|robots\\.txt|sitemap\\.xml).*)",
  ],
};
