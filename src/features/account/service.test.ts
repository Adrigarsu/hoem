import { afterEach, describe, expect, it, vi } from "vitest";
import { NotAuthenticatedError } from "@/lib/errors";
import {
  accountDeletionBlockers,
  deleteAccount,
  LastOwnerError,
  WrongConfirmationError,
  type AccountGateway,
} from "./service";

const userId = "00000000-0000-7000-8000-000000000001";
const email = "lucia@example.com";
const photo = `${userId}/photo.webp`;
const flat = {
  id: "00000000-0000-7000-8000-00000000a001",
  name: "Calle Mayor 5",
  members: [
    { userId, role: "owner" as const },
    { userId: "00000000-0000-7000-8000-000000000002", role: "member" as const },
  ],
};
const input = { confirmation: email };
const down = () => vi.fn(async () => Promise.reject(new Error("down")));

function gateway(overrides: Partial<AccountGateway> = {}): AccountGateway {
  return {
    signedInUser: vi.fn(async () => ({ id: userId, email })),
    myHouseholds: vi.fn(async () => []),
    avatarFiles: vi.fn(async () => [photo]),
    clearAvatarPath: vi.fn(async () => undefined),
    removeAvatars: vi.fn(async () => undefined),
    deleteOwnAccount: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("accountDeletionBlockers", () => {
  it("FR-ACC-007 names the households that need a new owner first", async () => {
    const account = gateway({ myHouseholds: vi.fn(async () => [flat]) });
    expect(await accountDeletionBlockers(account)).toEqual([{ id: flat.id, name: flat.name }]);
  });

  it("FR-ACC-007 refuses to look without a session", async () => {
    const account = gateway({ signedInUser: vi.fn(async () => null) });
    await expect(accountDeletionBlockers(account)).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});

describe("deleteAccount", () => {
  it("FR-ACC-007 refuses without a session", async () => {
    const account = gateway({ signedInUser: vi.fn(async () => null) });
    await expect(deleteAccount(account, input)).rejects.toBeInstanceOf(NotAuthenticatedError);
    expect(account.deleteOwnAccount).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 a wrong e-mail deletes nothing, not even the photo", async () => {
    const account = gateway();
    await expect(
      deleteAccount(account, { confirmation: "ana@example.com" }),
    ).rejects.toBeInstanceOf(WrongConfirmationError);
    expect(account.removeAvatars).not.toHaveBeenCalled();
    expect(account.deleteOwnAccount).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 the last owner of a shared household deletes nothing, not even the photo", async () => {
    const account = gateway({ myHouseholds: vi.fn(async () => [flat]) });
    await expect(deleteAccount(account, input)).rejects.toBeInstanceOf(LastOwnerError);
    expect(account.clearAvatarPath).not.toHaveBeenCalled();
    expect(account.removeAvatars).not.toHaveBeenCalled();
    expect(account.deleteOwnAccount).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 removes the photos, then the account, then the session", async () => {
    const steps: string[] = [];
    const step = (name: string) =>
      vi.fn(async () => {
        steps.push(name);
      });
    await deleteAccount(
      gateway({
        clearAvatarPath: step("clear path"),
        removeAvatars: step("remove photos"),
        deleteOwnAccount: step("delete account"),
        signOut: step("sign out"),
      }),
      input,
    );
    expect(steps).toEqual(["clear path", "remove photos", "delete account", "sign out"]);
  });

  it("FR-ACC-007 removes every file in the user's folder", async () => {
    const account = gateway();
    await deleteAccount(account, input);
    expect(account.removeAvatars).toHaveBeenCalledWith([photo]);
  });

  it("FR-ACC-007 an account without photos has none to remove", async () => {
    const account = gateway({ avatarFiles: vi.fn(async () => []) });
    await deleteAccount(account, input);
    expect(account.removeAvatars).not.toHaveBeenCalled();
    expect(account.deleteOwnAccount).toHaveBeenCalled();
  });

  it("FR-ACC-007 sends the database the e-mail without the spaces around it", async () => {
    const account = gateway();
    await deleteAccount(account, { confirmation: "  Lucia@example.com " });
    expect(account.deleteOwnAccount).toHaveBeenCalledWith("Lucia@example.com");
  });

  it("FR-ACC-007 keeps the account when a photo cannot be removed", async () => {
    const account = gateway({ removeAvatars: down() });
    await expect(deleteAccount(account, input)).rejects.toThrow("down");
    expect(account.deleteOwnAccount).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 does not sign out when the account could not be deleted", async () => {
    const account = gateway({ deleteOwnAccount: down() });
    await expect(deleteAccount(account, input)).rejects.toThrow("down");
    expect(account.signOut).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 a failed sign-out after deleting still counts as deleted", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const account = gateway({ signOut: down() });
    await expect(deleteAccount(account, input)).resolves.toBeUndefined();
  });
});
