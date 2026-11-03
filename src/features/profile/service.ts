import { NotAuthenticatedError, NotFoundError, ValidationError } from "@/lib/errors";
import type { Theme } from "@/lib/theme/theme";
import { uuidV7 } from "@/lib/uuid-v7";
import { avatarRejection } from "./domain/avatar-rules";
import type { NameInput, ThemeInput } from "./schemas";

type StoredProfile = {
  displayName: string;
  timeZone: string;
  theme: Theme;
  avatarPath: string | null;
};

export type OwnProfile = Omit<StoredProfile, "avatarPath"> & {
  email: string;
  avatarUrl: string | null;
};

type ProfileChanges = Partial<Pick<StoredProfile, "displayName" | "theme" | "avatarPath">>;

export type ProfileGateway = {
  // From the verified session, never from the request. The email is the account's own, so only
  // its owner ever sees it.
  signedInUser(): Promise<{ id: string; email: string } | null>;
  profileById(userId: string): Promise<StoredProfile | null>;
  updateProfile(userId: string, changes: ProfileChanges): Promise<void>;
  uploadAvatar(path: string, image: Uint8Array): Promise<void>;
  removeAvatar(path: string): Promise<void>;
  avatarFiles(userId: string): Promise<string[]>;
  avatarUrl(path: string): Promise<string>;
};

// The file is not an image the encoder can read. Any other failure of the encoder is ours.
export class UnreadableImageError extends Error {}

// Turns an uploaded image into what is stored.
export type AvatarEncoder = (image: Uint8Array) => Promise<Uint8Array>;

async function requireUser(gateway: ProfileGateway) {
  const user = await gateway.signedInUser();
  if (!user) throw new NotAuthenticatedError();
  return user;
}

// A photo that cannot be signed must not break every page: the Avatar shows the initials instead.
async function signedAvatarUrl(gateway: ProfileGateway, path: string | null) {
  if (!path) return null;
  try {
    return await gateway.avatarUrl(path);
  } catch {
    return null;
  }
}

// The signed-in user's own profile. The query names the user's own id although row-level security
// already limits it, so it stays correct when other policies let members see each other's names
// (authorization twice, AGENTS.md).
export async function currentProfile(gateway: ProfileGateway): Promise<OwnProfile> {
  const user = await requireUser(gateway);
  const profile = await gateway.profileById(user.id);
  // handle_new_user creates the profile with the account, so a missing one is a broken account.
  if (!profile) throw new NotFoundError("Profile not found");
  const { avatarPath, ...rest } = profile;
  return {
    ...rest,
    email: user.email,
    avatarUrl: await signedAvatarUrl(gateway, avatarPath),
  };
}

export async function updateName(gateway: ProfileGateway, input: NameInput) {
  const user = await requireUser(gateway);
  await gateway.updateProfile(user.id, { displayName: input.name });
}

export async function updateTheme(gateway: ProfileGateway, input: ThemeInput) {
  const user = await requireUser(gateway);
  await gateway.updateProfile(user.id, { theme: input.theme });
}

function rejected(code: string) {
  return new ValidationError([{ field: "photo", code }]);
}

// Only the re-encoded image is stored: a phone's photo carries its location in its metadata, and
// people in the user's households can load the file.
async function encodedAvatar(encode: AvatarEncoder, image: Uint8Array) {
  const rejection = avatarRejection({ size: image.byteLength, head: image });
  if (rejection) throw rejected(rejection);
  try {
    return await encode(image);
  } catch (error) {
    if (error instanceof UnreadableImageError) throw rejected("wrongType");
    throw error;
  }
}

// The profile moves to the new file only once it is stored, so a failure leaves the old photo.
export async function changeAvatar(
  gateway: ProfileGateway,
  encode: AvatarEncoder,
  image: Uint8Array,
) {
  const user = await requireUser(gateway);
  const encoded = await encodedAvatar(encode, image);
  const path = `${user.id}/${uuidV7()}.webp`;

  await gateway.uploadAvatar(path, encoded);
  try {
    await gateway.updateProfile(user.id, { avatarPath: path });
  } catch (error) {
    await gateway.removeAvatar(path).catch(() => undefined);
    throw error;
  }
  await removeOtherAvatars(gateway, user.id, path);
}

// Everything else in the folder, not only the last photo: household members can read these files,
// so one that a failed delete left behind goes with the next change. The new photo is already in
// place, so a failure here is logged rather than reported to the user.
async function removeOtherAvatars(gateway: ProfileGateway, userId: string, keep: string) {
  try {
    const files = await gateway.avatarFiles(userId);
    await Promise.all(
      files.filter((file) => file !== keep).map((file) => gateway.removeAvatar(file)),
    );
  } catch (error) {
    console.error("Could not remove old avatar files", error);
  }
}
