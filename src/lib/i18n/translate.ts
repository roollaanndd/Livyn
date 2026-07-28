import { id } from "./dictionaries/id";
import { en } from "./dictionaries/en";
import type { Dictionary, TKey } from "./dictionaries/id";
import { DEFAULT_LOCALE, type Locale } from "./config";

export type { Dictionary, TKey };

const DICTIONARIES: Record<Locale, Dictionary> = { id, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export type Vars = Record<string, string | number>;

/** Resolves a "section.key" path and fills {placeholders}. Falls back to the
 * Indonesian string, then to the key itself, so a missing translation degrades
 * to readable text instead of an empty label. */
export function translate(dict: Dictionary, key: TKey, vars?: Vars): string {
  const [section, name] = key.split(".") as [keyof Dictionary, string];
  const fromLocale = (dict[section] as Record<string, string> | undefined)?.[name];
  const fromDefault = (id[section] as Record<string, string> | undefined)?.[name];
  const template = fromLocale ?? fromDefault ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, varName: string) =>
    varName in vars ? String(vars[varName]) : match,
  );
}

export type TFunction = (key: TKey, vars?: Vars) => string;

export function createTranslator(locale: Locale): TFunction {
  const dict = getDictionary(locale);
  return (key, vars) => translate(dict, key, vars);
}
