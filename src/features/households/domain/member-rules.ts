import type { FamilyRole, HouseholdType } from "./household-rules";

export type MemberRole = "owner" | "member";

export type MemberRoles = { userId: string; role: MemberRole; familyRole: FamilyRole | null };

// What the signed-in user may do to one member (FR-ACC-006, FR-HH-006, FR-HH-008). An action that
// is missing is not offered; a blocked one is shown with the reason, so the user knows what to do
// first. The database applies the same rules (memberships_update, memberships_delete,
// set_member_role and the last-owner and last-parent triggers).
export type MemberPermissions = {
  makeOwner?: "allowed";
  stepDown?: "allowed" | "lastOwner";
  familyRole?: "allowed" | "lastParent";
  remove?: "allowed";
};

const count = (members: MemberRoles[], test: (member: MemberRoles) => boolean) =>
  members.filter(test).length;

export function memberPermissions(
  type: HouseholdType,
  members: MemberRoles[],
  youId: string,
  targetId: string,
): MemberPermissions {
  const you = members.find((member) => member.userId === youId);
  const target = members.find((member) => member.userId === targetId);
  if (!you || !target) return {};

  const isFamily = type === "family";
  const youOwn = you.role === "owner";
  // A family role left behind by a type change grants nothing (private.is_parent).
  const isParent = (member: MemberRoles) => isFamily && member.familyRole === "parent";
  // Who changes members: parents in a family, owners elsewhere (private.can_manage_members). Only an
  // owner touches an owner's row.
  const manages = (isFamily ? isParent(you) : youOwn) && (target.role !== "owner" || youOwn);

  const permissions: MemberPermissions = {};
  // Owners hand over ownership in every type, parent or not (set_member_role).
  if (youOwn && target.role === "member") permissions.makeOwner = "allowed";
  if (youOwn && target.role === "owner") {
    const owners = count(members, (member) => member.role === "owner");
    permissions.stepDown = owners > 1 ? "allowed" : "lastOwner";
  }
  if (isFamily && manages) {
    const lastParent = isParent(target) && count(members, isParent) === 1;
    permissions.familyRole = lastParent ? "lastParent" : "allowed";
  }
  // Removing yourself is leaving the household, a separate flow.
  if (manages && target.userId !== you.userId) permissions.remove = "allowed";
  return permissions;
}
