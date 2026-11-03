import { describe, expect, it, vi } from "vitest";
import { NotAuthenticatedError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  changeAvatar,
  currentProfile,
  updateName,
  updateTheme,
  UnreadableImageError,
  type AvatarEncoder,
  type ProfileGateway,
} from "./service";

const userId = "00000000-0000-7000-8000-000000000001";
const stored = {
  displayName: "Lucía",
  timeZone: "Europe/Madrid",
  theme: "system" as const,
  avatarPath: null,
};
const session = { id: userId, email: "lucia@example.com" };
const oldPath = `${userId}/old.webp`;
const png = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const webp = Uint8Array.of(1, 2, 3);
const encoder: AvatarEncoder = async () => webp;

function gateway(overrides: Partial<ProfileGateway> = {}): ProfileGateway {
  return {
    signedInUser: vi.fn(async () => session),
    profileById: vi.fn(async () => stored),
    updateProfile: vi.fn(async () => undefined),
    uploadAvatar: vi.fn(async () => undefined),
    removeAvatar: vi.fn(async () => undefined),
    avatarFiles: vi.fn(async () => []),
    avatarUrl: vi.fn(async () => "https://storage.test/signed"),
    ...overrides,
  };
}

const withPhoto = () => vi.fn(async () => ({ ...stored, avatarPath: oldPath }));

function uploadedPath(profiles: ProfileGateway): unknown {
  return vi.mocked(profiles.uploadAvatar).mock.calls[0]?.[0];
}

