import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Avatar, ToastSlot, ToastSlotProvider, undoDelayMs } from "@/design-system";
import messages from "../../../../messages/en.json";
import type { MemberFormState } from "../actions";
import type { HouseholdSettingsView, MemberView } from "../service";
import { HouseholdMembers } from "./household-members";

const actions = vi.hoisted(() => ({
  setMemberRoleAction: vi.fn(
    async (_: MemberFormState, __: FormData): Promise<MemberFormState> => ({ status: "saved" }),
  ),
  changeFamilyRoleAction: vi.fn(
    async (_: MemberFormState, form: FormData): Promise<MemberFormState> => ({
      status: "saved",
      familyRole: form.get("familyRole") === "parent" ? "parent" : "relative",
    }),
  ),
  removeMemberAction: vi.fn(async (_: string, __: string) => true),
}));
vi.mock("../actions", () => actions);

const householdId = "00000000-0000-7000-8000-00000000a001";
const lucia = "00000000-0000-7000-8000-000000000001";
const marcos = "00000000-0000-7000-8000-000000000002";

const you: MemberView = {
  userId: lucia,
  role: "owner",
  familyRole: null,
  displayName: "Lucía",
  avatarUrl: null,
  isYou: true,
  permissions: { stepDown: "lastOwner" },
};
const flatmate: MemberView = {
  userId: marcos,
  role: "member",
  familyRole: null,
  displayName: "Marcos",
  avatarUrl: null,
  isYou: false,
  permissions: { makeOwner: "allowed", remove: "allowed" },
};

const flat: HouseholdSettingsView = {
  id: householdId,
  name: "Calle Mayor 5",
  type: "shared_flat",
  isOwner: true,
  members: [you, flatmate],
};

const family: HouseholdSettingsView = {
  ...flat,
  name: "García family",
  type: "family",
  members: [
    {
      ...you,
      familyRole: "parent",
      permissions: { stepDown: "lastOwner", familyRole: "lastParent" },
    },
    {
      ...flatmate,
      familyRole: "child",
      permissions: { makeOwner: "allowed", familyRole: "allowed", remove: "allowed" },
    },
  ],
};

function renderMembers(household: HouseholdSettingsView = flat) {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <ToastSlotProvider>
        <main>
          <HouseholdMembers household={household} ownAvatar={<Avatar name="Lucía" />} />
        </main>
        <footer>
          <ToastSlot />
        </footer>
      </ToastSlotProvider>
    </NextIntlClientProvider>,
  );
}

const members = () => within(screen.getByRole("list"));
const sentForm = (action: { mock: { calls: unknown[][] } }) =>
  action.mock.calls.at(-1)?.[1] as FormData | undefined;

async function openOptions(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name: `Options for ${name}` }));
  return within(screen.getByRole("dialog", { name: `Options for ${name}` }));
}

beforeEach(() => vi.clearAllMocks());

