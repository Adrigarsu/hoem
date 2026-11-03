import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import { deleteAccountAction } from "../actions";
import { DeleteAccount } from "./delete-account";

vi.mock("../actions", () => ({
  deleteAccountAction: vi.fn(async () => ({ status: "idle" })),
}));

const email = "lucia@example.com";
const flat = { name: "Calle Mayor 5", href: "/settings/household/1" };

function renderIt(blockers: (typeof flat)[] = []) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeleteAccount email={email} blockers={blockers} />
    </NextIntlClientProvider>,
  );
}

async function openDialog() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Delete account" }));
  return user;
}

const field = () => screen.getByRole("textbox", { name: "Your email" });
const submit = () => screen.getByRole("button", { name: "Delete my account" });

describe("DeleteAccount", () => {
  beforeEach(() => vi.clearAllMocks());

  it("FR-ACC-007 asks me to type my e-mail before deleting", async () => {
    renderIt();
    await openDialog();
    expect(screen.getByRole("dialog", { name: "Delete your account?" })).toHaveTextContent(email);
    expect(field()).toHaveValue("");
    expect(deleteAccountAction).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 explains that nothing was typed and sends nothing", async () => {
    renderIt();
    const user = await openDialog();
    await user.click(submit());
    expect(field()).toHaveAccessibleDescription(/type your email/i);
    expect(deleteAccountAction).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 explains a wrong e-mail next to the field and keeps the dialog open", async () => {
    renderIt();
    const user = await openDialog();
    await user.type(field(), "ana@example.com");
    await user.click(submit());
    expect(field()).toHaveAccessibleDescription(/does not match/i);
    expect(field()).toHaveValue("ana@example.com");
    expect(deleteAccountAction).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 sends the typed e-mail", async () => {
    renderIt();
    const user = await openDialog();
    await user.type(field(), email);
    await user.click(submit());
    const formData = vi.mocked(deleteAccountAction).mock.calls[0]?.[1];
    expect(formData?.get("confirmation")).toBe(email);
  });

  it("FR-ACC-007 says so when the account could not be deleted", async () => {
    vi.mocked(deleteAccountAction).mockResolvedValueOnce({
      status: "failed",
      values: { confirmation: email },
    });
    renderIt();
    const user = await openDialog();
    await user.type(field(), email);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not delete your account/i);
    expect(field()).toHaveValue(email);
  });

  it("FR-ACC-007 the last owner sees the households to hand over, and no way to delete", async () => {
    renderIt([flat]);
    await openDialog();
    const dialog = screen.getByRole("alertdialog", { name: "Make someone else owner first" });
    expect(within(dialog).getByRole("link", { name: "Calle Mayor 5" })).toHaveAttribute(
      "href",
      flat.href,
    );
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete my account" })).not.toBeInTheDocument();
  });

  it("FR-ACC-007 a household that gained a member meanwhile blocks it too", async () => {
    vi.mocked(deleteAccountAction).mockResolvedValueOnce({ status: "blocked", households: [flat] });
    renderIt();
    const user = await openDialog();
    await user.type(field(), email);
    await user.click(submit());
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("link", { name: "Calle Mayor 5" })).toBeInTheDocument();
  });

  it("FR-ACC-007 cancelling forgets what was typed", async () => {
    renderIt();
    const user = await openDialog();
    await user.type(field(), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Delete account" }));
    expect(field()).toHaveValue("");
  });
});
