import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { sessionEndedPath } from "./end-session";
import { authGateway } from "./repository";

// For Server Components: Account settings and the password page. Cached per request; it asks
// Supabase Auth over the network, so the rest of the app keeps reading the session token instead.
export const ownAccount = cache(async () => {
  // Per request only: Supabase reads the clock to check the session, which a prerender refuses.
  await connection();
  const account = await (await authGateway()).account();
  // The token is still valid, so the proxy let the request in, but the session is gone: a Server
  // Component cannot clear cookies, so a route handler does.
  if (!account) redirect(sessionEndedPath);
  return account;
});
