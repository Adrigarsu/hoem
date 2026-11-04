import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import type { Theme } from "@/lib/theme/theme";
import messages from "../../../../messages/en.json";
import { SettingsMenu } from "./settings-menu";

const flat = { id: "0190a1b2-0000-7000-8000-000000000001", name: "Calle Mayor flat" };

// jsdom and browsers space the hidden comma between a label and its value differently.
const lucia = {
  displayName: "Lucía Fernández",
  email: "lucia@example.com",
  avatarUrl: null,
  theme: "system" as Theme,
};

function renderMenu({
  profile = lucia,
  households = [{ ...flat, type: "shared_flat" as const }],
} = {}) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <SettingsMenu
        profile={profile}
        households={households}
        locale="en"
        signOut={<button type="submit">Sign out</button>}
        deleteAccount={<button type="button">Delete account</button>}
      />
    </NextIntlClientProvider>,
  );
}

describe("SettingsMenu", () => {
  it.each(["Account", "Household", "Preferences", "Privacy and data"])(
    "FR-NAV-003 shows %s as a named section",
    (name) => {
      renderMenu();
      expect(screen.getByRole("region", { name })).toBeInTheDocument();
    },
  );

  it("FR-NAV-003 shows the signed-in user's own name and email", () => {
    renderMenu();
    const account = screen.getByRole("region", { name: "Account" });
    expect(within(account).getByText("Lucía Fernández")).toBeInTheDocument();
    expect(within(account).getByText("lucia@example.com")).toBeInTheDocument();
    expect(within(account).getByRole("link", { name: "Edit profile" })).toHaveAttribute(
      "href",
      "/settings/account",
    );
  });

  it("FR-NAV-003 opens Appearance and Notifications from Preferences", () => {
    renderMenu();
    const preferences = screen.getByRole("region", { name: "Preferences" });
    expect(
      within(preferences).getByRole("link", { name: /^Appearance ?, ?System$/ }),
    ).toHaveAttribute("href", "/settings/appearance");
    expect(within(preferences).getByRole("link", { name: "Notifications" })).toHaveAttribute(
      "href",
      "/settings/notifications",
    );
  });

  it("FR-ACC-007 shows the chosen theme next to Appearance", () => {
    renderMenu({ profile: { ...lucia, theme: "dark" } });
    expect(screen.getByRole("link", { name: /^Appearance ?, ?Dark$/ })).toBeInTheDocument();
  });

  it("FR-ACC-007 opens the language setting from Preferences, showing English", () => {
    renderMenu();
    expect(screen.getByRole("link", { name: /^Language ?, ?English$/ })).toHaveAttribute(
      "href",
      "/settings/language",
    );
  });

  it("FR-NAV-003 opens each household's settings and offers to create one", () => {
    renderMenu();
    const household = screen.getByRole("region", { name: "Household" });
    expect(
      within(household).getByRole("link", { name: /^Calle Mayor flat ?, ?Shared flat$/ }),
    ).toHaveAttribute("href", `/settings/household/${flat.id}`);
    expect(within(household).getByRole("link", { name: "Create a new household" })).toHaveAttribute(
      "href",
      "/households/new",
    );
  });

  it("FR-NAV-003 offers Download my data and Delete account under Privacy and data", () => {
    renderMenu();
    const privacy = screen.getByRole("region", { name: "Privacy and data" });
    expect(within(privacy).getByRole("link", { name: "Download my data" })).toHaveAttribute(
      "href",
      "/settings/download-data",
    );
    expect(within(privacy).getByRole("button", { name: "Delete account" })).toBeInTheDocument();
  });

  it("FR-NAV-003 ends with Sign out", () => {
    renderMenu();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("FR-NAV-003 leaves out the household list, not the create button, when there is none", () => {
    renderMenu({ households: [] });
    const household = screen.getByRole("region", { name: "Household" });
    expect(within(household).queryByRole("list")).not.toBeInTheDocument();
    expect(within(household).getByRole("link", { name: "Create a new household" })).toBeVisible();
  });

  it("FR-NAV-003 leaves out the email line for an account without one", () => {
    renderMenu({ profile: { ...lucia, email: "" } });
    const account = screen.getByRole("region", { name: "Account" });
    expect(within(account).getByText("Lucía Fernández").nextElementSibling).toBeNull();
  });
});
