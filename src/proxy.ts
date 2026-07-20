import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "insecure-dev-secret-do-not-use-in-prod",
);

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

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const match = PROTECTED_PREFIXES.find((p) => pathname.startsWith(p.prefix));

  const res = NextResponse.next();

  // Security headers on every response.
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  // 'unsafe-eval' is only needed for React/Turbopack's dev-mode debugging
  // (stack trace reconstruction, HMR) and is dropped in production builds.
  const scriptSrc = process.env.NODE_ENV === "production" ? "script-src 'self' 'unsafe-inline';" : "script-src 'self' 'unsafe-inline' 'unsafe-eval';";
  res.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; ${scriptSrc} style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none';`,
  );

  if (!match) return res;

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

    const refreshedRes = NextResponse.next();
    refreshedRes.headers.set("X-Frame-Options", "DENY");
    refreshedRes.headers.set("X-Content-Type-Options", "nosniff");
    refreshedRes.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    const setCookies = refreshRes.headers.getSetCookie();
    for (const cookie of setCookies) {
      refreshedRes.headers.append("Set-Cookie", cookie);
    }
    return refreshedRes;
  }

  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET, { issuer: "livyn" });
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

    const refreshedRes = NextResponse.next();
    const setCookies = refreshRes.headers.getSetCookie();
    for (const cookie of setCookies) {
      refreshedRes.headers.append("Set-Cookie", cookie);
    }
    return refreshedRes;
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
