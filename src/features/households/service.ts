import {
  ConflictError,
  ForbiddenError,
  NotAuthenticatedError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import { pickActiveHousehold } from "./domain/active-household";
import type { FamilyRole, HouseholdType } from "./domain/household-rules";
import {
  memberPermissions,
  type MemberPermissions,
  type MemberRole,
  type MemberRoles,
} from "./domain/member-rules";
import { familyRoleProblems, typeChangeBlock } from "./domain/type-change";
import type {
  ChangeFamilyRoleInput,
  ChangeHouseholdTypeInput,
  CreateHouseholdInput,
  RemoveMemberInput,
  RenameHouseholdInput,
  SetMemberRoleInput,
  SwitchHouseholdInput,
} from "./schemas";

export type Household = { id: string; name: string; type: HouseholdType };
export type HouseholdSummary = Household & { memberCount: number };
// The name and the photo are the only parts of another member's profile anyone sees. The name is
// missing only for a member without a profile.
export type Member = MemberRoles & { displayName: string | null; avatarPath: string | null };

export type HouseholdGateway = {
  // From the verified session, never from the request.
  signedInUserId(): Promise<string | null>;
  createHousehold(name: string, type: HouseholdType): Promise<string>;
  // Only the households the user belongs to: row-level security hides the rest.
  myHouseholds(): Promise<HouseholdSummary[]>;
  // Null for a household the user does not belong to: row-level security hides it.
  householdById(id: string): Promise<Household | null>;
  // In the order they joined, so "Member 2" stays the same person between visits.
  membersOf(householdId: string): Promise<Member[]>;
  renameHousehold(id: string, name: string): Promise<void>;
  changeHouseholdType(
    id: string,
    type: HouseholdType,
    familyRoles: Record<string, FamilyRole>,
  ): Promise<void>;
  // Short-lived signed URLs of the given photos, by path.
  avatarUrls(paths: string[]): Promise<Record<string, string>>;
  setMemberRole(householdId: string, userId: string, role: MemberRole): Promise<void>;
  // False when row-level security left the row untouched.
  setFamilyRole(householdId: string, userId: string, familyRole: FamilyRole): Promise<boolean>;
  removeMember(householdId: string, userId: string): Promise<void>;
  // The household the user last chose on this device (FR-ACC-004). Only a preference: anyone can
  // put any id in a cookie, so it is never used without checking membership first.
  preferredHouseholdId(): Promise<string | null>;
  rememberHousehold(id: string): Promise<void>;
};

// A type the household cannot take: "single" while others belong, or anything but family while
// someone is under 14 (NFR-LEG-001; only the database knows ages, so the gateway throws that one).
export type TypeChangeRefusal = "otherMembers" | "minor";

export class TypeChangeRefusedError extends ConflictError {
  constructor(readonly reason: TypeChangeRefusal) {
    super(`Household type change refused: ${reason}`);
  }
}

// People under 14 join a family through a parent and never create a household (NFR-LEG-001).
// Only the database knows ages, so the gateway throws it.
export class MinorCannotCreateError extends ForbiddenError {
  constructor() {
    super("People under 14 cannot create a household");
  }
}

// A change the household cannot take now: the last owner or the last parent would be gone
// (FR-ACC-006, FR-HH-006). The user is asked to name someone else first.
export type MemberChangeRefusal = "lastOwner" | "lastParent";

export class MemberChangeRefusedError extends ConflictError {
  constructor(readonly reason: MemberChangeRefusal) {
    super(`Member change refused: ${reason}`);
  }
}

export type ActiveHouseholdView = {
  // Null only for someone who belongs to no household.
  active: HouseholdSummary | null;
  households: HouseholdSummary[];
};

export type MemberView = Omit<Member, "avatarPath"> & {
  avatarUrl: string | null;
  isYou: boolean;
  permissions: MemberPermissions;
};

export type HouseholdSettingsView = Household & {
  isOwner: boolean;
  members: MemberView[];
};

async function requireUser(gateway: HouseholdGateway): Promise<string> {
  const userId = await gateway.signedInUserId();
  if (!userId) throw new NotAuthenticatedError();
  return userId;
}

// The household and its members, as the signed-in user may see them. Not being a member looks the
// same as the household not existing (NFR-SEC-001).
async function memberView(gateway: HouseholdGateway, householdId: string) {
  const userId = await requireUser(gateway);
  const household = await gateway.householdById(householdId);
  const members = household ? await gateway.membersOf(householdId) : [];
  const you = members.find((member) => member.userId === userId);
  if (!household || !you) throw new NotFoundError("Household not found");
  return { household, members, you };
}

export async function createHousehold(
  gateway: HouseholdGateway,
  input: CreateHouseholdInput,
): Promise<string> {
  await requireUser(gateway);
  return gateway.createHousehold(input.name, input.type);
}

// The household every screen works on (FR-ACC-004), picked among the ones row-level security lets
// the user read, so a household they left is never active and never listed.
export async function activeHousehold(gateway: HouseholdGateway): Promise<ActiveHouseholdView> {
  await requireUser(gateway);
  const [households, preferredId] = await Promise.all([
    gateway.myHouseholds(),
    gateway.preferredHouseholdId(),
  ]);
  return { active: pickActiveHousehold(households, preferredId), households };
}

// Not belonging looks the same as the household not existing (NFR-SEC-001).
export async function switchHousehold(
  gateway: HouseholdGateway,
  input: SwitchHouseholdInput,
): Promise<void> {
  await requireUser(gateway);
  const household = await gateway.householdById(input.householdId);
  if (!household) throw new NotFoundError("Household not found");
  await gateway.rememberHousehold(household.id);
}

export async function householdSettings(
  gateway: HouseholdGateway,
  householdId: string,
): Promise<HouseholdSettingsView> {
  const { household, members, you } = await memberView(gateway, householdId);
  const paths = members.flatMap(({ avatarPath }) => (avatarPath ? [avatarPath] : []));
  const urls = paths.length > 0 ? await gateway.avatarUrls(paths) : {};
  return {
    ...household,
    isOwner: you.role === "owner",
    members: members.map(({ avatarPath, ...member }) => ({
      ...member,
      avatarUrl: (avatarPath && urls[avatarPath]) || null,
      isYou: member.userId === you.userId,
      permissions: memberPermissions(household.type, members, you.userId, member.userId),
    })),
  };
}

// The member the change is about, with what the caller may do to them.
async function memberChange(gateway: HouseholdGateway, householdId: string, userId: string) {
  const { household, members, you } = await memberView(gateway, householdId);
  const target = members.find((member) => member.userId === userId);
  const permissions = target ? memberPermissions(household.type, members, you.userId, userId) : {};
  return { target, permissions };
}

// Owners make someone an owner, or step down, in every household type (FR-ACC-006);
// private.set_member_role checks it again and keeps the last owner.
export async function setMemberRole(
  gateway: HouseholdGateway,
  input: SetMemberRoleInput,
): Promise<void> {
  const { target, permissions } = await memberChange(gateway, input.householdId, input.userId);
  if (!target) throw new NotFoundError("Member not found");
  const allowed = input.role === "owner" ? permissions.makeOwner : permissions.stepDown;
  if (allowed === "lastOwner") throw new MemberChangeRefusedError("lastOwner");
  if (allowed !== "allowed") throw new ForbiddenError("Not allowed to change this role");
  await gateway.setMemberRole(input.householdId, input.userId, input.role);
}

// Parents set parent, child or relative (FR-HH-006); a relative or a child cannot (FR-HH-008).
// Row-level security and the last-parent trigger enforce the same.
export async function changeFamilyRole(
  gateway: HouseholdGateway,
  input: ChangeFamilyRoleInput,
): Promise<void> {
  const { target, permissions } = await memberChange(gateway, input.householdId, input.userId);
  if (!target) throw new NotFoundError("Member not found");
  if (!permissions.familyRole) throw new ForbiddenError("Not allowed to change family roles");
  if (input.familyRole === target.familyRole) return;
  if (permissions.familyRole === "lastParent") throw new MemberChangeRefusedError("lastParent");
  const changed = await gateway.setFamilyRole(input.householdId, input.userId, input.familyRole);
  if (!changed) throw new ForbiddenError("Not allowed to change family roles");
}

// Managers remove members (FR-ACC-006, FR-HH-006). Someone already gone is not an error: the web app
// may send the same removal again when the page closes during the undo (ADR-020).
export async function removeMember(
  gateway: HouseholdGateway,
  input: RemoveMemberInput,
): Promise<void> {
  const { target, permissions } = await memberChange(gateway, input.householdId, input.userId);
  if (!target) return;
  if (permissions.remove !== "allowed") throw new ForbiddenError("Not allowed to remove members");
  await gateway.removeMember(input.householdId, input.userId);
}

// Owners rename the household (FR-ACC-009); row-level security enforces the same rule.
export async function renameHousehold(
  gateway: HouseholdGateway,
  input: RenameHouseholdInput,
): Promise<void> {
  const { you } = await memberView(gateway, input.householdId);
  if (you.role !== "owner") throw new ForbiddenError("Only owners rename a household");
  await gateway.renameHousehold(input.householdId, input.name);
}

// Only owners change the type (FR-ACC-009). Nothing but the type, its rules and the family roles
// change, so existing private records keep who can see them (FR-HH-007, ADR-006);
// private.change_household_type checks every rule again.
export async function changeHouseholdType(
  gateway: HouseholdGateway,
  input: ChangeHouseholdTypeInput,
): Promise<void> {
  const { household, members, you } = await memberView(gateway, input.householdId);
  if (you.role !== "owner") throw new ForbiddenError("Only owners change the household type");
  if (input.type === household.type) return;

  const block = typeChangeBlock(input.type, members.length - 1);
  if (block) throw new TypeChangeRefusedError(block);

  if (input.type !== "family") {
    await gateway.changeHouseholdType(household.id, input.type, {});
    return;
  }
  const memberIds = members.map((member) => member.userId);
  const { missing, noParent } = familyRoleProblems(memberIds, input.familyRoles);
  if (missing.length > 0) {
    throw new ValidationError(
      missing.map((id) => ({ field: `familyRoles.${id}`, code: "required" })),
    );
  }
  if (noParent) throw new ValidationError([{ field: "familyRoles", code: "noParent" }]);
  // Only the members' roles: anything else the form sent is not the household's business.
  const familyRoles = Object.fromEntries(
    memberIds.map((id) => [id, input.familyRoles[id]] as const),
  ) as Record<string, FamilyRole>;
  await gateway.changeHouseholdType(household.id, input.type, familyRoles);
}
