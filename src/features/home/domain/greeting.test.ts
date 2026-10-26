import { describe, expect, it } from "vitest";
import { partOfDay } from "./greeting";

describe("partOfDay", () => {
  it.each([
    ["2026-10-26T05:00:00Z", "UTC", "morning"],
    ["2026-10-26T11:59:00Z", "UTC", "morning"],
    ["2026-10-26T12:00:00Z", "UTC", "afternoon"],
    ["2026-10-26T17:59:00Z", "UTC", "afternoon"],
    ["2026-10-26T18:00:00Z", "UTC", "evening"],
    ["2026-10-26T04:59:00Z", "UTC", "evening"],
  ] as const)("FR-DASH-001 greets at %s in %s with good %s", (instant, timeZone, expected) => {
    expect(partOfDay(new Date(instant), timeZone)).toBe(expected);
  });

  it("FR-DASH-001 uses the user's time zone, not the server's", () => {
    // 07:00 UTC is 08:00 in Madrid but 23:00 the day before in Los Angeles.
    expect(partOfDay(new Date("2026-10-26T07:00:00Z"), "America/Los_Angeles")).toBe("evening");
  });
});
