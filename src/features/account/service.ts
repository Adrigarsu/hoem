import { ConflictError, NotAuthenticatedError, ValidationError } from "@/lib/errors";
import {
  confirmsDeletion,
  householdsToHandOver,
  type HandOverReason,
} from "./domain/account-deletion";
import type { DeleteAccountInput } from "./schemas";

export type BlockingHousehold = { id: string; name: string; reasons: HandOverReason[] };

type HouseholdWithMembers = {
  id: string;
  name: string;
  type: string;
  members: {
    userId: string;
    role: "owner" | "member";
    familyRole: "parent" | "child" | "relative" | null;
  }[];
};

export type AccountGateway = {
  // From the verified session, never from the request.
  signedInUser(): Promise<{ id: string; email: string } | null>;
  myHouseholds(): Promise<HouseholdWithMembers[]>;
  avatarFiles(userId: string): Promise<string[]>;
  clearAvatarPath(userId: string): Promise<void>;
  removeAvatars(paths: string[]): Promise<void>;
  deleteOwnAccount(confirmation: string): Promise<void>;
  signOut(): Promise<void>;
};

export class WrongConfirmationError extends ValidationError {
  constructor() {
    super([{ field: "confirmation", code: "wrongEmail" }]);
  }
}

// The last owner of a household with other members, or the last parent of such a family.
export class HandOverFirstError extends ConflictError {
  constructor(readonly households: BlockingHousehold[] = []) {
    super("A household with other members needs another owner or parent first");
  }
}

async function requireUser(gateway: AccountGateway) {
  const user = await gateway.signedInUser();
  if (!user) throw new NotAuthenticatedError();
  return user;
}

async function blockersFor(gateway: AccountGateway, userId: string): Promise<BlockingHousehold[]> {
  const households = householdsToHandOver(await gateway.myHouseholds(), userId);
  return households.map(({ id, name, reasons }) => ({ id, name, reasons }));
}

export async function accountDeletionBlockers(gateway: AccountGateway) {
  const user = await requireUser(gateway);
  return blockersFor(gateway, user.id);
}

// Files first (ADR-019): if removing them fails the account stays and the user can retry, while a
// photo left behind by a deleted account could never be removed. The path is cleared before the files
// go, so nothing keeps pointing at a missing file if the deletion is then refused.
async function removePhotos(gateway: AccountGateway, userId: string) {
  const files = await gateway.avatarFiles(userId);
  if (files.length === 0) return;
  await gateway.clearAvatarPath(userId);
  await gateway.removeAvatars(files);
}

export async function deleteAccount(gateway: AccountGateway, input: DeleteAccountInput) {
  const user = await requireUser(gateway);
  if (!confirmsDeletion(input.confirmation, user.email)) throw new WrongConfirmationError();

  const blockers = await blockersFor(gateway, user.id);
  if (blockers.length > 0) throw new HandOverFirstError(blockers);

  await removePhotos(gateway, user.id);
  await gateway.deleteOwnAccount(input.confirmation.trim());

  // The account is gone, and so are its sessions: this only clears this browser's cookies, so a
  // failure must not tell the user that the deletion failed.
  try {
    await gateway.signOut();
  } catch (error) {
    console.error("Could not clear the session of a deleted account", error);
  }
}
