// The rules for deleting an account (FR-ACC-007). The database enforces both again
// (private.delete_own_account, private.ensure_household_keeps_owner); these let the app refuse before
// it removes anything.

export function confirmsDeletion(typed: string, email: string): boolean {
  const confirmation = typed.trim().toLowerCase();
  return confirmation !== "" && confirmation === email.trim().toLowerCase();
}

type Member = { userId: string; role: "owner" | "member" };

// A household I am alone in goes with the account. One where others belong must keep an owner.
export function householdsNeedingNewOwner<Household extends { members: readonly Member[] }>(
  households: readonly Household[],
  userId: string,
): Household[] {
  return households.filter(({ members }) => {
    const owners = members.filter((member) => member.role === "owner");
    return (
      members.length > 1 && owners.length === 1 && owners.some((owner) => owner.userId === userId)
    );
  });
}
