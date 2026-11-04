// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotAuthenticatedError, RateLimitedError } from "./errors";
import { limitWrites } from "./rate-limit";
import { createClient, createTokenClient } from "./supabase/server";

const rpc = vi.fn();

vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));
vi.mock("./supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc })),
  createTokenClient: vi.fn(() => ({ rpc })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  rpc.mockResolvedValue({ data: 0, error: null });
});

describe("limitWrites", () => {
  it("NFR-SEC-006 counts the request against 60 writes per minute", async () => {
    await limitWrites();
    expect(rpc).toHaveBeenCalledWith("consume_rate_limit", {
      bucket: "api_write",
      max_requests: 60,
      window_seconds: 60,
    });
  });

  it("NFR-SEC-006 counts the session's user when there is no token", async () => {
    await limitWrites({});
    expect(createClient).toHaveBeenCalled();
    expect(createTokenClient).not.toHaveBeenCalled();
  });

  it("NFR-SEC-006 counts the Bearer token's user", async () => {
    await limitWrites({ accessToken: "eyJ.token.sig" });
    expect(createTokenClient).toHaveBeenCalledWith("eyJ.token.sig");
  });

  it("NFR-SEC-006 refuses a request over the limit with the seconds to wait", async () => {
    rpc.mockResolvedValue({ data: 17, error: null });
    await expect(limitWrites()).rejects.toEqual(new RateLimitedError(17));
  });

  it("NFR-SEC-006 refuses a request without a session as not authenticated", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "not authenticated", hint: "not_authenticated" },
    });
    await expect(limitWrites()).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it("NFR-SEC-001 refuses a Bearer token that is not a valid JWT as not authenticated", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "PGRST301", message: "Expected 3 parts in JWT; got 1" },
    });
    await expect(limitWrites({ accessToken: "not-a-token" })).rejects.toBeInstanceOf(
      NotAuthenticatedError,
    );
  });

  it("NFR-SEC-001 refuses an expired Bearer token as not authenticated", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "PGRST303", message: "JWT expired" } });
    await expect(limitWrites({ accessToken: "eyJ.token.sig" })).rejects.toBeInstanceOf(
      NotAuthenticatedError,
    );
  });

  it("NFR-SEC-006 throws any other database error as a fault", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "08006", message: "connection lost" } });
    await expect(limitWrites()).rejects.toThrow("connection lost");
  });
});
