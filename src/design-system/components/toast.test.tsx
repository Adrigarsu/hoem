import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toast } from "./toast";

describe("Toast", () => {
  it("NFR-A11Y-001 keeps its live regions in the page while empty, so a new message is announced", () => {
    render(<Toast message={null} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("alert")).toBeEmptyDOMElement();
  });

  it("NFR-UX-002 announces a confirmation in the status region", () => {
    render(<Toast message="Photo removed" />);
    expect(screen.getByRole("status")).toHaveTextContent("Photo removed");
  });

  it("NFR-A11Y-001 announces an error in the alert region", () => {
    render(<Toast message="Could not remove the photo" tone="danger" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not remove the photo");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("NFR-UX-002 calls the action from its button", async () => {
    const undo = vi.fn();
    render(<Toast message="Photo removed" action={{ label: "Undo", onClick: undo }} />);
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("NFR-A11Y-001 pauses while the pointer or the focus is on it", async () => {
    const onPause = vi.fn();
    const onResume = vi.fn();
    render(
      <>
        <Toast
          message="Photo removed"
          action={{ label: "Undo", onClick: vi.fn() }}
          onPause={onPause}
          onResume={onResume}
        />
        <button type="button">Elsewhere</button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();
    expect(onPause).toHaveBeenCalled();
    await userEvent.tab();
    expect(onResume).toHaveBeenCalled();
  });

  it("NFR-A11Y-001 keeps the countdown paused while the focus stays after the pointer leaves", async () => {
    const onPause = vi.fn();
    const onResume = vi.fn();
    render(
      <Toast
        message="Photo removed"
        action={{ label: "Undo", onClick: vi.fn() }}
        onPause={onPause}
        onResume={onResume}
      />,
    );
    await userEvent.tab();
    await userEvent.hover(screen.getByText("Photo removed"));
    await userEvent.unhover(screen.getByText("Photo removed"));
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();
  });

  it("NFR-A11Y-003 returns focus to where it was when the toast appeared, after its action", async () => {
    function Page({ message }: { message: string | null }) {
      return (
        <>
          <button type="button">Change photo</button>
          <Toast message={message} action={{ label: "Undo", onClick: vi.fn() }} />
        </>
      );
    }
    const { rerender } = render(<Page message={null} />);
    screen.getByRole("button", { name: "Change photo" }).focus();
    rerender(<Page message="Photo removed" />);
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("button", { name: "Change photo" })).toHaveFocus();
  });
});
