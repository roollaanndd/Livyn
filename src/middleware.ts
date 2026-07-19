import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "livyn_at";
const REFRESH_COOKIE = "livyn_rt";

const PROTECTED_PATHS = ["/app", "/admin", "/contributor"];

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!isProtectedPath(pathname)) return NextResponse.next();

  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;

  if (accessToken) return NextResponse.next();

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/masuk", req.url));
  }

  const refreshUrl = new URL("/api/auth/refresh", req.url);
  const refreshRes = await fetch(refreshUrl, {
    method: "POST",
    headers: { Cookie: `${REFRESH_COOKIE}=${refreshToken}` },
  });

  if (!refreshRes.ok) {
    const response = NextResponse.redirect(new URL("/masuk", req.url));
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const response = NextResponse.next();
  const setCookies = refreshRes.headers.getSetCookie();
  for (const cookie of setCookies) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/contributor/:path*"],
};
