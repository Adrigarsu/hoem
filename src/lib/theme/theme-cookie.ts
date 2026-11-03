import "server-only";
import { cookies, headers } from "next/headers";
import { requestOrigin } from "@/lib/request-origin";
import { themeCookie, themeCookieMaxAge, type Theme } from "./theme";

// Written on sign-in, so a new device shows the profile's theme from the first page. Not HttpOnly:
// the script in <head> reads it (ADR-018). It only ever holds one of the three theme names.
export async function rememberTheme(theme: Theme) {
  const origin = requestOrigin(await headers());
  (await cookies()).set(themeCookie, theme, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: origin.startsWith("https:"),
    maxAge: themeCookieMaxAge,
  });
}
