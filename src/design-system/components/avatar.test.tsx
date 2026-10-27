import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar";

describe("Avatar", () => {
  it.each([
    ["Lucía", "L"],
    ["Lucía García", "LG"],
    ["  ana  maría   lópez ", "AL"],
    ["élodie", "É"],
  ])("FR-NAV-001 shows the initials of %s", (name, initials) => {
    const { container } = render(<Avatar name={name} />);
    expect(container).toHaveTextContent(initials);
  });

  it("NFR-A11Y-001 is decorative: the control around it carries the name", () => {
    const { container } = render(<Avatar name="Lucía" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
