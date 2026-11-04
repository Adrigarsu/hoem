import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import { changeEmailAction } from "../actions";
import type { Account } from "../service";
import { EmailForm } from "./email-form";

vi.mock("../actions", () => ({
  changeEmailAction: vi.fn(async () => ({
    status: "sent",
    values: { email: "lucia.new@example.com" },
  })),
}));

const account: Account = { email: "lucia@example.com", pendingEmail: null, hasPassword: true };

function renderForm(overrides: Partial<Account> = {}) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EmailForm account={{ ...account, ...overrides }} passwordHref="/settings/password" />
    </NextIntlClientProvider>,
  );
}

const emailField = () => screen.getByRole("textbox", { name: "Email" });

describe("EmailForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("FR-ACC-007 shows the current email in an editable field", () => {
    renderForm();
    expect(emailField()).toHaveValue("lucia@example.com");
  });

  it("FR-ACC-007 says where the link went and keeps the current email until it is opened", async () => {
    renderForm();
    await userEvent.clear(emailField());
    await userEvent.type(emailField(), "lucia.new@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Change email" }));
    expect(changeEmailAction).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(
        "We sent a link to lucia.new@example.com. Your email changes once you open it.",
      ),
    ).toBeInTheDocument();
    expect(emailField()).toHaveValue("lucia@example.com");
  });

  it("FR-ACC-007 refuses something that is not an email without sending it", async () => {
    renderForm();
    await userEvent.clear(emailField());
    await userEvent.type(emailField(), "lucia");
    await userEvent.click(screen.getByRole("button", { name: "Change email" }));
    expect(changeEmailAction).not.toHaveBeenCalled();
    expect(emailField()).toHaveAccessibleDescription(
      /Enter an email address like name@example.com/,
    );
    expect(emailField()).toHaveFocus();
  });

  it("FR-ACC-007 reminds which new email is waiting for confirmation", () => {
    renderForm({ pendingEmail: "lucia.new@example.com" });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Waiting for you to confirm lucia.new@example.com. Open the link we sent there.",
    );
  });

  it("FR-ACC-007 links to Change password when the account has one", () => {
    renderForm();
    expect(screen.getByRole("link", { name: "Change password" })).toHaveAttribute(
      "href",
      "/settings/password",
    );
  });

  it("FR-ACC-007 links to Set a password when the account has none", () => {
    renderForm({ hasPassword: false });
    expect(screen.getByRole("link", { name: "Set a password" })).toBeInTheDocument();
  });
});
