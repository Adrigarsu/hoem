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

  it("FR-ACC-007 draws the photo over the initials, which show if it fails to load", () => {
    const { container } = render(<Avatar name="Lucía" src="https://storage.test/signed" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "https://storage.test/signed");
    expect(container).toHaveTextContent("L");
  });

  it("FR-ACC-007 has no image without a photo", () => {
    const { container } = render(<Avatar name="Lucía" src={null} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("NFR-A11Y-001 is decorative: the control around it carries the name", () => {
    const { container } = render(<Avatar name="Lucía" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
