import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./logo";

describe("Logo", () => {
  it("NFR-UX-004 renders the wordmark as one image with an accessible name", () => {
    render(<Logo label="HØEM" />);
    expect(screen.getByRole("img", { name: "HØEM" })).toBeInTheDocument();
  });

  it.each(["default", "on-brand"] as const)(
    "NFR-UX-004 paints the %s wordmark with tokens, never fixed colours",
    (tone) => {
      render(<Logo label="HØEM" tone={tone} />);
      const fills = [...screen.getByRole("img").querySelectorAll("path")].map((path) =>
        path.getAttribute("fill"),
      );
      expect(new Set(fills)).toEqual(new Set(["currentColor"]));
    },
  );
});
