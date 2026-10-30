import type { FamilyRole, HouseholdType } from "./household-rules";

// Why a household cannot take a type at all, before any warning is shown. "Just me" is for one
// person (FR-ACC-009). A family with someone under 14 cannot stop being a family either
// (NFR-LEG-001), but ages are private, so only the database knows that and refuses it.
export type TypeChangeBlock = "otherMembers";

export function typeChangeBlock(
  target: HouseholdType,
  otherMembers: number,
): TypeChangeBlock | null {
  return target === "single" && otherMembers > 0 ? "otherMembers" : null;
}

export type FamilyRoleProblems = { missing: string[]; noParent: boolean };

// What stops a household from becoming a family (FR-HH-007): members still without a role and, once
// all have one, the lack of a parent, without whom nobody could manage the family (FR-HH-006). The
// owner need not be a parent. Roles for people outside the household are ignored here; the database
// refuses them.
export function familyRoleProblems(
  memberIds: readonly string[],
  roles: Readonly<Record<string, FamilyRole>>,
): FamilyRoleProblems {
  const missing = memberIds.filter((id) => !roles[id]);
  const noParent = missing.length === 0 && !memberIds.some((id) => roles[id] === "parent");
  return { missing, noParent };
}
