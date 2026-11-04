import { beforeEach, describe, expect, it, vi } from "vitest";
import { removeHouseholdMember } from "@/features/households";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { DELETE } from "./route";

vi.mock("@/features/households", () => ({ removeHouseholdMember: vi.fn(async () => undefined) }));

const householdId = "00000000-0000-7000-8000-00000000a001";
const userId = "00000000-0000-7000-8000-000000000002";
const path = `/api/v1/households/${householdId}/members/${userId}`;
const site = { host: "hoemapp.com", "x-forwarded-proto": "https" };

function call(headers: Record<string, string>) {
  return DELETE(
    new Request(`https://hoemapp.com${path}`, {
      method: "DELETE",
      headers: { ...site, ...headers },
    }),
    { params: Promise.resolve({ id: householdId, userId }) },
  );
}

beforeEach(() => vi.clearAllMocks());

describe("DELETE /api/v1/households/{id}/members/{userId}", () => {
  it("FR-ACC-006 removes the member as the session's user and answers 204", async () => {
    const response = await call({ origin: "https://hoemapp.com" });
    expect(response.status).toBe(204);
    expect(removeHouseholdMember).toHaveBeenCalledWith({ householdId, userId }, {});
  });

  it("FR-ACC-006 removes the member as the Bearer token's user", async () => {
    await call({ authorization: "Bearer eyJ.token.sig" });
    expect(removeHouseholdMember).toHaveBeenCalledWith(
      { householdId, userId },
      { accessToken: "eyJ.token.sig" },
    );
  });

  it("NFR-SEC-006 answers 403 to a cookie request from another origin and removes nobody", async () => {
    const response = await call({ origin: "https://evil.example" });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ instance: path });
    expect(removeHouseholdMember).not.toHaveBeenCalled();
  });

  it("FR-ACC-006 answers 403 Problem Details when the caller may not remove members", async () => {
    vi.mocked(removeHouseholdMember).mockRejectedValueOnce(new ForbiddenError("no"));
    const response = await call({ origin: "https://hoemapp.com" });
    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toBe("application/problem+json");
  });

  it("NFR-SEC-002 answers 422 to ids that are not UUIDs", async () => {
    vi.mocked(removeHouseholdMember).mockRejectedValueOnce(new ValidationError([]));
    const response = await call({ origin: "https://hoemapp.com" });
    expect(response.status).toBe(422);
  });
});
