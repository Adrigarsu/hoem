import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import { HouseholdMenu } from "./household-menu";

const actions = vi.hoisted(() => ({
  switchHouseholdAction: vi.fn(async (_: string) => true),
}));
vi.mock("../actions", () => actions);

const home = {
  id: "00000000-0000-7000-8000-00000000a001",
  name: "My home",
  type: "single" as const,
  memberCount: 1,
};
const flat = {
  id: "00000000-0000-7000-8000-00000000a002",
  name: "Calle Mayor 5",
  type: "shared_flat" as const,
  memberCount: 2,
};

function renderMenu(placement: "header" | "sidebar" = "sidebar") {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HouseholdMenu households={[home, flat]} active={home} placement={placement} />
    </NextIntlClientProvider>,
  );
}

const switcher = () => screen.getByRole("button", { name: /^My home.*switch household$/ });

describe("HouseholdMenu", () => {
  it("FR-ACC-004 lists every household with its type and marks the active one", async () => {
    renderMenu();
    await userEvent.click(switcher());
    expect(screen.getByRole("menuitemradio", { name: /^My home ?Just me$/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(
      screen.getByRole("menuitemradio", { name: /^Calle Mayor 5 ?Shared flat · 2 members$/ }),
    ).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("menuitem", { name: "Create a new household" })).toHaveAttribute(
      "href",
      "/households/new",
    );
  });

  it("FR-ACC-004 opens from the keyboard on the active household", async () => {
    renderMenu();
    switcher().focus();
    await userEvent.keyboard("{Enter}");
    expect(switcher()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitemradio", { name: /^My home/ })).toHaveFocus();
  });

  it("FR-ACC-004 moves between households with the arrow, Home and End keys", async () => {
    renderMenu();
    switcher().focus();
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitemradio", { name: /^Calle Mayor 5/ })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Create a new household" })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitemradio", { name: /^My home/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Create a new household" })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("menuitemradio", { name: /^My home/ })).toHaveFocus();
  });

  it("FR-ACC-004 switches to the household chosen with the keyboard", async () => {
    renderMenu();
    switcher().focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(actions.switchHouseholdAction).toHaveBeenCalledWith(flat.id);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(switcher()).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Calle Mayor 5 is now the active household.",
    );
  });

  it("FR-ACC-004 announces nothing when the user no longer belongs to the chosen household", async () => {
    actions.switchHouseholdAction.mockResolvedValueOnce(false);
    renderMenu();
    await userEvent.click(switcher());
    await userEvent.click(screen.getByRole("menuitemradio", { name: /^Calle Mayor 5/ }));
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("FR-ACC-004 closes with Escape and returns focus to the switcher", async () => {
    renderMenu();
    await userEvent.click(switcher());
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(switcher()).toHaveAttribute("aria-expanded", "false");
    expect(switcher()).toHaveFocus();
  });

  it("FR-ACC-004 closes the phone sheet with its close button", async () => {
    renderMenu("header");
    await userEvent.click(switcher());
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(switcher()).toHaveFocus();
  });

  it("FR-ACC-004 keeps the active household without switching when it is chosen again", async () => {
    actions.switchHouseholdAction.mockClear();
    renderMenu();
    await userEvent.click(switcher());
    await userEvent.click(screen.getByRole("menuitemradio", { name: /^My home/ }));
    expect(actions.switchHouseholdAction).not.toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