describe("currentProfile", () => {
  it("FR-DASH-001 returns the signed-in user's own profile", async () => {
    expect(await currentProfile(gateway())).toEqual({
      displayName: "Lucía",
      timeZone: "Europe/Madrid",
      theme: "system",
      avatarUrl: null,
      email: session.email,
    });
  });

  it("FR-NAV-003 returns the signed-in user's email from the verified session", async () => {
    expect(await currentProfile(gateway())).toMatchObject({ email: "lucia@example.com" });
  });

  it("NFR-SEC-001 asks only for the signed-in user's row, not whatever the policy lets through", async () => {
    const profiles = gateway();
    await currentProfile(profiles);
    expect(profiles.profileById).toHaveBeenCalledWith(userId);
  });

  it("NFR-SEC-001 refuses without a session", async () => {
    await expect(
      currentProfile(gateway({ signedInUser: vi.fn(async () => null) })),
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it("FR-DASH-001 reports a missing profile instead of greeting nobody", async () => {
    await expect(
      currentProfile(gateway({ profileById: vi.fn(async () => null) })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("FR-ACC-007 signs a URL for the user's photo", async () => {
    const profile = await currentProfile(gateway({ profileById: withPhoto() }));
    expect(profile.avatarUrl).toBe("https://storage.test/signed");
  });

  it("FR-ACC-007 falls back to the initials when the photo cannot be signed", async () => {
    const profile = await currentProfile(
      gateway({
        profileById: withPhoto(),
        avatarUrl: vi.fn(async () => {
          throw new Error("storage down");
        }),
      }),
    );
    expect(profile.avatarUrl).toBeNull();
  });
});

describe("updateName", () => {
  it("FR-ACC-007 changes the signed-in user's own name", async () => {
    const profiles = gateway();
    await updateName(profiles, { name: "Lucía G." });
    expect(profiles.updateProfile).toHaveBeenCalledWith(userId, { displayName: "Lucía G." });
  });

  it("NFR-SEC-001 refuses without a session", async () => {
    await expect(
      updateName(gateway({ signedInUser: vi.fn(async () => null) }), { name: "Lucía G." }),
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});

describe("updateTheme", () => {
  it("FR-ACC-007 stores the chosen theme in the profile, so it follows the user", async () => {
    const profiles = gateway();
    await updateTheme(profiles, { theme: "dark" });
    expect(profiles.updateProfile).toHaveBeenCalledWith(userId, { theme: "dark" });
  });

  it("NFR-SEC-001 refuses without a session", async () => {
    await expect(
      updateTheme(gateway({ signedInUser: vi.fn(async () => null) }), { theme: "dark" }),
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});

describe("changeAvatar", () => {
  it("FR-ACC-007 stores the re-encoded image, never the original", async () => {
    const profiles = gateway();
    await changeAvatar(profiles, encoder, png);
    expect(vi.mocked(profiles.uploadAvatar).mock.calls[0]?.[1]).toBe(webp);
  });

  it("FR-ACC-007 stores the photo in the user's own folder under a UUID v7", async () => {
    const profiles = gateway();
    await changeAvatar(profiles, encoder, png);
    expect(uploadedPath(profiles)).toMatch(
      new RegExp(
        `^${userId}/[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.webp$`,
      ),
    );
  });

  it("FR-ACC-007 points the profile at the new file", async () => {
    const profiles = gateway();
    await changeAvatar(profiles, encoder, png);
    expect(profiles.updateProfile).toHaveBeenCalledWith(userId, {
      avatarPath: uploadedPath(profiles),
    });
  });

  it("FR-ACC-007 removes the previous avatar file after replacing it", async () => {
    const profiles = gateway({ avatarFiles: vi.fn(async () => [oldPath]) });
    await changeAvatar(profiles, encoder, png);
    expect(profiles.removeAvatar).toHaveBeenCalledWith(oldPath);
  });

  it("FR-ACC-007 also removes a file an earlier failed delete left behind", async () => {
    const leftover = `${userId}/leftover.webp`;
    const profiles = gateway({ avatarFiles: vi.fn(async () => [oldPath, leftover]) });
    await changeAvatar(profiles, encoder, png);
    expect(profiles.removeAvatar).toHaveBeenCalledWith(leftover);
  });

  it("FR-ACC-007 never removes the new photo", async () => {
    const profiles = gateway();
    vi.mocked(profiles.avatarFiles).mockImplementation(async () => [
      String(uploadedPath(profiles)),
    ]);
    await changeAvatar(profiles, encoder, png);
    expect(profiles.removeAvatar).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 removes nothing when the user had no photo", async () => {
    const profiles = gateway();
    await changeAvatar(profiles, encoder, png);
    expect(profiles.removeAvatar).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 keeps the old avatar when the new one is rejected", async () => {
    const profiles = gateway({ profileById: withPhoto() });
    await expect(
      changeAvatar(profiles, encoder, new TextEncoder().encode("%PDF-1.7")),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(profiles.uploadAvatar).not.toHaveBeenCalled();
    expect(profiles.updateProfile).not.toHaveBeenCalled();
    expect(profiles.removeAvatar).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 rejects a file that claims to be an image but cannot be decoded", async () => {
    const profiles = gateway();
    const broken: AvatarEncoder = async () => {
      throw new UnreadableImageError();
    };
    await expect(changeAvatar(profiles, broken, png)).rejects.toBeInstanceOf(ValidationError);
    expect(profiles.uploadAvatar).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 does not blame the file when the encoder itself fails", async () => {
    const failing: AvatarEncoder = async () => {
      throw new Error("out of memory");
    };
    await expect(changeAvatar(gateway(), failing, png)).rejects.toThrow("out of memory");
  });

  it("FR-ACC-007 keeps the old avatar when the upload fails", async () => {
    const profiles = gateway({
      profileById: withPhoto(),
      uploadAvatar: vi.fn(async () => {
        throw new Error("storage down");
      }),
    });
    await expect(changeAvatar(profiles, encoder, png)).rejects.toThrow("storage down");
    expect(profiles.updateProfile).not.toHaveBeenCalled();
    expect(profiles.removeAvatar).not.toHaveBeenCalled();
  });

  it("FR-ACC-007 removes the new file and keeps the old one when the profile cannot be updated", async () => {
    const profiles = gateway({
      profileById: withPhoto(),
      updateProfile: vi.fn(async () => {
        throw new Error("database down");
      }),
    });
    await expect(changeAvatar(profiles, encoder, png)).rejects.toThrow("database down");
    expect(profiles.removeAvatar).toHaveBeenCalledTimes(1);
    expect(profiles.removeAvatar).toHaveBeenCalledWith(uploadedPath(profiles));
  });

  it("FR-ACC-007 succeeds even if the previous file cannot be removed, and logs it", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const profiles = gateway({
      avatarFiles: vi.fn(async () => [oldPath]),
      removeAvatar: vi.fn(async () => {
        throw new Error("storage down");
      }),
    });
    await expect(changeAvatar(profiles, encoder, png)).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalledTimes(1);
    logged.mockRestore();
  });

  it("NFR-SEC-001 refuses without a session", async () => {
    await expect(
      changeAvatar(gateway({ signedInUser: vi.fn(async () => null) }), encoder, png),
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});
