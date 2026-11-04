import { safeNextPath } from "./next-path";

// The links Supabase e-mails that /auth/confirm verifies. The reset link has its own page, which
// verifies the token only when the new password is sent (FR-ACC-008).
const verificationTypes = ["email", "signup", "email_change"] as const;

export type VerificationType = (typeof verificationTypes)[number];

export function verificationType(value: string | null): VerificationType | null {
  return verificationTypes.find((type) => type === value) ?? null;
}

// A new e-mail is confirmed from Account settings, so the link goes back there to show it
// (FR-ACC-007; settingsPaths.account in the settings feature).
const accountSettings = "/settings/account";

export function linkTarget(type: VerificationType, next: string | null): string {
  return type === "email_change" ? accountSettings : safeNextPath(next);
}
