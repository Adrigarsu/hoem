import type { CookieOptionsWithName } from "@supabase/ssr";

// NFR-SEC-004 (ADR-016): session cookies are HttpOnly, so no script in the page can read the
// tokens, and SameSite=Lax. Secure is dropped only on a plain-http origin (the local E2E server),
// where browsers would discard a Secure cookie.
export function authCookieOptions(origin: string): CookieOptionsWithName {
  return { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https:"), path: "/" };
}
