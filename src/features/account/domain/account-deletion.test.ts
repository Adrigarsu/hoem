import { describe, expect, it } from "vitest";
import { confirmsDeletion, householdsNeedingNewOwner } from "./account-deletion";

const me = "00000000-0000-7000-8000-000000000001";
const other = "00000000-0000-7000-8000-000000000002";
const household = (members: { userId: string; role: "owner" | "member" }[]) => ({
  id: "00000000-0000-7000-8000-00000000a001",
  name: "Calle Mayor 5",
  members,
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

describe("householdsNeedingNewOwner", () => {
  it("FR-ACC-007 blocks on a household where I am the only owner and others belong", () => {
    const flat = household([
      { userId: me, role: "owner" },
      { userId: other, role: "member" },
    ]);
    expect(householdsNeedingNewOwner([flat], me)).toEqual([flat]);
  });

  it("FR-ACC-007 does not block on a household I am alone in", () => {
    const home = household([{ userId: me, role: "owner" }]);
    expect(householdsNeedingNewOwner([home], me)).toEqual([]);
  });

  it("FR-ACC-007 does not block on a household I do not own", () => {
    const flat = household([
      { userId: other, role: "owner" },
      { userId: me, role: "member" },
    ]);
    expect(householdsNeedingNewOwner([flat], me)).toEqual([]);
  });

  it("FR-ACC-007 does not block when there is another owner", () => {
    const flat = household([
      { userId: me, role: "owner" },
      { userId: other, role: "owner" },
    ]);
    expect(householdsNeedingNewOwner([flat], me)).toEqual([]);
  });
});
