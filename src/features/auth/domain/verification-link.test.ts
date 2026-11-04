import { describe, expect, it } from "vitest";
import { failedLinkTarget, linkTarget, verificationType } from "./verification-link";

const account = "/settings/account";

describe("verificationType", () => {
  it.each(["email", "signup", "email_change"] as const)("FR-ACC-007 accepts a %s link", (type) => {
    expect(verificationType(type)).toBe(type);
  });

  it.each(["recovery", "magiclink", "", null])("FR-ACC-007 refuses a %s link", (type) => {
    expect(verificationType(type)).toBeNull();
  });
});

describe("linkTarget", () => {
  it("FR-ACC-007 opens Account settings after confirming a new e-mail", () => {
    expect(linkTarget("email_change", "/expenses", account)).toBe("/settings/account");
  });

  it("FR-ACC-001 follows the safe next path after verifying a sign-up", () => {
    expect(linkTarget("email", "/expenses", account)).toBe("/expenses");
  });

  it("FR-ACC-001 never follows a next path to another site", () => {
    expect(linkTarget("signup", "https://evil.example", account)).toBe("/");
  });
});

describe("failedLinkTarget", () => {
  it("FR-ACC-007 says on Account settings that an e-mail change link expired", () => {
    expect(failedLinkTarget("email_change", "linkExpired", account)).toBe(
      "/settings/account?error=linkExpired",
    );
  });

  it("FR-ACC-007 says on Account settings that an e-mail change link failed", () => {
    expect(failedLinkTarget("email_change", "generic", account)).toBe(
      "/settings/account?error=generic",
    );
  });

  it("FR-ACC-001 sends a failed sign-up link to sign-in with the reason", () => {
    expect(failedLinkTarget("signup", "linkExpired", account)).toBe("/sign-in?error=linkExpired");
  });
});
