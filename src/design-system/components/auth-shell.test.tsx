import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  it("NFR-A11Y-001 puts the page in the only main landmark and the brand panel outside it", () => {
    render(
      <AuthShell panel={<p>Your home, organised together.</p>}>
        <h1>Sign in</h1>
      </AuthShell>,
    );
    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 1, name: "Sign in" })).toBeInTheDocument();
    expect(within(main).queryByText("Your home, organised together.")).toBeNull();
    expect(screen.getByText("Your home, organised together.")).toBeInTheDocument();
  });
});
