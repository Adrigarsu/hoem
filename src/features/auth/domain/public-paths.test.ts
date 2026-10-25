import { describe, expect, it } from "vitest";
import { isPublicPath } from "./public-paths";

describe("isPublicPath", () => {
  it.each(["/sign-in", "/sign-up", "/auth/confirm"])(
    "FR-ACC-001 lets signed-out visitors open %s",
    (path) => {
      expect(isPublicPath(path)).toBe(true);
    },
  );

  it.each(["/", "/shopping", "/check-email", "/sign-in-later", "/authx", "/households/1/expenses"])(
    "FR-ACC-001 requires a session for %s",
    (path) => {
      expect(isPublicPath(path)).toBe(false);
    },
  );
});
