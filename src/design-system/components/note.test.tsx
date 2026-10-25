import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Note } from "./note";

describe("Note", () => {
  it("NFR-A11Y-001 is read in place with an icon, without interrupting like an alert", () => {
    render(<Note>The link works for 1 hour.</Note>);
    const note = screen.getByText("The link works for 1 hour.").closest("p");
    expect(note?.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
