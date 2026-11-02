import { NotAuthenticatedError, NotFoundError } from "@/lib/errors";

type StoredProfile = { displayName: string; timeZone: string };

export type OwnProfile = StoredProfile & { email: string };

export type ProfileGateway = {
  // From the verified session, never from the request. The email is the account's own, so only
  // its owner ever sees it.
  signedInUser(): Promise<{ id: string; email: string } | null>;
  profileById(userId: string): Promise<StoredProfile | null>;
};

// The signed-in user's own profile. The query names the user's own id although row-level security
// already limits it, so it stays correct when other policies let members see each other's names
// (authorization twice, AGENTS.md).
export async function currentProfile(gateway: ProfileGateway): Promise<OwnProfile> {
  const user = await gateway.signedInUser();
  if (!user) throw new NotAuthenticatedError();
  const profile = await gateway.profileById(user.id);
  // handle_new_user creates the profile with the account, so a missing one is a broken account.
  if (!profile) throw new NotFoundError("Profile not found");
  return { ...profile, email: user.email };
}
