"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { translate, getDictionary, type TFunction, type Dictionary } from "./translate";

type I18nValue = { locale: Locale; dict: Dictionary; t: TFunction };

const I18nContext = createContext<I18nValue | null>(null);

/** Mounted once in the app layout with the locale resolved on the server, so
 * client components never flash the wrong language on hydration. */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<I18nValue>(() => {
    const dict = getDictionary(locale);
    return { locale, dict, t: (key, vars) => translate(dict, key, vars) };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Falls back to the default locale when used outside a provider (e.g. a
 * component rendered on an auth screen), rather than throwing. */
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (ctx) return ctx;
  const dict = getDictionary(DEFAULT_LOCALE);
  return { locale: DEFAULT_LOCALE, dict, t: (key, vars) => translate(dict, key, vars) };
}

export function useT(): TFunction {
  return useI18n().t;
}
