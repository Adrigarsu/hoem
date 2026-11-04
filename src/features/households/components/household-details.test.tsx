import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/en.json";
import type { HouseholdFormState } from "../actions";
import type { HouseholdSettingsView } from "../service";
import { HouseholdDetails } from "./household-details";

const actions = vi.hoisted(() => ({
  changeHouseholdTypeAction: vi.fn(
    async (_: HouseholdFormState, __: FormData): Promise<HouseholdFormState> => ({
      status: "saved",
    }),
  ),
  renameHouseholdAction: vi.fn(
    async (_: HouseholdFormState, __: FormData): Promise<HouseholdFormState> => ({
      status: "saved",
    }),
  ),
}));
vi.mock("../actions", () => actions);

const lucia = "00000000-0000-7000-8000-000000000001";
const marcos = "00000000-0000-7000-8000-000000000002";

const flat: HouseholdSettingsView = {
  id: "00000000-0000-7000-8000-00000000a001",
  name: "Calle Mayor 5",
  type: "shared_flat",
  isOwner: true,
  members: [
    {
      userId: lucia,
      role: "owner",
      familyRole: null,
      displayName: "Lucía",
      avatarUrl: null,
      isYou: true,
      permissions: {},
    },
    {
      userId: marcos,
      role: "member",
      familyRole: null,
      displayName: "Marcos",
      avatarUrl: null,
      isYou: false,
      permissions: {},
    },
  ],
};

function renderDetails(household: HouseholdSettingsView = flat) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HouseholdDetails household={household} />
    </NextIntlClientProvider>,
  );
}

const typeSelect = () => screen.getByRole("combobox", { name: "Type" });
const sentForm = () => actions.changeHouseholdTypeAction.mock.calls[0]?.[1];

beforeEach(() => {
  actions.changeHouseholdTypeAction.mockClear();
});

