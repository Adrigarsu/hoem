import { describe, expect, it } from "vitest";
import { nameSchema, themeSchema } from "./schemas";

describe("nameSchema", () => {
  it("FR-ACC-007 trims the name", () => {
    expect(nameSchema.parse({ name: "  Lucía G.  " })).toEqual({ name: "Lucía G." });
  });

  it("FR-ACC-007 refuses an empty name", () => {
    expect(nameSchema.safeParse({ name: "   " }).error?.issues[0]?.message).toBe("required");
  });

  it("FR-ACC-007 accepts a name of 50 characters", () => {
    expect(nameSchema.safeParse({ name: "a".repeat(50) }).success).toBe(true);
  });

  it("FR-ACC-007 refuses a name over 50 characters", () => {
    expect(nameSchema.safeParse({ name: "a".repeat(51) }).error?.issues[0]?.message).toBe(
      "tooLong",
    );
  });
});

describe("themeSchema", () => {
  it("FR-ACC-007 accepts a theme the app has", () => {
    expect(themeSchema.parse({ theme: "dark" })).toEqual({ theme: "dark" });
  });

  it("FR-ACC-007 refuses a theme the app does not have", () => {
    expect(themeSchema.safeParse({ theme: "purple" }).success).toBe(false);
  });
});
