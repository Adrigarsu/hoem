import { render } from "@testing-library/react";
import { Mail } from "lucide-react";
import { describe, expect, it } from "vitest";
import { IconTile } from "./icon-tile";

describe("IconTile", () => {
  it("NFR-A11Y-001 is decorative, so screen readers skip it", () => {
    const { container } = render(<IconTile icon={Mail} />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
