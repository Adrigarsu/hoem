import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { profileGateway } from "./repository";
import { currentProfile } from "./service";

// For Server Components. Cached per request, so the avatar, the sidebar and the greeting share one
// query.
export const ownProfile = cache(async () => {
  // Per request only: Supabase reads the clock to check the session, which a prerender refuses.
  await connection();
  return currentProfile(await profileGateway());
});
