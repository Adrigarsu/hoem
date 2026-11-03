import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import { SignInForm } from "./sign-in-form";

const search = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search.value),
}));

vi.mock("../actions", () => ({
  signInAction: vi.fn(async () => ({ status: "idle" })),
  resendFromSignInAction: vi.fn(async () => ({ status: "idle" })),
}));

function renderForm(query: string) {
  search.value = query;
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SignInForm />
    </NextIntlClientProvider>,
  );
}

describe("SignInForm", () => {
  it("FR-ACC-007 confirms that the account was deleted", () => {
    renderForm("deleted=1");
    expect(screen.getByRole("status")).toHaveTextContent("Your account has been deleted.");
  });

  it("FR-ACC-007 moves the focus to that message, so a screen reader reads it", () => {
    renderForm("deleted=1");
    expect(screen.getByRole("status")).toHaveFocus();
  });

  it("FR-ACC-007 says nothing about a deletion on a normal visit", () => {
    renderForm("");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("FR-ACC-007 ignores any other value in the address", () => {
    renderForm("deleted=you");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
