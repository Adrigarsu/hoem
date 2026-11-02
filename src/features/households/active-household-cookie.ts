import "server-only";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { requestOrigin } from "@/lib/request-origin";

const cookieName = "hoem-household";

// The household chosen in the switcher (FR-ACC-004), on this device. HttpOnly like the session
// (ADR-016). Kept after signing out, so it is still active on the next sign-in: it is only a
// preference, and the service checks membership every time it reads it.
export async function rememberActiveHousehold(householdId: string) {
  const origin = requestOrigin(await headers());
  (await cookies()).set(cookieName, householdId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: origin.startsWith("https:"),
    maxAge: 60 * 60 * 24 * 365,
  });
}

// Anything but a household id is ignored, as if no household had been chosen.
export async function chosenHousehold(): Promise<string | null> {
  const parsed = z.uuid().safeParse((await cookies()).get(cookieName)?.value);
  return parsed.success ? parsed.data : null;
}
