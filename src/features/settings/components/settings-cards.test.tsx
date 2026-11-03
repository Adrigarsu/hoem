import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../../messages/en.json";
import { SettingsCards } from "./settings-cards";

function renderCards() {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SettingsCards
        households={[
          { id: "0190a1b2-0000-7000-8000-000000000001", name: "Calle Mayor", type: "shared_flat" },
        ]}
        account={<p>Account form</p>}
        theme={<p>Theme form</p>}
        language={<p>Language field</p>}
        signOut={<button type="submit">Sign out</button>}
      />
    </NextIntlClientProvider>,
  );
}

describe("SettingsCards", () => {
  it.each(["Account", "Preferences", "Household", "Privacy and data"])(
    "FR-NAV-003 shows %s as a named card",
    (name) => {
      renderCards();
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    },
  );

  it("FR-ACC-007 has the account form in the Account card", () => {
    renderCards();
    const account = screen.getByRole("region", { name: "Account" });
    expect(within(account).getByText("Account form")).toBeInTheDocument();
  });

  it("FR-ACC-007 has the theme and the language in the Preferences card", () => {
    renderCards();
    const preferences = screen.getByRole("region", { name: "Preferences" });
    expect(within(preferences).getByText("Theme form")).toBeInTheDocument();
    expect(within(preferences).getByText("Language field")).toBeInTheDocument();
  });

  it("FR-NAV-003 has Sign out in the Privacy and data card, as on the screen", () => {
    renderCards();
    const privacy = screen.getByRole("region", { name: "Privacy and data" });
    expect(within(privacy).getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
