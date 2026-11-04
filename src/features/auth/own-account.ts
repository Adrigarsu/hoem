import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { authGateway } from "./repository";
import { currentAccount } from "./service";

// For Server Components: Account settings and the password page. Cached per request; it asks
// Supabase Auth over the network, so the rest of the app keeps reading the session token instead.
export const ownAccount = cache(async () => {
  // Per request only: Supabase reads the clock to check the session, which a prerender refuses.
  await connection();
  return currentAccount(await authGateway());
});
