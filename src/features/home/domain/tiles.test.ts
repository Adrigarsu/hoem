import { describe, expect, it } from "vitest";
import { homeTiles } from "./tiles";

describe("homeTiles", () => {
  it("FR-NAV-002 puts Meals, Shopping and Expenses under Your home, in the order of the screen", () => {
    expect(homeTiles).toEqual(["meals", "shopping", "expenses"]);
  });
});
