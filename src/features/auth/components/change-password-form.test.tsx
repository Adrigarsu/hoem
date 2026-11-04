import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import { changePasswordAction } from "../actions";
import { ChangePasswordForm } from "./change-password-form";

vi.mock("../actions", () => ({
  changePasswordAction: vi.fn(async () => ({ status: "changed" })),
}));

const account = { email: "lucia@example.com", pendingEmail: null, hasPassword: true };

function renderForm(hasPassword = true) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ChangePasswordForm account={{ ...account, hasPassword }} />
    </NextIntlClientProvider>,
  );
}

const field = (name: string) => screen.getByLabelText(name, { selector: "input" });
const save = () => userEvent.click(screen.getByRole("button", { name: "Save password" }));

async function fillNewPassword() {
  await userEvent.type(field("New password"), "a new passphrase");
  await userEvent.type(field("Repeat the password"), "a new passphrase");
}

describe("ChangePasswordForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("FR-ACC-007 asks for the current password when the account has one", async () => {
    renderForm();
    await fillNewPassword();
    await save();
    expect(changePasswordAction).not.toHaveBeenCalled();
    await waitFor(() => expect(field("Current password")).toHaveFocus());
  });

  it("FR-ACC-007 changes the password and says the other devices were signed out", async () => {
    renderForm();
    await userEvent.type(field("Current password"), "the old passphrase");
    await fillNewPassword();
    await save();
    expect(changePasswordAction).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Password saved. Your other devices were signed out.",
    );
  });

  it("FR-ACC-007 shows a wrong current password next to that field", async () => {
    vi.mocked(changePasswordAction).mockResolvedValueOnce({
      status: "failed",
      error: "wrongPassword",
    });
    renderForm();
    await userEvent.type(field("Current password"), "a wrong one");
    await fillNewPassword();
    await save();
    expect(field("Current password")).toHaveAccessibleDescription(
      /Your current password is incorrect/,
    );
    // Focus moves in an effect, after the server's answer is on screen.
    await waitFor(() => expect(field("Current password")).toHaveFocus());
  });

  it("FR-ACC-007 refuses a new password typed differently the second time", async () => {
    renderForm();
    await userEvent.type(field("Current password"), "the old passphrase");
    await userEvent.type(field("New password"), "a new passphrase");
    await userEvent.type(field("Repeat the password"), "another passphrase");
    await save();
    expect(changePasswordAction).not.toHaveBeenCalled();
    await waitFor(() => expect(field("Repeat the password")).toHaveFocus());
  });

  it("FR-ACC-007 lets an account without a password set one", async () => {
    renderForm(false);
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    await fillNewPassword();
    await save();
    expect(changePasswordAction).toHaveBeenCalledTimes(1);
  });
});
