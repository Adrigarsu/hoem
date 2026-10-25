import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("NFR-A11Y-002 gives 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("NFR-A11Y-002 gives 1:1 for a colour on itself", () => {
    expect(contrastRatio("#1f4bff", "#1f4bff")).toBe(1);
  });

  it("NFR-A11Y-002 does not depend on the order of the colours", () => {
    expect(contrastRatio("#ffffff", "#767676")).toBe(contrastRatio("#767676", "#ffffff"));
  });

  it("NFR-A11Y-002 matches the WCAG reference value for #767676 on white", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("NFR-A11Y-002 accepts three-digit hex colours", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
  });

  it("NFR-A11Y-002 rejects a value that is not a hex colour", () => {
    expect(() => contrastRatio("rgba(0,0,0,0.5)", "#fff")).toThrow("Not a hex colour");
  });
});
