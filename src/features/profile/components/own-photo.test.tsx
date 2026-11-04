import { act, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { undoDelayMs } from "@/design-system";
import messages from "../../../../messages/en.json";
import { removePhotoAction } from "../actions";
import { AccountForm } from "./account-form";
import { OwnAvatar, OwnPhotoProvider, OwnPhotoToast } from "./own-photo";

vi.mock("../actions", () => ({
  changePhotoAction: vi.fn(async () => ({ status: "saved" })),
  saveNameAction: vi.fn(async () => ({ status: "idle" })),
  removePhotoAction: vi.fn(async () => ({ removed: true })),
}));

const photo = "https://storage.test/signed";

// The account card next to another avatar of the user's own, as the sidebar draws it.
function renderPage(avatarUrl: string | null = photo) {
  const view = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <OwnPhotoProvider>
        <nav aria-label="Sidebar">
          <OwnAvatar name="Lucía" src={avatarUrl} />
        </nav>
        <main>
          <AccountForm profile={{ displayName: "Lucía", avatarUrl }} email={null} />
        </main>
        <OwnPhotoToast />
      </OwnPhotoProvider>
    </NextIntlClientProvider>,
  );
  const photos = () => view.container.querySelectorAll(`img[src="${photo}"]`);
  return { ...view, photos };
}

// fireEvent rather than userEvent: user-event waits on timers, which these tests fake.
const removeButton = () => screen.queryByRole("button", { name: "Remove photo" });

function removePhoto() {
  const view = renderPage();
  fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
  return view;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Remove my profile photo", () => {
  it("FR-ACC-007 offers Remove photo only when there is a photo", () => {
    renderPage(null);
    expect(removeButton()).not.toBeInTheDocument();
  });

  it("FR-ACC-007 shows the initials everywhere at once and offers Undo", async () => {
    const { photos } = removePhoto();
    expect(photos()).toHaveLength(0);
    expect(screen.getByText("Photo removed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(removePhotoAction).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 moves focus to Change photo, so it does not fall back to the page", async () => {
    removePhoto();
    expect(removeButton()).not.toBeInTheDocument();
    expect(screen.getByLabelText("Change photo")).toHaveFocus();
  });

  it("FR-ACC-007 Undo brings the photo back and nothing is deleted", async () => {
    const { photos } = removePhoto();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(photos()).toHaveLength(2);
    expect(screen.queryByText("Photo removed")).not.toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(undoDelayMs * 2));
    expect(removePhotoAction).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 Undo returns focus to Change photo instead of dropping it", () => {
    removePhoto();
    const undo = screen.getByRole("button", { name: "Undo" });
    undo.focus();
    fireEvent.click(undo);
    expect(screen.getByLabelText("Change photo")).toHaveFocus();
  });

  it("NFR-UX-002 sends a keepalive DELETE when the page unloads during the undo", () => {
    const sent = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", sent);
    removePhoto();
    act(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(sent).toHaveBeenCalledWith("/api/v1/profile/avatar", {
      method: "DELETE",
      keepalive: true,
    });
    expect(removePhotoAction).not.toHaveBeenCalled();
    // Back from the browser's page cache, Undo must not be offered for a photo already deleted.
    expect(screen.queryByText("Photo removed")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("FR-ACC-007 deletes the photo for real once the 5 seconds have passed", async () => {
    removePhoto();
    await act(() => vi.advanceTimersByTimeAsync(undoDelayMs));
    expect(removePhotoAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Photo removed")).not.toBeInTheDocument();
  });

  it("FR-ACC-007 waits while the pointer is on the message", async () => {
    removePhoto();
    fireEvent.mouseEnter(screen.getByText("Photo removed"));
    await act(() => vi.advanceTimersByTimeAsync(undoDelayMs * 2));
    expect(removePhotoAction).not.toHaveBeenCalled();
    fireEvent.mouseLeave(screen.getByText("Photo removed"));
    await act(() => vi.advanceTimersByTimeAsync(undoDelayMs));
    expect(removePhotoAction).toHaveBeenCalledTimes(1);
  });

  it("FR-ACC-007 brings the photo back and says so when it could not be removed", async () => {
    vi.mocked(removePhotoAction).mockResolvedValueOnce({ removed: false });
    const { photos } = removePhoto();
    await act(() => vi.advanceTimersByTimeAsync(undoDelayMs));
    expect(screen.getByRole("alert")).toHaveTextContent("could not remove your photo");
    expect(photos()).toHaveLength(2);
  });
});
