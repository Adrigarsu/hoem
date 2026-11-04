import { safeNextPath } from "./next-path";

// The links Supabase e-mails that /auth/confirm verifies. The reset link has its own page, which
// verifies the token only when the new password is sent (FR-ACC-008).
const verificationTypes = ["email", "signup", "email_change"] as const;

export type VerificationType = (typeof verificationTypes)[number];

export function verificationType(value: string | null): VerificationType | null {
  return verificationTypes.find((type) => type === value) ?? null;
}

// A new e-mail is confirmed from Account settings, so the link goes back there to show it
// (FR-ACC-007). Its path comes from the settings feature, which owns it.
export function linkTarget(type: VerificationType, next: string | null, accountSettings: string) {
  return type === "email_change" ? accountSettings : safeNextPath(next);
}

export type LinkFailure = "linkExpired" | "generic";

// Someone changing their e-mail is usually signed in, and sign-in would send them Home without the
// reason, so Account settings explains it instead.
export function failedLinkTarget(
  type: VerificationType,
  reason: LinkFailure,
  accountSettings: string,
) {
  const page = type === "email_change" ? accountSettings : "/sign-in";
  return `${page}?error=${reason}`;
}
