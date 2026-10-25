import { describe, expect, it, vi } from "vitest";
import { AuthFailedError } from "@/lib/errors";
import type { AuthGateway } from "./service";
import { resendVerification, signIn, signOut, signUp, verifyEmail } from "./service";

const signUpInput = {
  displayName: "Ana",
  email: "ana@example.com",
  password: "correct horse",
  confirmPassword: "correct horse",
};
const context = {
  locale: "en",
  timeZone: "Europe/Madrid",
  confirmUrl: "https://hoemapp.com/auth/confirm",
};

function gateway(overrides: Partial<AuthGateway> = {}): AuthGateway {
  return {
    signUp: vi.fn(async () => ({ error: null })),
    signInWithPassword: vi.fn(async () => ({ error: null })),
    resend: vi.fn(async () => ({ error: null })),
    verifyOtp: vi.fn(async () => ({ error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    profileLocale: vi.fn(async () => "en"),
    ...overrides,
  };
}

const refused = (code: string) => async () => ({ error: { code } });

describe("signUp", () => {
  it("FR-ACC-001 sends the name, locale and time zone as metadata and links back to the app", async () => {
    const auth = gateway();
    await signUp(auth, signUpInput, context);
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "correct horse",
      options: {
        emailRedirectTo: "https://hoemapp.com/auth/confirm",
        data: { display_name: "Ana", locale: "en", time_zone: "Europe/Madrid" },
      },
    });
  });

  it("FR-ACC-001 never sends the repeated password", async () => {
    const auth = gateway();
    await signUp(auth, signUpInput, context);
    expect(JSON.stringify(vi.mocked(auth.signUp).mock.calls)).not.toContain("confirmPassword");
  });

  it("FR-ACC-001 maps a refusal to a message key", async () => {
    const auth = gateway({ signUp: refused("weak_password") });
    await expect(signUp(auth, signUpInput, context)).rejects.toMatchObject({
      reason: "weakPassword",
    });
  });

  it("NFR-SEC-003 never puts the password in an error", async () => {
    const auth = gateway({ signUp: refused("unexpected_failure") });
    const error = await signUp(auth, signUpInput, context).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AuthFailedError);
    expect(JSON.stringify(error) + String(error)).not.toContain("correct horse");
  });
});

describe("signIn", () => {
  const credentials = { email: "ana@example.com", password: "correct horse" };

  it("FR-ACC-001 signs in and returns the locale saved in the profile", async () => {
    const auth = gateway({ profileLocale: async () => "en" });
    await expect(signIn(auth, credentials)).resolves.toEqual({ locale: "en" });
    expect(auth.signInWithPassword).toHaveBeenCalledWith(credentials);
  });

  it("FR-ACC-001 says the e-mail or password is incorrect without saying which", async () => {
    const auth = gateway({ signInWithPassword: refused("invalid_credentials") });
    await expect(signIn(auth, credentials)).rejects.toMatchObject({ reason: "invalidCredentials" });
  });

  it("FR-ACC-001 tells an unverified user to verify the e-mail first", async () => {
    const auth = gateway({ signInWithPassword: refused("email_not_confirmed") });
    await expect(signIn(auth, credentials)).rejects.toMatchObject({ reason: "emailNotConfirmed" });
  });

  it("FR-ACC-001 does not read the profile when sign-in fails", async () => {
    const auth = gateway({ signInWithPassword: refused("invalid_credentials") });
    await signIn(auth, credentials).catch(() => undefined);
    expect(auth.profileLocale).not.toHaveBeenCalled();
  });
});

describe("resendVerification", () => {
  it("FR-ACC-001 sends the verification e-mail again with the same link", async () => {
    const auth = gateway();
    await resendVerification(auth, "ana@example.com", context.confirmUrl);
    expect(auth.resend).toHaveBeenCalledWith({
      type: "signup",
      email: "ana@example.com",
      options: { emailRedirectTo: context.confirmUrl },
    });
  });

  it("FR-ACC-001 reports a rate limit on resending", async () => {
    const auth = gateway({ resend: refused("over_email_send_rate_limit") });
    await expect(resendVerification(auth, "ana@example.com", "x")).rejects.toMatchObject({
      reason: "rateLimited",
    });
  });
});

describe("verifyEmail", () => {
  it("FR-ACC-001 verifies the token from the e-mail link and returns the profile locale", async () => {
    const auth = gateway();
    await expect(verifyEmail(auth, "hash", "email")).resolves.toEqual({ locale: "en" });
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "hash", type: "email" });
  });

  it("FR-ACC-001 rejects an expired or reused link", async () => {
    const auth = gateway({ verifyOtp: refused("otp_expired") });
    await expect(verifyEmail(auth, "hash", "email")).rejects.toMatchObject({
      reason: "linkExpired",
    });
  });
});

describe("signOut", () => {
  it("FR-ACC-001 ends the session", async () => {
    const auth = gateway();
    await signOut(auth);
    expect(auth.signOut).toHaveBeenCalled();
  });
});
