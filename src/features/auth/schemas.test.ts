import { describe, expect, it } from "vitest";
import {
  fieldErrors,
  forgotPasswordSchema,
  readPendingSignUp,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "./schemas";

const validSignUp = {
  displayName: "Ana",
  email: "ana@example.com",
  password: "correct horse",
  confirmPassword: "correct horse",
};

function issues(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => [
    issue.path.join("."),
    "message" in issue && issue.message,
  ]);
}

describe("signUpSchema", () => {
  it("FR-ACC-001 accepts a name, an e-mail and a password typed twice", () => {
    expect(signUpSchema.safeParse(validSignUp).success).toBe(true);
  });

  it("FR-ACC-001 trims the name and the e-mail and lowercases the e-mail", () => {
    const parsed = signUpSchema.parse({
      ...validSignUp,
      displayName: "  Ana  ",
      email: " Ana@Example.COM ",
    });
    expect(parsed).toMatchObject({ displayName: "Ana", email: "ana@example.com" });
  });

  it("FR-ACC-001 requires a name", () => {
    expect(issues(signUpSchema.safeParse({ ...validSignUp, displayName: "   " }))).toEqual([
      ["displayName", "required"],
    ]);
  });

  it("FR-ACC-001 limits the name to 50 characters", () => {
    expect(issues(signUpSchema.safeParse({ ...validSignUp, displayName: "a".repeat(51) }))).toEqual(
      [["displayName", "tooLong"]],
    );
  });

  it("FR-ACC-001 rejects an invalid e-mail", () => {
    expect(issues(signUpSchema.safeParse({ ...validSignUp, email: "ana@" }))).toEqual([
      ["email", "invalidEmail"],
    ]);
  });

  it("FR-ACC-001 rejects a password shorter than 10 characters", () => {
    const short = { ...validSignUp, password: "123456789", confirmPassword: "123456789" };
    expect(issues(signUpSchema.safeParse(short))).toEqual([["password", "passwordTooShort"]]);
  });

  it("FR-ACC-001 rejects a password longer than 72 characters", () => {
    const long = "a".repeat(73);
    expect(
      issues(signUpSchema.safeParse({ ...validSignUp, password: long, confirmPassword: long })),
    ).toEqual([["password", "passwordTooLong"]]);
  });

  it("FR-ACC-001 counts the 72-byte limit in bytes, as bcrypt does", () => {
    const emoji = "🌊".repeat(25);
    expect(
      issues(signUpSchema.safeParse({ ...validSignUp, password: emoji, confirmPassword: emoji })),
    ).toEqual([["password", "passwordTooLong"]]);
  });

  it("FR-ACC-001 accepts any characters, with no composition rules", () => {
    const passphrase = "été à la plage 🌊";
    expect(
      signUpSchema.safeParse({ ...validSignUp, password: passphrase, confirmPassword: passphrase })
        .success,
    ).toBe(true);
  });

  it("FR-ACC-001 reports a mismatch on the repeated password", () => {
    expect(
      issues(signUpSchema.safeParse({ ...validSignUp, confirmPassword: "correct horsd" })),
    ).toEqual([["confirmPassword", "passwordsDoNotMatch"]]);
  });

  it("NFR-SEC-003 keeps spaces in the password exactly as typed", () => {
    const spaced = " leading and trailing ";
    expect(
      signUpSchema.parse({ ...validSignUp, password: spaced, confirmPassword: spaced }).password,
    ).toBe(spaced);
  });
});

describe("signInSchema", () => {
  it("FR-ACC-001 accepts an e-mail and a password", () => {
    expect(signInSchema.safeParse({ email: "ana@example.com", password: "x" }).success).toBe(true);
  });

  it("FR-ACC-001 does not apply the sign-up password policy when signing in", () => {
    expect(issues(signInSchema.safeParse({ email: "ana@example.com", password: "" }))).toEqual([
      ["password", "required"],
    ]);
  });
});

describe("fieldErrors", () => {
  it("FR-ACC-001 keeps the first message for each field", () => {
    const result = signUpSchema.safeParse({
      displayName: "",
      email: "nope",
      password: "short",
      confirmPassword: "short",
    });
    expect(fieldErrors(result.error)).toEqual({
      displayName: "required",
      email: "invalidEmail",
      password: "passwordTooShort",
    });
  });
});

describe("readPendingSignUp", () => {
  it("FR-ACC-001 reads the e-mail and the name saved after signing up", () => {
    const value = JSON.stringify({ email: "ana@example.com", displayName: "Ana" });
    expect(readPendingSignUp(value)).toEqual({ email: "ana@example.com", displayName: "Ana" });
  });

  it("FR-ACC-001 reads an e-mail saved without a name, after resending from sign-in", () => {
    const value = JSON.stringify({ email: "ana@example.com" });
    expect(readPendingSignUp(value)).toEqual({ email: "ana@example.com", displayName: "" });
  });

  it.each([undefined, "", "not json", JSON.stringify({ email: "not an e-mail" }), "null"])(
    "FR-ACC-001 ignores a missing or tampered value (%s)",
    (value) => {
      expect(readPendingSignUp(value)).toBeNull();
    },
  );
});

describe("forgotPasswordSchema", () => {
  it("FR-ACC-008 normalises the e-mail the link is sent to", () => {
    expect(forgotPasswordSchema.parse({ email: " Ana@Example.COM " })).toEqual({
      email: "ana@example.com",
    });
  });

  it("FR-ACC-008 rejects a malformed e-mail", () => {
    expect(issues(forgotPasswordSchema.safeParse({ email: "ana@" }))).toEqual([
      ["email", "invalidEmail"],
    ]);
  });
});

describe("resetPasswordSchema", () => {
  const validReset = {
    tokenHash: "token-hash",
    password: "a new passphrase",
    confirmPassword: "a new passphrase",
  };

  it("FR-ACC-008 accepts a new password typed twice and the link token", () => {
    expect(resetPasswordSchema.safeParse(validReset).success).toBe(true);
  });

  it("FR-ACC-008 applies the password policy to the new password", () => {
    const result = resetPasswordSchema.safeParse({
      ...validReset,
      password: "short",
      confirmPassword: "short",
    });
    expect(issues(result)).toEqual([["password", "passwordTooShort"]]);
  });

  it("FR-ACC-008 asks for the same new password twice", () => {
    const result = resetPasswordSchema.safeParse({ ...validReset, confirmPassword: "different" });
    expect(issues(result)).toEqual([["confirmPassword", "passwordsDoNotMatch"]]);
  });

  it("FR-ACC-008 rejects a reset without the link token", () => {
    const result = resetPasswordSchema.safeParse({ ...validReset, tokenHash: "" });
    expect(issues(result)).toEqual([["tokenHash", "required"]]);
  });
});
