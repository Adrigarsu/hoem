// The household the user chose, while they still belong to it, or else their first household
// (FR-ACC-004). The choice is only a preference: `households` is what row-level security lets the
// user read, so a household they left can never come back as the active one.
export function pickActiveHousehold<T extends { id: string }>(
  households: readonly T[],
  preferredId: string | null,
): T | null {
  return households.find((household) => household.id === preferredId) ?? households[0] ?? null;
}
