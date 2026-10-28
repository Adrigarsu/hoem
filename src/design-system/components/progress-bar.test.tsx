import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "./progress-bar";

// The reduced-motion behaviour needs real media queries: tests/e2e/launch-screen.spec.ts.
describe("ProgressBar", () => {
  it("FR-NAV-004 is hidden from assistive technology, which hears the status text instead", () => {
    const { container } = render(<ProgressBar />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
