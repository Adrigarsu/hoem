import { describe, expect, it } from "vitest";
import { uuidV7 } from "./uuid-v7";

describe("uuidV7", () => {
  it("FR-ACC-007 has the version and variant of a UUID v7", () => {
    expect(uuidV7()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("FR-ACC-007 starts with the time, so ids sort by creation", () => {
    expect(uuidV7(0x0123456789ab).startsWith("01234567-89ab-7")).toBe(true);
  });
});
