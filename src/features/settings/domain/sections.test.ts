import { describe, expect, it } from "vitest";
import { settingsPaths } from "./sections";

describe("settings paths", () => {
  it.each(Object.values(settingsPaths))(
    "FR-NAV-003 keeps %s under /settings, so the profile entry stays current",
    (path) => {
      expect(path).toMatch(/^\/settings(\/|$)/);
    },
  );
});
