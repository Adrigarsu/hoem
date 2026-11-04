import { describe, expect, it } from "vitest";
import { linkTarget, verificationType } from "./verification-link";

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
    expect(linkTarget("email_change", "/expenses")).toBe("/settings/account");
  });

  it("FR-ACC-001 follows the safe next path after verifying a sign-up", () => {
    expect(linkTarget("email", "/expenses")).toBe("/expenses");
  });

  it("FR-ACC-001 never follows a next path to another site", () => {
    expect(linkTarget("signup", "https://evil.example")).toBe("/");
  });
});
