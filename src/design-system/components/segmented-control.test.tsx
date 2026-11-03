import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./segmented-control";

const options = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function renderControl(onChange = vi.fn()) {
  render(
    <SegmentedControl
      label="Theme"
      name="theme"
      options={options}
      value="system"
      onChange={onChange}
    />,
  );
  return onChange;
}

describe("SegmentedControl", () => {
  it("FR-ACC-007 is a named radio group with the current choice selected", () => {
    renderControl();
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Dark" })).not.toBeChecked();
  });

  it("FR-ACC-007 reports a choice made with the pointer", async () => {
    const onChange = renderControl();
    await userEvent.click(screen.getByText("Dark"));
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("NFR-A11Y-002 moves the selection with the arrow keys", async () => {
    const onChange = renderControl();
    screen.getByRole("radio", { name: "System" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenCalledWith("light");
  });
});
