import type { Locale } from "@/lib/scoring/types";

export type { Locale };

export const LOCALES: readonly Locale[] = ["zh", "en"] as const;
export const DEFAULT_LOCALE: Locale = "zh";

/** Cookie that persists the visitor's language choice. */
export const LOCALE_COOKIE = "lang";
/** ~1 year. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** HTML lang attribute value for each locale. */
export const HTML_LANG: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en",
};

export function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en";
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Pick zh/en from a {zh,en} pair. Handy for one-off inline strings. */
export function pick(locale: Locale, zh: string, en: string): string {
  return locale === "en" ? en : zh;
}
