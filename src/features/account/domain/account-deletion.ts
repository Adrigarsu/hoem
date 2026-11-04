// The rules for deleting an account (FR-ACC-007). The database enforces them again
// (private.delete_own_account, private.ensure_household_keeps_owner,
// private.ensure_family_keeps_parent); these let the app refuse before it removes anything.

export function confirmsDeletion(typed: string, email: string): boolean {
  const confirmation = typed.trim().toLowerCase();
  return confirmation !== "" && confirmation === email.trim().toLowerCase();
}

// Why a household must be handed over first: it needs another owner, another parent, or both.
export type HandOverReason = "owner" | "parent";

type Member = {
  userId: string;
  role: "owner" | "member";
  familyRole: "parent" | "child" | "relative" | null;
};

type Household = { type: string; members: readonly Member[] };

function reasonsToHandOver({ type, members }: Household, userId: string): HandOverReason[] {
  // A household I am alone in goes with the account.
  if (members.length < 2) return [];
  const owners = members.filter((member) => member.role === "owner");
  // private.ensure_family_keeps_parent only counts parents in a family.
  const parents =
    type === "family" ? members.filter((member) => member.familyRole === "parent") : [];
  const isOnly = (group: Member[]) => group.length === 1 && group[0]?.userId === userId;
  const reasons: HandOverReason[] = [];
  if (isOnly(owners)) reasons.push("owner");
  if (isOnly(parents)) reasons.push("parent");
  return reasons;
}

// The households where others belong and I am the last owner, or the last parent of a family.
export function householdsToHandOver<H extends Household>(
  households: readonly H[],
  userId: string,
): (H & { reasons: HandOverReason[] })[] {
  return households
    .map((household) => ({ ...household, reasons: reasonsToHandOver(household, userId) }))
    .filter(({ reasons }) => reasons.length > 0);
}
