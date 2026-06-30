import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale, type Locale } from "./config";

/**
 * Read the current locale in a Server Component / Route Handler / Server Action.
 * Falls back to the default locale (zh) when the cookie is absent.
 *
 * Note: calling this opts the route into dynamic rendering (it reads cookies),
 * which is already the case for this app (DB-backed pages).
 */
export function getLocale(): Locale {
  try {
    return normalizeLocale(cookies().get(LOCALE_COOKIE)?.value);
  } catch {
    return normalizeLocale(undefined);
  }
}
