import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TextField } from "./text-field";

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
});
