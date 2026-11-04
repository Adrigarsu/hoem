import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import { deleteAccountAction } from "../actions";
import { DeleteAccountButton, DeleteAccountProvider } from "./delete-account";

vi.mock("../actions", () => ({
  deleteAccountAction: vi.fn(async () => ({ status: "idle" })),
}));

const email = "lucia@example.com";
const flat = { name: "Calle Mayor 5", href: "/settings/household/1" };

function renderIt(blockers: (typeof flat)[] = []) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <DeleteAccountProvider email={email} blockers={blockers}>
        <DeleteAccountButton />
      </DeleteAccountProvider>
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

  it("FR-ACC-007 cannot be cancelled once the deletion is on its way", async () => {
    vi.mocked(deleteAccountAction).mockReturnValueOnce(new Promise(() => undefined));
    renderIt();
    const user = await openDialog();
    await user.type(field(), email);
    await user.click(submit());
    expect(await screen.findByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("dialog", { name: "Delete your account?" })).toBeInTheDocument();
  });

  it("FR-ACC-007 a refusal does not claim that nothing was deleted, as the photo may be gone", async () => {
    renderIt([flat]);
    await openDialog();
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Your account has not been deleted.");
  });

  it("FR-ACC-007 the buttons of every width open the same single dialog", async () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <DeleteAccountProvider email={email} blockers={[]}>
          <DeleteAccountButton />
          <DeleteAccountButton />
        </DeleteAccountProvider>
      </NextIntlClientProvider>,
    );
    const user = userEvent.setup();
    const [, second] = screen.getAllByRole("button", { name: "Delete account" });
    if (!second) throw new Error("Expected two buttons");
    await user.click(second);
    expect(screen.getByRole("dialog", { name: "Delete your account?" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox", { name: "Your email" })).toHaveLength(1);
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
