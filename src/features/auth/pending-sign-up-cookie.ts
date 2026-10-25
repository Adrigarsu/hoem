import "server-only";
import { cookies, headers } from "next/headers";
import { requestOrigin } from "@/lib/request-origin";
import { readPendingSignUp, type PendingSignUp } from "./schemas";

const cookieName = "hoem-pending-sign-up";
// As long as the verification link works (otp_expiry in supabase/config.toml).
const maxAgeSeconds = 60 * 60;

// The address Check your inbox shows. A short-lived HttpOnly cookie instead of the URL, so the
// address stays out of the browser history, server logs and Referer headers.
export async function rememberPendingSignUp(pending: PendingSignUp) {
  const origin = requestOrigin(await headers());
  (await cookies()).set(cookieName, JSON.stringify(pending), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: origin.startsWith("https:"),
    maxAge: maxAgeSeconds,
  });
}

export async function pendingSignUp(): Promise<PendingSignUp | null> {
  return readPendingSignUp((await cookies()).get(cookieName)?.value);
}
