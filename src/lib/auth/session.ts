import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { ACCESS_TOKEN_TTL_SECONDS, verifyAccessToken, type AccessTokenPayload } from "./jwt";
import { REFRESH_TOKEN_TTL_DAYS } from "./tokens";

export const ACCESS_COOKIE = "livyn_at";
export const REFRESH_COOKIE = "livyn_rt";

const isProd = process.env.NODE_ENV === "production";

export async function setSessionCookies(accessToken: string, refreshToken: string) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

/** Cached per-request: reads + verifies the access token cookie. */
export const getCurrentUser = cache(async (): Promise<AccessTokenPayload | null> => {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
});
