import "server-only";
import { cookies, headers } from "next/headers";
import { localeCookie } from "@/lib/i18n/locales";
import { requestOrigin } from "@/lib/request-origin";

// Remembers the profile's language for the proxy, which picks the locale before rendering
// (ADR-015). Not a Server Action: only sign-in and e-mail verification call it.
export async function rememberLocale(locale: string | null) {
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
