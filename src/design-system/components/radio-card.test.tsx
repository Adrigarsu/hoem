import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RadioCard } from "./radio-card";

describe("RadioCard", () => {
  it("NFR-A11Y-003 is a radio named by its title and described by its text", () => {
    render(
      <RadioCard name="type" value="family" title="Family" description="Parents and children" />,
    );
    expect(screen.getByRole("radio", { name: /Family/ })).toHaveAttribute("value", "family");
  });

  it("NFR-A11Y-004 selects the choice when any part of the card is pressed", async () => {
    render(
      <RadioCard name="type" value="family" title="Family" description="Parents and children" />,
    );
    await userEvent.click(screen.getByText("Parents and children"));
    expect(screen.getByRole("radio", { name: /Family/ })).toBeChecked();
  });
});
