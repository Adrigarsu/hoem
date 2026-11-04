import { describe, expect, it } from "vitest";
import { deleteAccountSchema, fieldErrors } from "./schemas";

describe("deleteAccountSchema", () => {
  it("FR-ACC-007 removes the spaces around the typed e-mail", () => {
    expect(deleteAccountSchema.parse({ confirmation: " lucia@example.com " })).toEqual({
      confirmation: "lucia@example.com",
    });
  });

  it("FR-ACC-007 asks for the e-mail when nothing was typed", () => {
    const { error } = deleteAccountSchema.safeParse({ confirmation: "  " });
    expect(fieldErrors(error)).toEqual({ confirmation: "required" });
  });
});
