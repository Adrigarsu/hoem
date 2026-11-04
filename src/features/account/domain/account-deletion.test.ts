import { describe, expect, it } from "vitest";
import { confirmsDeletion, householdsToHandOver } from "./account-deletion";

const me = "00000000-0000-7000-8000-000000000001";
const other = "00000000-0000-7000-8000-000000000002";
type Member = {
  userId: string;
  role: "owner" | "member";
  familyRole?: "parent" | "child" | "relative" | null;
};
const household = (
  members: Member[],
  type: "single" | "family" | "shared_flat" = "shared_flat",
) => ({
  id: "00000000-0000-7000-8000-00000000a001",
  name: "Calle Mayor 5",
  type,
  members: members.map((member) => ({ familyRole: null, ...member })),
});

describe("confirmsDeletion", () => {
  it("FR-ACC-007 accepts the e-mail in any case and with surrounding spaces", () => {
    expect(confirmsDeletion("  LUCIA@Example.com ", "lucia@example.com")).toBe(true);
  });

  it("FR-ACC-007 refuses another e-mail", () => {
    expect(confirmsDeletion("ana@example.com", "lucia@example.com")).toBe(false);
  });

  it("FR-ACC-007 refuses an empty confirmation, even for an account without an e-mail", () => {
    expect(confirmsDeletion(" ", "")).toBe(false);
  });
});

describe("householdsToHandOver", () => {
  it("FR-ACC-007 blocks on a household where I am the only owner and others belong", () => {
    const flat = household([
      { userId: me, role: "owner" },
      { userId: other, role: "member" },
    ]);
    expect(householdsToHandOver([flat], me)).toEqual([{ ...flat, reasons: ["owner"] }]);
  });

  it("FR-ACC-007 does not block on a household I am alone in", () => {
    const home = household([{ userId: me, role: "owner", familyRole: "parent" }], "family");
    expect(householdsToHandOver([home], me)).toEqual([]);
  });

  it("FR-ACC-007 does not block on a household I do not own", () => {
    const flat = household([
      { userId: other, role: "owner" },
      { userId: me, role: "member" },
    ]);
    expect(householdsToHandOver([flat], me)).toEqual([]);
  });

  it("FR-ACC-007 does not block when there is another owner", () => {
    const flat = household([
      { userId: me, role: "owner" },
      { userId: other, role: "owner" },
    ]);
    expect(householdsToHandOver([flat], me)).toEqual([]);
  });

  it("FR-ACC-007 blocks on a family where I am the last parent and others belong", () => {
    const family = household(
      [
        { userId: other, role: "owner", familyRole: "relative" },
        { userId: me, role: "member", familyRole: "parent" },
      ],
      "family",
    );
    expect(householdsToHandOver([family], me)).toEqual([{ ...family, reasons: ["parent"] }]);
  });

  it("FR-ACC-007 does not block on a family with another parent", () => {
    const family = household(
      [
        { userId: other, role: "owner", familyRole: "parent" },
        { userId: me, role: "member", familyRole: "parent" },
      ],
      "family",
    );
    expect(householdsToHandOver([family], me)).toEqual([]);
  });

  it("FR-ACC-007 names both reasons when I am the last owner and the last parent", () => {
    const family = household(
      [
        { userId: me, role: "owner", familyRole: "parent" },
        { userId: other, role: "member", familyRole: "child" },
      ],
      "family",
    );
    expect(householdsToHandOver([family], me)).toEqual([
      { ...family, reasons: ["owner", "parent"] },
    ]);
  });

  it("FR-ACC-007 ignores family roles left over outside a family", () => {
    const flat = household([
      { userId: other, role: "owner" },
      { userId: me, role: "member", familyRole: "parent" },
    ]);
    expect(householdsToHandOver([flat], me)).toEqual([]);
  });
});
