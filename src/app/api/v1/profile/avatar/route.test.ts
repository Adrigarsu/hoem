import { beforeEach, describe, expect, it, vi } from "vitest";
import { removeOwnPhoto } from "@/features/profile";
import { NotAuthenticatedError } from "@/lib/errors";
import { DELETE } from "./route";

vi.mock("@/features/profile", () => ({ removeOwnPhoto: vi.fn(async () => undefined) }));

const url = "https://hoemapp.com/api/v1/profile/avatar";
const site = { host: "hoemapp.com", "x-forwarded-proto": "https" };

function request(headers: Record<string, string>) {
  return new Request(url, { method: "DELETE", headers: { ...site, ...headers } });
}

beforeEach(() => vi.clearAllMocks());

describe("DELETE /api/v1/profile/avatar", () => {
  it("FR-ACC-007 removes the photo of the session's user and answers 204", async () => {
    const response = await DELETE(request({ origin: "https://hoemapp.com" }));
    expect(response.status).toBe(204);
    expect(removeOwnPhoto).toHaveBeenCalledWith({});
  });

  it("FR-ACC-007 removes the photo of the Bearer token's user", async () => {
    const response = await DELETE(request({ authorization: "Bearer eyJ.token.sig" }));
    expect(response.status).toBe(204);
    expect(removeOwnPhoto).toHaveBeenCalledWith({ accessToken: "eyJ.token.sig" });
  });

  it("NFR-SEC-006 answers 403 Problem Details to a cookie request from another origin", async () => {
    const response = await DELETE(request({ origin: "https://evil.example" }));
    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toBe("application/problem+json");
    expect(await response.json()).toMatchObject({
      type: "https://hoemapp.com/problems/forbidden",
      instance: "/api/v1/profile/avatar",
    });
    expect(removeOwnPhoto).not.toHaveBeenCalled();
  });

  it("NFR-SEC-001 answers 401 with WWW-Authenticate: Bearer without a session", async () => {
    vi.mocked(removeOwnPhoto).mockRejectedValueOnce(new NotAuthenticatedError());
    const response = await DELETE(request({ origin: "https://hoemapp.com" }));
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe("Bearer");
  });

  it("NFR-SEC-006 answers 500 without the error's message or stack", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(removeOwnPhoto).mockRejectedValueOnce(new Error("storage down at 10.0.0.3"));
    const response = await DELETE(request({ origin: "https://hoemapp.com" }));
    expect(response.status).toBe(500);
    const body = JSON.stringify(await response.json());
    expect(body).not.toContain("storage down");
    expect(body).toMatch(/"requestId":"[0-9a-f-]{36}"/);
    logged.mockRestore();
  });
});
