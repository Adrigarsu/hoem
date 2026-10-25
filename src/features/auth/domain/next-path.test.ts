import { describe, expect, it } from "vitest";
import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("FR-ACC-001 keeps a page inside the app, with its query string", () => {
    expect(safeNextPath("/expenses?month=2026-10")).toBe("/expenses?month=2026-10");
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example",
    "/\\evil.example",
    "/%5Cevil.example",
    "javascript:alert(1)",
    "expenses",
    "",
  ])("NFR-SEC-001 sends %s to Home instead of following it", (value) => {
    expect(safeNextPath(value)).toBe("/");
  });

  it("FR-ACC-001 sends a missing value to Home", () => {
    expect(safeNextPath(null)).toBe("/");
  });

  it("FR-ACC-001 never returns to a sign-in or sign-up page", () => {
    expect(safeNextPath("/sign-in?next=/x")).toBe("/");
  });
});
