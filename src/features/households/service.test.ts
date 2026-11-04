import { describe, expect, it, vi } from "vitest";
import {
  ForbiddenError,
  NotAuthenticatedError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import {
  activeHousehold,
  changeFamilyRole,
  changeHouseholdType,
  createHousehold,
  householdSettings,
  MemberChangeRefusedError,
  removeMember,
  renameHousehold,
  setMemberRole,
  switchHousehold,
  TypeChangeRefusedError,
  type HouseholdGateway,
  type Member,
} from "./service";

const householdId = "00000000-0000-7000-8000-00000000a001";
const lucia = "00000000-0000-7000-8000-000000000001";
const marcos = "00000000-0000-7000-8000-000000000002";

const flat = { id: householdId, name: "Calle Mayor 5", type: "shared_flat" as const };
const home = {
  id: "00000000-0000-7000-8000-00000000a002",
  name: "My home",
  type: "single" as const,
  memberCount: 1,
};
const flatSummary = { ...flat, memberCount: 2 };
const flatmates: Member[] = [
  { userId: lucia, role: "owner", familyRole: null, displayName: "Lucía", avatarPath: null },
  {
    userId: marcos,
    role: "member",
    familyRole: null,
    displayName: "Marcos",
    avatarPath: `${marcos}/photo.webp`,
  },
];

const pilar = "00000000-0000-7000-8000-000000000101";
const pablo = "00000000-0000-7000-8000-000000000102";
const carla = "00000000-0000-7000-8000-000000000103";
const familyHousehold = { id: householdId, name: "García family", type: "family" as const };
const garcias: Member[] = [
  { userId: pilar, role: "owner", familyRole: "relative", displayName: "Pilar", avatarPath: null },
  { userId: pablo, role: "member", familyRole: "parent", displayName: "Pablo", avatarPath: null },
  { userId: carla, role: "member", familyRole: "child", displayName: "Carla", avatarPath: null },
];

function familyGateway(you: string, overrides: Partial<HouseholdGateway> = {}) {
  return gateway({
    signedInUserId: vi.fn(async () => you),
    householdById: vi.fn(async () => familyHousehold),
    membersOf: vi.fn(async () => garcias),
    ...overrides,
  });
}

function gateway(overrides: Partial<HouseholdGateway> = {}): HouseholdGateway {
  return {
    signedInUserId: vi.fn(async () => lucia),
    createHousehold: vi.fn(async () => householdId),
    myHouseholds: vi.fn(async () => [flatSummary]),
    householdById: vi.fn(async () => flat),
    membersOf: vi.fn(async () => flatmates),
    renameHousehold: vi.fn(async () => {}),
    changeHouseholdType: vi.fn(async () => {}),
    avatarUrls: vi.fn(async (paths: string[]) =>
      Object.fromEntries(paths.map((path) => [path, `https://signed/${path}`])),
    ),
    setMemberRole: vi.fn(async () => {}),
    setFamilyRole: vi.fn(async () => true),
    removeMember: vi.fn(async () => {}),
    preferredHouseholdId: vi.fn(async () => null),
    rememberHousehold: vi.fn(async () => {}),
    ...overrides,
  };
}

const asMarcos = { signedInUserId: vi.fn(async () => marcos) };

describe("createHousehold", () => {
  it("FR-ACC-009 creates the household and returns its id", async () => {
    const households = gateway();
    const id = await createHousehold(households, { name: "Calle Mayor 5", type: "shared_flat" });
    expect(id).toBe(householdId);
    expect(households.createHousehold).toHaveBeenCalledWith("Calle Mayor 5", "shared_flat");
  });

  it("FR-ACC-009 refuses without a session", async () => {
    await expect(
      createHousehold(gateway({ signedInUserId: vi.fn(async () => null) }), {
        name: "Calle Mayor 5",
        type: "shared_flat",
      }),
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});

describe("activeHousehold", () => {
  it("FR-ACC-004 lists the user's households and marks the one they chose", async () => {
    const households = gateway({
      myHouseholds: vi.fn(async () => [home, flatSummary]),
      preferredHouseholdId: vi.fn(async () => flat.id),
    });
    expect(await activeHousehold(households)).toEqual({
      active: flatSummary,
      households: [home, flatSummary],
    });
  });

  it("FR-ACC-004 falls back to the first household after the user left the chosen one", async () => {
    const households = gateway({
      myHouseholds: vi.fn(async () => [home]),
      preferredHouseholdId: vi.fn(async () => flat.id),
    });
    expect(await activeHousehold(households)).toEqual({ active: home, households: [home] });
  });

  it("FR-ACC-004 refuses without a session", async () => {
    await expect(
      activeHousehold(gateway({ signedInUserId: vi.fn(async () => null) })),
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});

describe("switchHousehold", () => {
  it("FR-ACC-004 remembers a household the user belongs to as the active one", async () => {
    const households = gateway();
    await switchHousehold(households, { householdId });
    expect(households.rememberHousehold).toHaveBeenCalledWith(householdId);
  });

  it("FR-ACC-004 refuses a household the user does not belong to", async () => {
    const households = gateway({ householdById: vi.fn(async () => null) });
    await expect(switchHousehold(households, { householdId })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(households.rememberHousehold).not.toHaveBeenCalled();
  });

  it("FR-ACC-004 refuses without a session", async () => {
    const households = gateway({ signedInUserId: vi.fn(async () => null) });
    await expect(switchHousehold(households, { householdId })).rejects.toBeInstanceOf(
      NotAuthenticatedError,
    );
    expect(households.rememberHousehold).not.toHaveBeenCalled();
  });
});

describe("householdSettings", () => {
  it("FR-ACC-006 shows every member's name, photo and role, in joining order", async () => {
    expect(await householdSettings(gateway(), householdId)).toEqual({
      ...flat,
      isOwner: true,
      members: [
        {
          userId: lucia,
          role: "owner",
          familyRole: null,
          displayName: "Lucía",
          avatarUrl: null,
          isYou: true,
          permissions: { stepDown: "lastOwner" },
        },
        {
          userId: marcos,
          role: "member",
          familyRole: null,
          displayName: "Marcos",
          avatarUrl: `https://signed/${marcos}/photo.webp`,
          isYou: false,
          permissions: { makeOwner: "allowed", remove: "allowed" },
        },
      ],
    });
  });

  it("FR-ACC-006 signs no photo URL when nobody has a photo", async () => {
    const households = familyGateway(pilar);
    await householdSettings(households, householdId);
    expect(households.avatarUrls).not.toHaveBeenCalled();
  });

  it("FR-ACC-009 tells a member who is not an owner", async () => {
    expect((await householdSettings(gateway(asMarcos), householdId)).isOwner).toBe(false);
  });

  it("NFR-SEC-001 hides a household the caller does not belong to", async () => {
    await expect(
      householdSettings(gateway({ householdById: vi.fn(async () => null) }), householdId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("renameHousehold", () => {
  it("FR-ACC-009 lets an owner rename the household", async () => {
    const households = gateway();
    await renameHousehold(households, { householdId, name: "Calle Mayor 7" });
    expect(households.renameHousehold).toHaveBeenCalledWith(householdId, "Calle Mayor 7");
  });

  it("FR-ACC-009 does not let a member who is not an owner rename it", async () => {
    const households = gateway(asMarcos);
    await expect(
      renameHousehold(households, { householdId, name: "Marcos's flat" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(households.renameHousehold).not.toHaveBeenCalled();
  });
});

describe("changeHouseholdType", () => {
  it("FR-ACC-009 does not let a member who is not an owner change the type", async () => {
    const households = gateway(asMarcos);
    await expect(
      changeHouseholdType(households, { householdId, type: "other", familyRoles: {} }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(households.changeHouseholdType).not.toHaveBeenCalled();
  });

  it("NFR-SEC-001 hides a household the caller does not belong to", async () => {
    await expect(
      changeHouseholdType(gateway({ householdById: vi.fn(async () => null) }), {
        householdId,
        type: "other",
        familyRoles: {},
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("FR-HH-007 changes nothing but the type and the family roles", async () => {
    const households = gateway();
    await changeHouseholdType(households, {
      householdId,
      type: "family",
      familyRoles: { [lucia]: "parent", [marcos]: "child" },
    });
    expect(households.changeHouseholdType).toHaveBeenCalledExactlyOnceWith(householdId, "family", {
      [lucia]: "parent",
      [marcos]: "child",
    });
    expect(households.renameHousehold).not.toHaveBeenCalled();
  });

  it("FR-HH-007 sends no family roles when the new type is not a family", async () => {
    const households = gateway();
    await changeHouseholdType(households, {
      householdId,
      type: "other",
      familyRoles: { [lucia]: "parent" },
    });
    expect(households.changeHouseholdType).toHaveBeenCalledWith(householdId, "other", {});
  });

  it("FR-ACC-009 changes nothing when the type is the current one", async () => {
    const households = gateway();
    await changeHouseholdType(households, { householdId, type: "shared_flat", familyRoles: {} });
    expect(households.changeHouseholdType).not.toHaveBeenCalled();
  });

  it("FR-ACC-009 refuses single while other members belong", async () => {
    await expect(
      changeHouseholdType(gateway(), { householdId, type: "single", familyRoles: {} }),
    ).rejects.toEqual(new TypeChangeRefusedError("otherMembers"));
  });

  it("FR-HH-007 requires a family role for every member", async () => {
    const error = await changeHouseholdType(gateway(), {
      householdId,
      type: "family",
      familyRoles: { [lucia]: "parent" },
    }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).fieldErrors).toEqual([
      { field: `familyRoles.${marcos}`, code: "required" },
    ]);
  });

  it("FR-HH-007 requires at least one parent", async () => {
    const error = await changeHouseholdType(gateway(), {
      householdId,
      type: "family",
      familyRoles: { [lucia]: "relative", [marcos]: "child" },
    }).catch((caught: unknown) => caught);
    expect((error as ValidationError).fieldErrors).toEqual([
      { field: "familyRoles", code: "noParent" },
    ]);
  });
});

describe("setMemberRole", () => {
  it("FR-ACC-006 lets a flat owner make a member an owner", async () => {
    const households = gateway();
    await setMemberRole(households, { householdId, userId: marcos, role: "owner" });
    expect(households.setMemberRole).toHaveBeenCalledWith(householdId, marcos, "owner");
  });

  it("FR-ACC-006 lets an owner who is not a parent hand over ownership of a family", async () => {
    const households = familyGateway(pilar);
    await setMemberRole(households, { householdId, userId: pablo, role: "owner" });
    expect(households.setMemberRole).toHaveBeenCalledWith(householdId, pablo, "owner");
  });

  it("FR-ACC-006 does not let a member who is not an owner make anyone an owner", async () => {
    const households = gateway(asMarcos);
    await expect(
      setMemberRole(households, { householdId, userId: marcos, role: "owner" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(households.setMemberRole).not.toHaveBeenCalled();
  });

  it("FR-ACC-006 asks the only owner to make someone else owner before stepping down", async () => {
    const households = gateway();
    await expect(
      setMemberRole(households, { householdId, userId: lucia, role: "member" }),
    ).rejects.toEqual(new MemberChangeRefusedError("lastOwner"));
    expect(households.setMemberRole).not.toHaveBeenCalled();
  });

  it("NFR-SEC-001 refuses someone who is not a member of the household", async () => {
    await expect(
      setMemberRole(gateway(), { householdId, userId: pilar, role: "owner" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("NFR-SEC-001 hides a household the caller does not belong to", async () => {
    await expect(
      setMemberRole(gateway({ householdById: vi.fn(async () => null) }), {
        householdId,
        userId: marcos,
        role: "owner",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("changeFamilyRole", () => {
  it("FR-HH-006 lets a parent set a member's family role", async () => {
    const households = familyGateway(pablo);
    await changeFamilyRole(households, { householdId, userId: carla, familyRole: "relative" });
    expect(households.setFamilyRole).toHaveBeenCalledWith(householdId, carla, "relative");
  });

  it("FR-HH-008 does not let an owner who is a relative change family roles", async () => {
    const households = familyGateway(pilar);
    await expect(
      changeFamilyRole(households, { householdId, userId: carla, familyRole: "parent" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(households.setFamilyRole).not.toHaveBeenCalled();
  });

  it("FR-HH-006 asks the last parent to make someone else a parent first", async () => {
    const households = familyGateway(pablo);
    await expect(
      changeFamilyRole(households, { householdId, userId: pablo, familyRole: "relative" }),
    ).rejects.toEqual(new MemberChangeRefusedError("lastParent"));
    expect(households.setFamilyRole).not.toHaveBeenCalled();
  });

  it("FR-HH-006 changes nothing when the role is the current one", async () => {
    const households = familyGateway(pablo);
    await changeFamilyRole(households, { householdId, userId: carla, familyRole: "child" });
    expect(households.setFamilyRole).not.toHaveBeenCalled();
  });

  it("FR-HH-006 refuses family roles outside a family household", async () => {
    await expect(
      changeFamilyRole(gateway(), { householdId, userId: marcos, familyRole: "parent" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("NFR-SEC-001 reports a change the database refused as forbidden", async () => {
    const households = familyGateway(pablo, { setFamilyRole: vi.fn(async () => false) });
    await expect(
      changeFamilyRole(households, { householdId, userId: carla, familyRole: "relative" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("removeMember", () => {
  it("FR-ACC-006 lets a flat owner remove a member", async () => {
    const households = gateway();
    await removeMember(households, { householdId, userId: marcos });
    expect(households.removeMember).toHaveBeenCalledWith(householdId, marcos);
  });

  it("FR-ACC-006 does not let a member who is not an owner remove anyone", async () => {
    const households = gateway(asMarcos);
    await expect(removeMember(households, { householdId, userId: lucia })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(households.removeMember).not.toHaveBeenCalled();
  });

  it("FR-ACC-006 does not remove the caller, which is leaving the household", async () => {
    await expect(removeMember(gateway(), { householdId, userId: lucia })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("NFR-UX-002 does nothing for a member already removed, so a repeated request is harmless", async () => {
    const households = gateway();
    await removeMember(households, { householdId, userId: pilar });
    expect(households.removeMember).not.toHaveBeenCalled();
  });
});
