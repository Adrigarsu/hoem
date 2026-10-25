import { AuthFailedError } from "@/lib/errors";
import { authErrorKey } from "./domain/auth-errors";
import type { SignInInput, SignUpInput } from "./schemas";

// The parts of Supabase Auth this feature uses, plus the profile lookup (repository.ts), so the
// rules here are tested without a network. Passwords go straight to Supabase Auth: they are never
// stored, logged or put in an error (NFR-SEC-003).
type AuthResult = Promise<{ error: { code?: string } | null }>;

export type AuthGateway = {
  signUp(params: {
    email: string;
    password: string;
    options: { emailRedirectTo: string; data: Record<string, string> };
  }): AuthResult;
  signInWithPassword(params: { email: string; password: string }): AuthResult;
  resend(params: {
    type: "signup";
    email: string;
    options: { emailRedirectTo: string };
  }): AuthResult;
  verifyOtp(params: { token_hash: string; type: VerificationType | "recovery" }): AuthResult;
  signOut(): AuthResult;
  resetPasswordForEmail(email: string, options: { redirectTo: string }): AuthResult;
  updatePassword(password: string): AuthResult;
  signOutOthers(): AuthResult;
  profileLocale(): Promise<string | null>;
};

export type VerificationType = "email" | "signup";

type SignUpContext = { locale: string; timeZone: string; confirmUrl: string };

async function run(result: AuthResult): Promise<void> {
  const { error } = await result;
  if (error) throw new AuthFailedError(authErrorKey(error.code));
}

// For an address that already has an account, Supabase answers exactly as for a new one and
// e-mails nobody, so the form never reveals who has signed up.
export async function signUp(auth: AuthGateway, input: SignUpInput, context: SignUpContext) {
  await run(
    auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: context.confirmUrl,
        data: {
          display_name: input.displayName,
          locale: context.locale,
          time_zone: context.timeZone,
        },
      },
    }),
  );
}

export async function signIn(auth: AuthGateway, input: SignInInput) {
  await run(auth.signInWithPassword({ email: input.email, password: input.password }));
  return { locale: await auth.profileLocale() };
}

export async function resendVerification(auth: AuthGateway, email: string, confirmUrl: string) {
  await run(auth.resend({ type: "signup", email, options: { emailRedirectTo: confirmUrl } }));
}

// The link in the verification e-mail carries a one-time token hash; verifying it starts the
// session.
export async function verifyEmail(auth: AuthGateway, tokenHash: string, type: VerificationType) {
  await run(auth.verifyOtp({ token_hash: tokenHash, type }));
  return { locale: await auth.profileLocale() };
}

export async function signOut(auth: AuthGateway) {
  await run(auth.signOut());
}

// Supabase only e-mails existing accounts, so any failure while sending (an SMTP error, the
// per-address rate limit) would reveal that the account exists. Only the per-visitor rate limit
// is reported; everything else gets the same "if an account exists" answer (FR-ACC-008).
export async function requestPasswordReset(auth: AuthGateway, email: string, resetUrl: string) {
  const { error } = await auth.resetPasswordForEmail(email, { redirectTo: resetUrl });
  if (error?.code === "over_request_rate_limit") throw new AuthFailedError("rateLimited");
}

// The recovery token is verified only now, when the form is sent, so mail scanners that open the
// link cannot use it up. Verifying it signs the visitor in, which updatePassword needs.
export async function resetPassword(auth: AuthGateway, tokenHash: string, password: string) {
  const verified = await auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
  if (verified.error) {
    // A truncated or tampered token is as unusable as an expired one: offer a new link.
    const rateLimited = verified.error.code === "over_request_rate_limit";
    throw new AuthFailedError(rateLimited ? "rateLimited" : "linkExpired");
  }

  const { error } = await auth.updatePassword(password);
  // Keeping the current password is allowed (decided in #24); Supabase refuses it as a change.
  if (error && error.code !== "same_password") {
    // The token is used up; do not leave a session behind for a password that was never set.
    await auth.signOut();
    throw new AuthFailedError(authErrorKey(error.code));
  }

  // A reset often follows a stolen password, so the other sessions go. The new password is
  // already saved: a failure here must not tell the user that the reset failed.
  await auth.signOutOthers();
  return { locale: await auth.profileLocale() };
}
