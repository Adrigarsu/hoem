import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Bell } from "lucide-react";
import { describe, expect, it } from "vitest";
import { IconButton } from "./icon-button";

describe("IconButton", () => {
  it("NFR-A11Y-004 is named by its label", () => {
    render(<IconButton icon={Bell} label="Notifications" />);
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
  });

  it("NFR-A11Y-004 is a link when it goes somewhere", () => {
    render(<IconButton icon={Bell} label="Notifications" href="/notifications" />);
    expect(screen.getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "href",
      "/notifications",
    );
  });

  it("NFR-A11Y-004 shows its label as a tooltip on hover", async () => {
    const user = userEvent.setup();
    render(<IconButton icon={Bell} label="Notifications" />);

    await user.hover(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.getByText("Notifications")).toBeVisible();
  });

  it("NFR-A11Y-004 shows its label as a tooltip on keyboard focus", async () => {
    const user = userEvent.setup();
    render(<IconButton icon={Bell} label="Notifications" />);

    await user.tab();

    expect(screen.getByText("Notifications")).toBeVisible();
  });

  it("NFR-A11Y-004 hides the tooltip on Escape without moving focus", async () => {
    const user = userEvent.setup();
    render(<IconButton icon={Bell} label="Notifications" />);
    await user.tab();

    await user.keyboard("{Escape}");

    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toHaveFocus();
  });

  it("NFR-A11Y-004 hides a tooltip opened by hover on Escape, wherever focus is", async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="Elsewhere" />
        <IconButton icon={Bell} label="Notifications" />
      </>,
    );
    await user.click(screen.getByRole("textbox", { name: "Elsewhere" }));
    await user.hover(screen.getByRole("button", { name: "Notifications" }));

    await user.keyboard("{Escape}");

    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });

  it("NFR-A11Y-004 hides the tooltip when the pointer leaves", async () => {
    const user = userEvent.setup();
    render(<IconButton icon={Bell} label="Notifications" />);
    const button = screen.getByRole("button", { name: "Notifications" });
    await user.hover(button);

    await user.unhover(button);

    expect(screen.queryByText("Notifications")).not.toBeInTheDocument();
  });
});
