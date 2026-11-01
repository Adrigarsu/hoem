import {
  ConflictError,
  ForbiddenError,
  NotAuthenticatedError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { FamilyRole, HouseholdType } from "./domain/household-rules";
import { familyRoleProblems, typeChangeBlock } from "./domain/type-change";
import type {
  ChangeHouseholdTypeInput,
  CreateHouseholdInput,
  RenameHouseholdInput,
} from "./schemas";

export type Household = { id: string; name: string; type: HouseholdType };
export type Member = { userId: string; role: "owner" | "member"; familyRole: FamilyRole | null };

export type HouseholdGateway = {
  // From the verified session, never from the request.
  signedInUserId(): Promise<string | null>;
  createHousehold(name: string, type: HouseholdType): Promise<string>;
  // Only the households the user belongs to: row-level security hides the rest.
  myHouseholds(): Promise<Household[]>;
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

export type HouseholdSettingsView = Household & {
  isOwner: boolean;
  members: (Member & { isYou: boolean })[];
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

export async function myHouseholds(gateway: HouseholdGateway): Promise<Household[]> {
  await requireUser(gateway);
  return gateway.myHouseholds();
}

export async function householdSettings(
  gateway: HouseholdGateway,
  householdId: string,
): Promise<HouseholdSettingsView> {
  const { household, members, you } = await memberView(gateway, householdId);
  return {
    ...household,
    isOwner: you.role === "owner",
    members: members.map((member) => ({ ...member, isYou: member.userId === you.userId })),
  };
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
