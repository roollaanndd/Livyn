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
 * Generates a fresh per-request nonce so the CSP can allow specific inline
 * scripts (Next.js hydration bootstrap, framework runtime injections) without
 * blanket 'unsafe-inline'. Next.js reads the nonce from the `x-nonce`
 * request header and applies it to script tags it emits — see
 * https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildCsp(nonce: string): string {
  // Script sources:
  //   - 'self' for our own hashed bundles.
  //   - Nonce for Next.js's inline hydration script.
  //   - 'strict-dynamic' delegates trust to scripts loaded by those trusted
  //     ones, so we don't have to enumerate every future dynamic import.
  //   - 'unsafe-eval' only in dev (React DevTools / Turbopack HMR).
  //   - Sentry's browser CDN if a DSN is configured, because @sentry/nextjs
  //     lazy-loads its worker from js.sentry-cdn.com.
  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.sentry-cdn.com`
    : `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com`;

  // Styles must stay 'unsafe-inline' — Tailwind emits inline style attributes,
  // and moving to hashes/nonces for styles breaks framer-motion animations
  // that mutate style at runtime.
  const styleSrc = "style-src 'self' 'unsafe-inline'";

  // connect-src: our own origin plus Sentry ingest (varies by DSN, allow
  // wildcard subdomain), the Google Fonts endpoint if next/font caches miss,
  // and the browser push endpoints (self-triggered fetches use 'self').
  const connectSrc = "connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io";

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

function applySecurityHeaders(res: NextResponse, nonce: string): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (isProd) {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  res.headers.set("Content-Security-Policy", buildCsp(nonce));
  return res;
}

function nextWithNonce(req: NextRequest, nonce: string): NextResponse {
  // Pass the nonce forward to the app so Next.js can stamp it onto its
  // inline hydration script. The framework picks it up from `x-nonce`
  // on the request headers we forward downstream.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  return applySecurityHeaders(res, nonce);
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const match = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  const nonce = generateNonce();

  if (!match) return nextWithNonce(req, nonce);

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

    const refreshedRes = nextWithNonce(req, nonce);
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

    const refreshedRes = nextWithNonce(req, nonce);
    const setCookies = refreshRes.headers.getSetCookie();
    for (const cookie of setCookies) {
      refreshedRes.headers.append("Set-Cookie", cookie);
    }
    return refreshedRes;
  }

  return nextWithNonce(req, nonce);
}

export const config = {
  matcher: [
    // Skip static assets, the image optimizer, favicons, and the manifest —
    // none of them render HTML that would care about the nonce, and applying
    // the middleware there just adds latency to every asset request.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-|apple-touch-icon).*)",
  ],
};
