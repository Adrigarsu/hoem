import { describe, expect, it } from "vitest";
import { familyRoleProblems, typeChangeBlock } from "./type-change";

const lucia = "00000000-0000-7000-8000-000000000001";
const marcos = "00000000-0000-7000-8000-000000000002";
const ana = "00000000-0000-7000-8000-000000000003";

describe("typeChangeBlock", () => {
  it("FR-ACC-009 does not let a household with other members become single", () => {
    expect(typeChangeBlock("single", 2)).toBe("otherMembers");
  });

  it("FR-ACC-009 lets a household of one become single", () => {
    expect(typeChangeBlock("single", 0)).toBeNull();
  });

  it("FR-ACC-009 lets a household with other members take any other type", () => {
    expect(typeChangeBlock("family", 2)).toBeNull();
  });
});

describe("familyRoleProblems", () => {
  it("FR-HH-007 accepts a role for every member with at least one parent", () => {
    expect(familyRoleProblems([lucia, marcos], { [lucia]: "parent", [marcos]: "child" })).toEqual({
      missing: [],
      noParent: false,
    });
  });

  it("FR-HH-007 lists the members without a role, in member order", () => {
    expect(familyRoleProblems([lucia, marcos, ana], { [marcos]: "child" })).toEqual({
      missing: [lucia, ana],
      noParent: false,
    });
  });

  it("FR-HH-007 asks for a parent only once every member has a role", () => {
    expect(familyRoleProblems([lucia, marcos], { [lucia]: "relative" })).toEqual({
      missing: [marcos],
      noParent: false,
    });
  });

  it("FR-HH-007 needs at least one parent, whoever is owner", () => {
    expect(familyRoleProblems([lucia, marcos], { [lucia]: "relative", [marcos]: "child" })).toEqual(
      { missing: [], noParent: true },
    );
  });

  it("FR-HH-007 ignores roles for people who are not members", () => {
    expect(familyRoleProblems([lucia], { [lucia]: "child", [marcos]: "parent" })).toEqual({
      missing: [],
      noParent: true,
    });
  });
});
