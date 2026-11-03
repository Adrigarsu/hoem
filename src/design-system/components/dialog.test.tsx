import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity } from "react";
import { describe, expect, it, vi } from "vitest";
import { Dialog } from "./dialog";

function renderDialog(open: boolean, onClose = vi.fn()) {
  return render(
    <Dialog
      open={open}
      onClose={onClose}
      title="Change to Family?"
      description="The new rules only apply to things created from now on."
      actions={<button onClick={onClose}>Keep Shared flat</button>}
    />,
  );
}

describe("Dialog", () => {
  it("NFR-A11Y-003 opens as a dialog named by its title and described by its text", () => {
    renderDialog(true);
    const dialog = screen.getByRole("dialog", { name: "Change to Family?" });
    expect(dialog).toHaveAccessibleDescription(
      "The new rules only apply to things created from now on.",
    );
  });

  it("NFR-A11Y-003 stays out of the page while closed", () => {
    renderDialog(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("NFR-A11Y-003 tells its owner when an action closes it", async () => {
    const onClose = vi.fn();
    renderDialog(true, onClose);
    await userEvent.click(screen.getByRole("button", { name: "Keep Shared flat" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("NFR-A11Y-003 closes when its route is kept hidden, so the next page is not left inert", () => {
    const dialog = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <Dialog open onClose={vi.fn()} title="Title" description="Text" actions={null} />
      </Activity>
    );
    const { rerender } = render(dialog("visible"));
    const element = screen.getByRole<HTMLDialogElement>("dialog", { name: "Title" });
    rerender(dialog("hidden"));
    expect(element.open).toBe(false);
  });

  it("NFR-A11Y-003 Escape can be held back while something irreversible is under way", () => {
    render(
      <Dialog
        open
        dismissible={false}
        onClose={vi.fn()}
        title="Title"
        description="Text"
        actions={null}
      />,
    );
    const cancel = new Event("cancel", { cancelable: true });
    screen.getByRole("dialog", { name: "Title" }).dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
  });

  it("NFR-A11Y-003 can interrupt as an alert dialog", () => {
    render(
      <Dialog
        open
        onClose={vi.fn()}
        role="alertdialog"
        title="This household must stay a family"
        description="Someone in it is under 14."
        actions={<button>Keep Family</button>}
      />,
    );
    expect(
      screen.getByRole("alertdialog", { name: "This household must stay a family" }),
    ).toBeInTheDocument();
  });
});
