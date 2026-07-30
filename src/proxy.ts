import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { accessTokenSecret } from "@/lib/env";
import { rankOf, type Role } from "@/lib/auth/rbac";

const PROTECTED_PREFIXES: Array<{ prefix: string; minRole: Role }> = [
  { prefix: "/app", minRole: "user" },
  { prefix: "/contributor", minRole: "contributor" },
  { prefix: "/admin", minRole: "moderator" },
];

/**
 * Builds the CSP for one request.
 *
 * Scripts are allowed by nonce plus 'strict-dynamic' rather than by
 * 'unsafe-inline'. With 'unsafe-inline' any injected `<script>` on the page runs,
 * which leaves CSP contributing almost nothing against XSS. Next.js reads the
 * nonce out of the request's CSP header during render and stamps it onto its own
 * framework and bundle tags, so no markup here needs to know about it.
 *
 * Styles still permit 'unsafe-inline': Tailwind and framer-motion both write
 * element style attributes, and style-src cannot be locked down without dropping
 * animation. 'unsafe-eval' is dev-only — React uses eval there to rebuild server
 * stack traces in the browser.
 */
function contentSecurityPolicy(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function applySecurityHeaders(res: NextResponse, csp: string) {
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  return res;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isDev = process.env.NODE_ENV !== "production";

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = contentSecurityPolicy(nonce, isDev);

  // The nonce reaches the renderer through the *request* headers; Next.js parses
  // it from the CSP header there. x-nonce is for server components that render a
  // <Script> of their own.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const nextResponse = () =>
    applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), csp);
  const redirectTo = (path: string) =>
    applySecurityHeaders(NextResponse.redirect(new URL(path, req.url)), csp);

  const match = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));
  if (!match) return nextResponse();

  const token = req.cookies.get("livyn_at")?.value;
  const refreshToken = req.cookies.get("livyn_rt")?.value;

  /**
   * Trades an unexpired refresh cookie for a new pair. Every response out of
   * here carries the security headers too — the old code rebuilt a bare
   * NextResponse on this path, so a session refresh silently served the page
   * with no CSP and no HSTS.
   */
  const refreshSession = async () => {
    if (!refreshToken) return redirectTo("/");

    const refreshRes = await fetch(new URL("/api/auth/refresh", req.url), {
      method: "POST",
      headers: { Cookie: `livyn_rt=${refreshToken}` },
    });

    if (!refreshRes.ok) {
      const redirect = redirectTo("/");
      redirect.cookies.delete("livyn_at");
      redirect.cookies.delete("livyn_rt");
      return redirect;
    }

    const refreshed = nextResponse();
    for (const cookie of refreshRes.headers.getSetCookie()) {
      refreshed.headers.append("Set-Cookie", cookie);
    }
    return refreshed;
  };

  if (!token) return refreshSession();

  try {
    const { payload } = await jwtVerify(token, accessTokenSecret(), {
      issuer: "livyn",
      algorithms: ["HS256"],
    });
    if (rankOf(String(payload.role ?? "user")) < rankOf(match.minRole)) {
      return redirectTo("/app");
    }
  } catch {
    return refreshSession();
  }

  return nextResponse();
}

export const config = {
  // Prefetches and immutable static assets are skipped: they need no nonce, and
  // a per-request CSP on a cacheable asset only defeats caching.
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|sw.js|icon-.*\\.png|apple-touch-icon.png).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
