import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localeFromAcceptLanguage, type Locale } from "./config";
import { createTranslator, getDictionary, type TFunction } from "./translate";

/** Resolution order: explicit cookie → Accept-Language → Indonesian.
 *
 * The signed-in user's stored `language` is written into the cookie at login
 * and whenever they change it, so this stays a cookie read — no DB round trip
 * on every server component. */
export const getLocale = cache(async (): Promise<Locale> => {
  const store = await cookies();
  const fromCookie = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  try {
    const h = await headers();
    return localeFromAcceptLanguage(h.get("accept-language"));
  } catch {
    return DEFAULT_LOCALE;
  }
});

/** Server-side translator for the current request. */
export const getT = cache(async (): Promise<TFunction> => {
  return createTranslator(await getLocale());
});

export const getDict = cache(async () => {
  return getDictionary(await getLocale());
});

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Called at login so a member's stored language follows them to a new device,
 * where no cookie exists yet. Only valid inside route handlers/server actions. */
export async function setLocaleCookie(locale: Locale) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
}
