import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastPortal, ToastSlot, ToastSlotProvider } from "./toast-slot";

describe("ToastPortal", () => {
  it("NFR-UX-002 shows a page's toast in the shell's slot, above the navigation", () => {
    render(
      <ToastSlotProvider>
        <main>
          <ToastPortal>
            <p>Marcos removed</p>
          </ToastPortal>
        </main>
        <footer>
          <ToastSlot />
        </footer>
      </ToastSlotProvider>,
    );
    expect(within(screen.getByRole("contentinfo")).getByText("Marcos removed")).toBeVisible();
    expect(within(screen.getByRole("main")).queryByText("Marcos removed")).toBeNull();
  });

  it("NFR-UX-002 shows nothing outside a shell", () => {
    render(
      <ToastPortal>
        <p>Marcos removed</p>
      </ToastPortal>,
    );
    expect(screen.queryByText("Marcos removed")).toBeNull();
  });
});
