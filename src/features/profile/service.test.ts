import { describe, expect, it, vi } from "vitest";
import { NotAuthenticatedError, NotFoundError } from "@/lib/errors";
import { currentProfile, type ProfileGateway } from "./service";

const lucia = { displayName: "Lucía", timeZone: "Europe/Madrid" };
const session = { id: "00000000-0000-7000-8000-000000000001", email: "lucia@example.com" };

function gateway(overrides: Partial<ProfileGateway> = {}): ProfileGateway {
  return {
    signedInUser: vi.fn(async () => session),
    profileById: vi.fn(async () => lucia),
    ...overrides,
  };
}

describe("currentProfile", () => {
  it("FR-DASH-001 returns the signed-in user's own profile", async () => {
    expect(await currentProfile(gateway())).toEqual({ ...lucia, email: session.email });
  });

  it("FR-NAV-003 returns the signed-in user's email from the verified session", async () => {
    expect(await currentProfile(gateway())).toMatchObject({ email: "lucia@example.com" });
  });

  it("NFR-SEC-001 asks only for the signed-in user's row, not whatever the policy lets through", async () => {
    const profiles = gateway();
    await currentProfile(profiles);
    expect(profiles.profileById).toHaveBeenCalledWith("00000000-0000-7000-8000-000000000001");
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
});
