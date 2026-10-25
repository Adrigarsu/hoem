import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PasswordField } from "./password-field";

describe("PasswordField", () => {
  it("NFR-A11Y-001 hides the password until the user asks to show it", async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Password" name="password" showLabel="Show password" />);
    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });
    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);

    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("NFR-A11Y-001 keeps the error linked to the input", () => {
    render(<PasswordField label="Password" name="password" showLabel="Show" error="Too short" />);
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Too short");
  });
});
