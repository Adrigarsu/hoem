import "server-only";
import { connection } from "next/server";
import { blockingLinks } from "./blocking-links";
import { accountGateway } from "./repository";
import { accountDeletionBlockers } from "./service";

// For Server Components: the households the signed-in user must hand over before deleting the account.
export async function ownDeletionBlockers() {
  // Per request only: Supabase reads the clock to check the session, which a prerender refuses.
  await connection();
  return blockingLinks(await accountDeletionBlockers(await accountGateway()));
}
