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
  verifyOtp(params: { token_hash: string; type: VerificationType }): AuthResult;
  signOut(): AuthResult;
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
