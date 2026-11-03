import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import { changePhotoAction, saveNameAction } from "../actions";
import { AccountForm } from "./account-form";

vi.mock("../actions", () => ({
  changePhotoAction: vi.fn(async () => ({ status: "saved" })),
  saveNameAction: vi.fn(async () => ({ status: "saved", values: { name: "Lucía G." } })),
}));

const pngBytes = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

function renderForm() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AccountForm
        profile={{ displayName: "Lucía", email: "lucia@example.com", avatarUrl: null }}
      />
    </NextIntlClientProvider>,
  );
}

const photoInput = () => screen.getByLabelText("Change photo");

describe("AccountForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("FR-ACC-007 shows the current name and the email, which cannot be edited", () => {
    renderForm();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Lucía");
    expect(screen.getByText("lucia@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Email" })).not.toBeInTheDocument();
  });

  it("FR-ACC-007 saves a new name", async () => {
    renderForm();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Lucía G.");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(saveNameAction).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Changes saved")).toBeInTheDocument();
  });

  it("FR-ACC-007 refuses an empty name before sending it", async () => {
    renderForm();
    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Enter your name")).toBeInTheDocument();
    expect(saveNameAction).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 says so when the server could not save the name, and keeps what was typed", async () => {
    vi.mocked(saveNameAction).mockResolvedValueOnce({
      status: "failed",
      values: { name: "Lucía G." },
    });
    renderForm();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Lucía G.");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not save your name");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Lucía G.");
  });

  it("FR-ACC-007 explains that a 10 MB file is too large and does not send it", async () => {
    renderForm();
    const big = new File([pngBytes, new Uint8Array(10 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    await userEvent.upload(photoInput(), big);
    expect(await screen.findByRole("alert")).toHaveTextContent("too large");
    expect(changePhotoAction).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 explains that a PDF is not an image and does not send it", async () => {
    renderForm();
    const pdf = new File(["%PDF-1.7"], "report.pdf", { type: "application/pdf" });
    await userEvent.upload(photoInput(), pdf, { applyAccept: false });
    expect(await screen.findByRole("alert")).toHaveTextContent("not a JPEG or PNG");
    expect(changePhotoAction).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 sends a valid photo as soon as it is chosen", async () => {
    renderForm();
    await userEvent.upload(photoInput(), new File([pngBytes], "me.png", { type: "image/png" }));
    expect(await screen.findByText("Photo updated")).toBeInTheDocument();
    expect(changePhotoAction).toHaveBeenCalledTimes(1);
  });

  it("FR-ACC-007 says so when the server could not save the photo", async () => {
    vi.mocked(changePhotoAction).mockResolvedValueOnce({ status: "failed", reason: "failed" });
    renderForm();
    await userEvent.upload(photoInput(), new File([pngBytes], "me.png", { type: "image/png" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("could not save your photo");
  });
});
