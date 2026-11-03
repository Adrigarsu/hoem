import "server-only";
import { cookies, headers } from "next/headers";
import { localeCookie } from "@/lib/i18n/locales";
import { requestOrigin } from "@/lib/request-origin";
import { rememberTheme } from "@/lib/theme/theme-cookie";
import type { ProfilePreferences } from "./service";

// Remembers the profile's language for the proxy, which picks the locale before rendering
// (ADR-015).
async function rememberLocale(locale: string | null) {
  if (!locale) return;
  const origin = requestOrigin(await headers());
  (await cookies()).set(localeCookie, locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: origin.startsWith("https:"),
    maxAge: 60 * 60 * 24 * 365,
  });
}

// Not a Server Action: only sign-in, e-mail verification and the password reset call it.
export async function rememberPreferences({ locale, theme }: ProfilePreferences) {
  await rememberLocale(locale);
  if (theme) await rememberTheme(theme);
}
