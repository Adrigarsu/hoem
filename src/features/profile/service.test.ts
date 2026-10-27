import { describe, expect, it, vi } from "vitest";
import { NotAuthenticatedError, NotFoundError } from "@/lib/errors";
import { currentProfile, type ProfileGateway } from "./service";

const lucia = { displayName: "Lucía", timeZone: "Europe/Madrid" };

function gateway(overrides: Partial<ProfileGateway> = {}): ProfileGateway {
  return {
    signedInUserId: vi.fn(async () => "00000000-0000-7000-8000-000000000001"),
    profileById: vi.fn(async () => lucia),
    ...overrides,
  };
}

describe("currentProfile", () => {
  it("FR-DASH-001 returns the signed-in user's own profile", async () => {
    expect(await currentProfile(gateway())).toEqual(lucia);
  });

  it("NFR-SEC-001 asks only for the signed-in user's row, not whatever the policy lets through", async () => {
    const profiles = gateway();
    await currentProfile(profiles);
    expect(profiles.profileById).toHaveBeenCalledWith("00000000-0000-7000-8000-000000000001");
  });

  it("NFR-SEC-001 refuses without a session", async () => {
    await expect(
      currentProfile(gateway({ signedInUserId: vi.fn(async () => null) })),
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it("FR-DASH-001 reports a missing profile instead of greeting nobody", async () => {
    await expect(
      currentProfile(gateway({ profileById: vi.fn(async () => null) })),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
