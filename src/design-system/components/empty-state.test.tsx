import { render, screen } from "@testing-library/react";
import { Wallet } from "lucide-react";
import Link from "next/link";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("NFR-A11Y-001 gives the state a heading and explains it", () => {
    render(
      <EmptyState
        icon={Wallet}
        title="Coming soon"
        text="Expenses is on its way."
        headingLevel={1}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Coming soon" })).toBeInTheDocument();
    expect(screen.getByText("Expenses is on its way.")).toBeInTheDocument();
  });

  it("NFR-A11Y-001 shows the action it is given", () => {
    render(
      <EmptyState
        icon={Wallet}
        title="Coming soon"
        text="Expenses is on its way."
        action={<Link href="/">Back to Home</Link>}
      />,
    );
    expect(screen.getByRole("link", { name: "Back to Home" })).toBeInTheDocument();
  });
});
