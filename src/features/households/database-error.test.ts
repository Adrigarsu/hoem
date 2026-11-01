import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import { databaseError } from "./database-error";
import { MinorCannotCreateError, TypeChangeRefusedError } from "./service";

describe("databaseError", () => {
  it("FR-ACC-009 recognises 'single' with other members by its code, whatever the message says", () => {
    expect(databaseError({ code: "23514", message: "reworded", hint: "other_members" })).toEqual(
      new TypeChangeRefusedError("otherMembers"),
    );
  });

  it("NFR-LEG-001 recognises a family that must stay one because of a minor", () => {
    expect(databaseError({ code: "23514", message: "reworded", hint: "minor_member" })).toEqual(
      new TypeChangeRefusedError("minor"),
    );
  });

  it("NFR-LEG-001 recognises a minor trying to create a household", () => {
    expect(
      databaseError({ code: "42501", message: "reworded", hint: "minor_creator" }),
    ).toBeInstanceOf(MinorCannotCreateError);
  });

  it("NFR-SEC-001 turns any other refused privilege into a forbidden error", () => {
    const error = databaseError({ code: "42501", message: "not yours", hint: "not_owner" });
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error).not.toBeInstanceOf(MinorCannotCreateError);
  });

  it("NFR-SEC-001 leaves an unknown fault as a plain error, to be logged and never shown", () => {
    const error = databaseError({ code: "XX000", message: "boom", hint: null });
    expect(error).not.toBeInstanceOf(ForbiddenError);
    expect(error).toMatchObject({ message: "boom", code: "XX000" });
  });
});
