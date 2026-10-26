import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tile } from "./tile";

describe("Tile", () => {
  it("FR-NAV-002 is one link named by its visible text in order", () => {
    render(
      <Tile
        module="meals"
        href="/meals"
        label="Meals"
        headline="Plan a meal"
        meta="Nothing planned for today"
      />,
    );
    expect(
      screen.getByRole("link", { name: "Meals Plan a meal Nothing planned for today" }),
    ).toHaveAttribute("href", "/meals");
  });
});