describe("HouseholdMembers", () => {
  it("FR-ACC-006 lists every member with their name and role", () => {
    renderMembers();
    expect(members().getByText("Lucía (you)")).toBeInTheDocument();
    expect(members().getByText("Owner")).toBeInTheDocument();
    expect(members().getByText("Marcos")).toBeInTheDocument();
    expect(members().getByText("Member")).toBeInTheDocument();
  });

  it("FR-HH-008 shows the family role next to the household role in a family", () => {
    renderMembers(family);
    expect(members().getByText("Owner · Parent")).toBeInTheDocument();
    expect(members().getByText("Member · Child")).toBeInTheDocument();
  });

  it("FR-ACC-006 offers no options to a member who cannot change anyone", () => {
    renderMembers({
      ...flat,
      isOwner: false,
      members: flat.members.map((member) => ({ ...member, permissions: {} })),
    });
    expect(screen.queryByRole("button", { name: /^Options for/ })).toBeNull();
  });

  it("FR-ACC-006 lets an owner make a member an owner and confirms it", async () => {
    const user = userEvent.setup();
    renderMembers();
    const dialog = await openOptions(user, "Marcos");
    await user.click(dialog.getByRole("button", { name: "Make owner" }));
    expect(await screen.findByText("Marcos is now an owner.")).toBeInTheDocument();
    expect(Object.fromEntries(sentForm(actions.setMemberRoleAction) ?? [])).toEqual({
      householdId,
      userId: marcos,
      role: "owner",
    });
  });

  it("FR-ACC-006 asks the only owner to make someone else owner first", async () => {
    const user = userEvent.setup();
    renderMembers();
    const dialog = await openOptions(user, "Lucía");
    expect(dialog.getByText("Make someone else owner first.")).toBeInTheDocument();
    expect(dialog.queryByRole("button", { name: "Stop being an owner" })).toBeNull();
  });

  it("FR-ACC-006 shows a refusal of the server in the dialog", async () => {
    actions.setMemberRoleAction.mockResolvedValueOnce({ status: "refused", refusal: "lastOwner" });
    const user = userEvent.setup();
    renderMembers();
    const dialog = await openOptions(user, "Marcos");
    await user.click(dialog.getByRole("button", { name: "Make owner" }));
    expect(await dialog.findByText("Make someone else owner first.")).toBeInTheDocument();
  });

  it("FR-HH-006 lets a parent set a member's family role", async () => {
    const user = userEvent.setup();
    renderMembers(family);
    const dialog = await openOptions(user, "Marcos");
    await user.selectOptions(dialog.getByRole("combobox", { name: "Family role" }), "relative");
    await user.click(dialog.getByRole("button", { name: "Save role" }));
    expect(await screen.findByText("Marcos is now a relative.")).toBeInTheDocument();
    expect(sentForm(actions.changeFamilyRoleAction)?.get("familyRole")).toBe("relative");
  });

  it("FR-HH-006 explains why the last parent cannot change their family role", async () => {
    const user = userEvent.setup();
    renderMembers(family);
    const dialog = await openOptions(user, "Lucía");
    const select = dialog.getByRole("combobox", { name: "Family role" });
    expect(select).toBeDisabled();
    expect(select).toHaveAccessibleDescription("Make someone else a parent first.");
  });
});

describe("HouseholdMembers removal", () => {
  // Real time still flows, so user-event's own waits finish; the undo delay is skipped with the clock.
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  async function removeMarcos() {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderMembers();
    const dialog = await openOptions(user, "Marcos");
    await user.click(dialog.getByRole("button", { name: "Remove from household" }));
    return user;
  }

  it("FR-ACC-006 hides the member at once and offers Undo", async () => {
    await removeMarcos();
    expect(members().queryByText("Marcos")).toBeNull();
    expect(
      within(screen.getByRole("contentinfo")).getByText("Marcos removed from the household"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Members" })).toHaveFocus();
    expect(actions.removeMemberAction).not.toHaveBeenCalled();
  });

  it("NFR-UX-002 removes the member once the undo time is over", async () => {
    await removeMarcos();
    await act(() => vi.advanceTimersByTimeAsync(undoDelayMs));
    expect(actions.removeMemberAction).toHaveBeenCalledWith(householdId, marcos);
  });

  it("NFR-UX-002 brings the member back with Undo and removes nobody", async () => {
    const user = await removeMarcos();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await act(() => vi.advanceTimersByTimeAsync(undoDelayMs));
    expect(members().getByText("Marcos")).toBeInTheDocument();
    expect(actions.removeMemberAction).not.toHaveBeenCalled();
  });

  it("FR-ACC-006 brings the member back with a message when the removal fails", async () => {
    actions.removeMemberAction.mockResolvedValueOnce(false);
    await removeMarcos();
    await act(() => vi.advanceTimersByTimeAsync(undoDelayMs));
    await waitFor(() => expect(members().getByText("Marcos")).toBeInTheDocument());
    expect(screen.getByText("We could not remove Marcos. Try again.")).toBeInTheDocument();
  });
});
