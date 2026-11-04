import "server-only";
import { connection } from "next/server";
import { z } from "zod";
import type { ApiCredentials } from "./api-credentials";
import { NotAuthenticatedError, RateLimitedError } from "./errors";
import { createClient, createTokenClient } from "./supabase/server";

// A limit counted in Postgres, so every serverless instance shares it (ADR-021). `bucket` names the
// counter; the demo's sessions per IP address will need a key other than the user (§5.5).
type RateLimit = { bucket: string; maxRequests: number; windowSeconds: number };

const apiWrites: RateLimit = { bucket: "api_write", maxRequests: 60, windowSeconds: 60 };

// The function answers 0 when the request is allowed, or the seconds left in the window.
const retryAfterSeconds = z.number().int().nonnegative();

// PostgREST refuses a token it cannot verify before the function runs: malformed or badly signed
// (PGRST301), missing where one is required (PGRST302), or expired (PGRST303). The limiter runs
// before the service, so it is the first to see a bad Bearer token and must answer 401, not 500.
const rejectedTokenCodes = new Set(["PGRST301", "PGRST302", "PGRST303"]);

// Every /api/v1 write route calls it before the service (docs/architecture.md §5.5). Over the limit
// it throws RateLimitedError, which problemResponse answers with 429 and Retry-After.
export async function limitWrites(credentials: ApiCredentials = {}): Promise<void> {
  await consume(apiWrites, credentials);
}

async function consume(limit: RateLimit, { accessToken }: ApiCredentials): Promise<void> {
  // Per request only: Supabase reads the clock to check the session, which a prerender refuses.
  await connection();
  const supabase = accessToken ? createTokenClient(accessToken) : await createClient();
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    bucket: limit.bucket,
    max_requests: limit.maxRequests,
    window_seconds: limit.windowSeconds,
  });
  if (error) {
    // The stable code in the HINT (supabase/migrations/*_api-rate-limits.sql).
    if (error.hint === "not_authenticated" || rejectedTokenCodes.has(error.code)) {
      throw new NotAuthenticatedError(error.message);
    }
    throw Object.assign(new Error(error.message), { code: error.code });
  }
  const seconds = retryAfterSeconds.parse(data);
  if (seconds > 0) throw new RateLimitedError(seconds);
}
