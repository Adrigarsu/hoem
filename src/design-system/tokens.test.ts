import { describe, expect, it } from "vitest";
import { colourValue, resolveColours } from "./tokens";

describe("resolveColours", () => {
  it("NFR-UX-004 resolves a token that refers to another token in each theme", () => {
    const colours = resolveColours([
      { name: "brand", value: { light: "#1f4bff", dark: "#8fb1ff" } },
      { name: "focus-ring", value: { light: "{brand}", dark: "{brand}" } },
    ]);
    expect(colours["focus-ring"]).toEqual({ light: "#1f4bff", dark: "#8fb1ff" });
  });

  it("NFR-UX-004 rejects a reference to a token that does not exist", () => {
    expect(() =>
      resolveColours([{ name: "focus-ring", value: { light: "{missing}", dark: "#000" } }]),
    ).toThrow("Unknown token reference: {missing}");
  });
});

describe("colourValue", () => {
  it("NFR-UX-004 returns the value of a design-system colour for a theme", () => {
    expect(colourValue("focus-ring", "dark")).toBe(colourValue("brand", "dark"));
  });

  it("NFR-UX-004 rejects a colour that is not a design-system token", () => {
    expect(() => colourValue("zinc-50", "light")).toThrow("Unknown colour token: zinc-50");
  });
});
