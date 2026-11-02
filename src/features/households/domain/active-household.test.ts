import { describe, expect, it } from "vitest";
import { pickActiveHousehold } from "./active-household";

const home = { id: "00000000-0000-7000-8000-00000000a001" };
const flat = { id: "00000000-0000-7000-8000-00000000a002" };

describe("pickActiveHousehold", () => {
  it("FR-ACC-004 keeps the household the user chose while they belong to it", () => {
    expect(pickActiveHousehold([home, flat], flat.id)).toBe(flat);
  });

  it("FR-ACC-004 falls back to the first household when the user left the chosen one", () => {
    expect(pickActiveHousehold([home, flat], "00000000-0000-7000-8000-00000000dead")).toBe(home);
  });

  it("FR-ACC-004 falls back to the first household when the user never chose one", () => {
    expect(pickActiveHousehold([home, flat], null)).toBe(home);
  });

  it("FR-ACC-004 has no active household when the user belongs to none", () => {
    expect(pickActiveHousehold([], flat.id)).toBeNull();
  });
});
