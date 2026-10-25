import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextField } from "./text-field";
import userEvent from "@testing-library/user-event";

describe("TextField", () => {
  it("NFR-A11Y-001 links the label, the help text and the error to the input", () => {
    render(<TextField label="E-mail" name="email" help="We never share it" error="Required" />);
    const input = screen.getByLabelText("E-mail");
    expect(input).toHaveAccessibleDescription("We never share it Required");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("NFR-A11Y-001 is not marked invalid without an error", () => {
    render(<TextField label="Name" name="name" />);
    expect(screen.getByLabelText("Name")).not.toHaveAttribute("aria-invalid");
  });

  it("FR-ACC-008 shows an action next to the label without changing the field's name", () => {
    render(
      <TextField
        label="Password"
        name="password"
        labelAction={<button type="button">Forgot?</button>}
      />,
    );
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Forgot?" })).toBeInTheDocument();
  });

  it("FR-ACC-008 keeps the label action after the input in the tab order", async () => {
    const user = userEvent.setup();
    render(
      <TextField
        label="Password"
        name="password"
        labelAction={<button type="button">Forgot?</button>}
      />,
    );
    await user.tab();
    expect(screen.getByLabelText("Password")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Forgot?" })).toHaveFocus();
  });
});
