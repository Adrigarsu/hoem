import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormMessage } from "./form-message";

describe("FormMessage", () => {
  it("NFR-A11Y-005 announces an error with an icon and text, not colour alone", () => {
    render(<FormMessage tone="danger">E-mail or password is incorrect</FormMessage>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("E-mail or password is incorrect");
    expect(alert.querySelector("svg")).not.toBeNull();
  });

  it("NFR-A11Y-001 announces a success politely", () => {
    render(<FormMessage tone="success">Sent</FormMessage>);
    expect(screen.getByRole("status")).toHaveTextContent("Sent");
  });
});