describe("HouseholdDetails", () => {
  it("FR-ACC-009 does not let a member who is not an owner change the type, and says why", () => {
    renderDetails({ ...flat, isOwner: false });
    expect(typeSelect()).toBeDisabled();
    expect(typeSelect()).toHaveAccessibleDescription("Only owners can change this.");
    expect(screen.queryByRole("button", { name: "Save name" })).not.toBeInTheDocument();
  });

  it("FR-HH-007 warns that the new rules only apply from now on before changing anything", async () => {
    renderDetails();
    await userEvent.selectOptions(typeSelect(), "other");
    expect(
      screen.getByRole("dialog", { name: "Change to Something else?" }),
    ).toHaveAccessibleDescription(/only apply to things created from now on/);
    expect(actions.changeHouseholdTypeAction).not.toHaveBeenCalled();
  });

  it("FR-HH-007 keeps the type when the owner does not confirm", async () => {
    renderDetails();
    await userEvent.selectOptions(typeSelect(), "other");
    await userEvent.click(screen.getByRole("button", { name: "Keep Shared flat" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(typeSelect()).toHaveValue("shared_flat");
    expect(actions.changeHouseholdTypeAction).not.toHaveBeenCalled();
  });

  it("FR-HH-007 changes the type once the owner confirms", async () => {
    renderDetails();
    await userEvent.selectOptions(typeSelect(), "other");
    await userEvent.click(screen.getByRole("button", { name: "Change type" }));
    await waitFor(() => expect(sentForm()?.get("type")).toBe("other"));
  });

  it("FR-HH-007 asks for a family role for every member, with the owner pre-set as a parent", async () => {
    renderDetails();
    await userEvent.selectOptions(typeSelect(), "family");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("combobox", { name: "You · Owner" })).toHaveValue("parent");
    expect(screen.getByRole("combobox", { name: "Marcos · Member" })).toHaveValue("");
  });

  it("FR-ACC-006 names a member without a profile by their place in the joining order", async () => {
    renderDetails({
      ...flat,
      members: flat.members.map((member) => ({
        ...member,
        displayName: member.isYou ? member.displayName : null,
      })),
    });
    await userEvent.selectOptions(typeSelect(), "family");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("combobox", { name: "Member 2 · Member" })).toBeInTheDocument();
  });

  it("FR-HH-007 does not change the type while a member has no family role", async () => {
    renderDetails();
    await userEvent.selectOptions(typeSelect(), "family");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.click(screen.getByRole("button", { name: "Change to Family" }));
    const missing = screen.getByRole("combobox", { name: "Marcos · Member" });
    expect(missing).toHaveAccessibleDescription("Choose a role for Marcos");
    expect(missing).toHaveFocus();
    expect(actions.changeHouseholdTypeAction).not.toHaveBeenCalled();
  });

  it("FR-HH-007 sends the family roles once every member has one", async () => {
    renderDetails();
    await userEvent.selectOptions(typeSelect(), "family");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Marcos · Member" }),
      "child",
    );
    await userEvent.click(screen.getByRole("button", { name: "Change to Family" }));
    await waitFor(() => expect(sentForm()?.get(`familyRoles.${marcos}`)).toBe("child"));
    expect(sentForm()?.get(`familyRoles.${lucia}`)).toBe("parent");
  });

  it("FR-HH-007 needs at least one parent", async () => {
    renderDetails();
    await userEvent.selectOptions(typeSelect(), "family");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "You · Owner" }),
      "relative",
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Marcos · Member" }),
      "child",
    );
    await userEvent.click(screen.getByRole("button", { name: "Change to Family" }));
    expect(screen.getByRole("alert")).toHaveTextContent("A family needs at least one parent");
    expect(actions.changeHouseholdTypeAction).not.toHaveBeenCalled();
  });

  it("FR-ACC-009 explains that Just me is for one person instead of warning", async () => {
    renderDetails();
    await userEvent.selectOptions(typeSelect(), "single");
    expect(
      screen.getByRole("alertdialog", { name: '"Just me" is for one person' }),
    ).toHaveAccessibleDescription(/has 1 other member/);
  });

  it("NFR-LEG-001 explains why a family with a child under 14 must stay a family", async () => {
    actions.changeHouseholdTypeAction.mockResolvedValueOnce({
      status: "refused",
      refusal: "minor",
    });
    renderDetails({ ...flat, type: "family" });
    await userEvent.selectOptions(typeSelect(), "other");
    await userEvent.click(screen.getByRole("button", { name: "Change type" }));
    expect(
      await screen.findByRole("alertdialog", { name: "This household must stay a family" }),
    ).toBeInTheDocument();
  });

  it("FR-HH-007 keeps the owner's choices when the server asks for a missing role", async () => {
    actions.changeHouseholdTypeAction.mockResolvedValueOnce({
      status: "invalid",
      fieldErrors: { [`familyRoles.${marcos}`]: "required" },
      values: { type: "family", familyRoles: { [lucia]: "relative" } },
    });
    renderDetails();
    await userEvent.selectOptions(typeSelect(), "family");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "You · Owner" }),
      "relative",
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Marcos · Member" }),
      "parent",
    );
    await userEvent.click(screen.getByRole("button", { name: "Change to Family" }));
    expect(await screen.findByText("Choose a role for Marcos")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "You · Owner" })).toHaveValue("relative");
  });

  it("FR-HH-007 does not open the family roles for an error that is not about them", async () => {
    actions.changeHouseholdTypeAction.mockResolvedValueOnce({
      status: "invalid",
      fieldErrors: { householdId: "required" },
    });
    renderDetails();
    await userEvent.selectOptions(typeSelect(), "other");
    await userEvent.click(screen.getByRole("button", { name: "Change type" }));
    await waitFor(() => expect(actions.changeHouseholdTypeAction).toHaveBeenCalled());
    expect(
      screen.queryByRole("dialog", { name: "Who is who in the family?" }),
    ).not.toBeInTheDocument();
  });

  it("FR-ACC-009 announces the new type and puts focus back on the type select", async () => {
    renderDetails({ ...flat, type: "other" });
    await userEvent.selectOptions(typeSelect(), "shared_flat");
    await userEvent.click(screen.getByRole("button", { name: "Change type" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Calle Mayor 5 now follows its own rules.",
    );
    // The focus moves in an effect after the dialog closes.
    await waitFor(() => expect(typeSelect()).toHaveFocus());
  });
});
