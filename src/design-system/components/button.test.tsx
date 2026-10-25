import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, buttonClassName } from "./button";

describe("Button", () => {
  it("NFR-A11Y-003 is a native button that does not submit forms unless asked", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it("NFR-A11Y-003 stays focusable and announces that it is busy while pending", () => {
    render(<Button pending>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
  });

  it("NFR-A11Y-003 says what is happening while pending", () => {
    render(
      <Button pending pendingLabel="Signing in…">
        Sign in
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Signing in…" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });

  it("NFR-A11Y-003 keeps its own label when it is not pending", () => {
    render(<Button pendingLabel="Signing in…">Sign in</Button>);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("NFR-UX-004 lets a link share the button styles", () => {
    render(<Button variant="primary">Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      ...buttonClassName("primary").split(" "),
    );
  });
});
