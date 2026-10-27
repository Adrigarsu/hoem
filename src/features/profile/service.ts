import { NotAuthenticatedError, NotFoundError } from "@/lib/errors";

export type OwnProfile = { displayName: string; timeZone: string };

export type ProfileGateway = {
  // From the verified session, never from the request.
  signedInUserId(): Promise<string | null>;
  profileById(userId: string): Promise<OwnProfile | null>;
};

// The signed-in user's own profile. The query names the user's own id although row-level security
// already limits it, so it stays correct when other policies let members see each other's names
// (authorization twice, AGENTS.md).
export async function currentProfile(gateway: ProfileGateway): Promise<OwnProfile> {
  const userId = await gateway.signedInUserId();
  if (!userId) throw new NotAuthenticatedError();
  const profile = await gateway.profileById(userId);
  // handle_new_user creates the profile with the account, so a missing one is a broken account.
  if (!profile) throw new NotFoundError("Profile not found");
  return profile;
}
