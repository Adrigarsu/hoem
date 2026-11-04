import "server-only";
import { connection } from "next/server";
import { ownAccount } from "@/features/auth";
import { blockingLinks } from "./blocking-links";
import { accountGateway } from "./repository";
import { accountDeletionBlockers } from "./service";

// For Server Components: the households the signed-in user must hand over before deleting the account.
export async function ownDeletionBlockers() {
  // Per request only: Supabase reads the clock to check the session, which a prerender refuses.
  await connection();
  // A session ended on another device sends the user to sign in, as the rest of the page does,
  // instead of failing it. Cached per request, so Auth is asked once.
  await ownAccount();
  return blockingLinks(await accountDeletionBlockers(await accountGateway()));
}
