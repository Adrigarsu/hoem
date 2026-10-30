import { describe, expect, it, vi } from "vitest";
import {
  ForbiddenError,
  NotAuthenticatedError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import {
  changeHouseholdType,
  createHousehold,
  householdSettings,
  myHouseholds,
  renameHousehold,
  TypeChangeRefusedError,
  type HouseholdGateway,
  type Member,
} from "./service";

const householdId = "00000000-0000-7000-8000-00000000a001";
const lucia = "00000000-0000-7000-8000-000000000001";
const marcos = "00000000-0000-7000-8000-000000000002";

const flat = { id: householdId, name: "Calle Mayor 5", type: "shared_flat" as const };
const flatmates: Member[] = [
  { userId: lucia, role: "owner", familyRole: null },
  { userId: marcos, role: "member", familyRole: null },
];

function gateway(overrides: Partial<HouseholdGateway> = {}): HouseholdGateway {
  return {
    signedInUserId: vi.fn(async () => lucia),
    createHousehold: vi.fn(async () => householdId),
    myHouseholds: vi.fn(async () => [flat]),
    householdById: vi.fn(async () => flat),
    membersOf: vi.fn(async () => flatmates),
    renameHousehold: vi.fn(async () => {}),
    changeHouseholdType: vi.fn(async () => {}),
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

describe("myHouseholds", () => {
  it("FR-ACC-004 lists the households the user belongs to", async () => {
    expect(await myHouseholds(gateway())).toEqual([flat]);
  });

  it("FR-ACC-004 refuses without a session", async () => {
    await expect(
      myHouseholds(gateway({ signedInUserId: vi.fn(async () => null) })),
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});

describe("householdSettings", () => {
  it("FR-ACC-009 shows the household with the caller's role and the members in order", async () => {
    expect(await householdSettings(gateway(), householdId)).toEqual({
      ...flat,
      isOwner: true,
      members: [
        { userId: lucia, role: "owner", familyRole: null, isYou: true },
        { userId: marcos, role: "member", familyRole: null, isYou: false },
      ],
    });
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
