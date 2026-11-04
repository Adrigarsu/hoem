import { describe, expect, it } from "vitest";
import { memberPermissions, type MemberRoles } from "./member-rules";

const lucia = "lucia";
const marcos = "marcos";
const pilar = "pilar";
const pablo = "pablo";
const carla = "carla";
const rosa = "rosa";

const flat: MemberRoles[] = [
  { userId: lucia, role: "owner", familyRole: null },
  { userId: marcos, role: "member", familyRole: null },
];

const family: MemberRoles[] = [
  { userId: pilar, role: "owner", familyRole: "parent" },
  { userId: pablo, role: "member", familyRole: "parent" },
  { userId: carla, role: "member", familyRole: "child" },
  { userId: rosa, role: "member", familyRole: "relative" },
];

describe("memberPermissions", () => {
  it("FR-ACC-006 lets a flat owner make a member owner or remove them", () => {
    expect(memberPermissions("shared_flat", flat, lucia, marcos)).toEqual({
      makeOwner: "allowed",
      remove: "allowed",
    });
  });

  it("FR-ACC-006 refuses a flat member any change", () => {
    expect(memberPermissions("shared_flat", flat, marcos, lucia)).toEqual({});
  });

  it("FR-ACC-006 offers a member nothing on their own row", () => {
    expect(memberPermissions("shared_flat", flat, marcos, marcos)).toEqual({});
  });

  it("FR-ACC-006 asks the only owner to make someone else owner before stepping down", () => {
    expect(memberPermissions("shared_flat", flat, lucia, lucia)).toEqual({ stepDown: "lastOwner" });
  });

  it("FR-ACC-006 lets an owner step down while another owner remains", () => {
    const twoOwners = flat.map((member) => ({ ...member, role: "owner" as const }));
    expect(memberPermissions("shared_flat", twoOwners, lucia, lucia)).toEqual({
      stepDown: "allowed",
    });
  });

  it("FR-ACC-006 lets an owner remove another owner or make them a member", () => {
    const twoOwners = flat.map((member) => ({ ...member, role: "owner" as const }));
    expect(memberPermissions("shared_flat", twoOwners, lucia, marcos)).toEqual({
      stepDown: "allowed",
      remove: "allowed",
    });
  });

  it("FR-HH-006 lets a parent set the family role of a member and remove them", () => {
    expect(memberPermissions("family", family, pablo, carla)).toEqual({
      familyRole: "allowed",
      remove: "allowed",
    });
  });

  it("FR-HH-006 does not let a parent who is not an owner change or remove an owner", () => {
    expect(memberPermissions("family", family, pablo, pilar)).toEqual({});
  });

  it("FR-HH-006 lets the owner parent make someone owner and set their family role", () => {
    expect(memberPermissions("family", family, pilar, rosa)).toEqual({
      makeOwner: "allowed",
      familyRole: "allowed",
      remove: "allowed",
    });
  });

  it("FR-HH-008 gives a relative no role changes", () => {
    expect(memberPermissions("family", family, rosa, carla)).toEqual({});
  });

  it("FR-HH-006 gives a child no role changes", () => {
    expect(memberPermissions("family", family, carla, rosa)).toEqual({});
  });

  it("FR-ACC-006 lets an owner who is not a parent hand over ownership, but not family roles", () => {
    const relativeOwner = family.map((member) =>
      member.userId === pilar ? { ...member, familyRole: "relative" as const } : member,
    );
    expect(memberPermissions("family", relativeOwner, pilar, rosa)).toEqual({
      makeOwner: "allowed",
    });
  });

  it("FR-HH-006 asks the last parent to make someone else a parent before stopping being one", () => {
    const oneParent = family.map((member) =>
      member.userId === pilar ? { ...member, familyRole: "relative" as const } : member,
    );
    expect(memberPermissions("family", oneParent, pablo, pablo)).toEqual({
      familyRole: "lastParent",
    });
  });

  it("FR-HH-006 lets a parent change their own family role while another parent remains", () => {
    expect(memberPermissions("family", family, pablo, pablo)).toEqual({ familyRole: "allowed" });
  });

  it("FR-HH-006 ignores family roles left outside a family household", () => {
    const leftover = flat.map((member) => ({ ...member, familyRole: "parent" as const }));
    expect(memberPermissions("shared_flat", leftover, lucia, marcos)).toEqual({
      makeOwner: "allowed",
      remove: "allowed",
    });
  });
});
