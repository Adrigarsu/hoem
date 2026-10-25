import { describe, expect, it } from "vitest";
import { authErrorKey } from "./auth-errors";

describe("authErrorKey", () => {
  it("FR-ACC-001 gives one message for a wrong e-mail or a wrong password", () => {
    expect(authErrorKey("invalid_credentials")).toBe("invalidCredentials");
  });

  it("FR-ACC-001 tells an unverified user to verify first", () => {
    expect(authErrorKey("email_not_confirmed")).toBe("emailNotConfirmed");
  });

  it.each(["over_email_send_rate_limit", "over_request_rate_limit"])(
    "FR-ACC-001 explains a rate limit (%s)",
    (code) => {
      expect(authErrorKey(code)).toBe("rateLimited");
    },
  );

  it("FR-ACC-001 explains that a verification link expired or was already used", () => {
    expect(authErrorKey("otp_expired")).toBe("linkExpired");
  });

  it("FR-ACC-001 explains a password the provider rejects", () => {
    expect(authErrorKey("weak_password")).toBe("weakPassword");
  });

  it.each(["unexpected_failure", undefined])(
    "FR-ACC-001 falls back to a generic message for %s",
    (code) => {
      expect(authErrorKey(code)).toBe("generic");
    },
  );
});
