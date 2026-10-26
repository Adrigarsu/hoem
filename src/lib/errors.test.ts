import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  AuthFailedError,
  ConflictError,
  DemoRestrictedError,
  ForbiddenError,
  NotAuthenticatedError,
  NotFoundError,
  ValidationError,
} from "./errors";

describe("AppError", () => {
  it.each([
    [new ValidationError(), "validation_failed", 422],
    [new NotAuthenticatedError(), "not_authenticated", 401],
    [new ForbiddenError(), "forbidden", 403],
    [new NotFoundError(), "not_found", 404],
    [new ConflictError(), "conflict", 409],
    [new DemoRestrictedError(), "demo_restricted", 403],
    [new AuthFailedError("invalidCredentials"), "auth_failed", 401],
    [new AuthFailedError("rateLimited"), "rate_limited", 429],
  ])("NFR-SEC-001 %o has the stable code %s and status %i", (error, code, status) => {
    expect(error).toMatchObject({ code, status });
  });
});

describe("ValidationError.fromZod", () => {
  const schema = z.object({
    amountCents: z.number().int().positive(),
    split: z.object({ userId: z.uuid() }),
  });

  it("NFR-SEC-002 lists one entry per invalid field, with the nested path joined by dots", () => {
    const result = schema.safeParse({ amountCents: 0, split: { userId: "nobody" } });
    const error = ValidationError.fromZod(result.error as z.ZodError);
    expect(error.fieldErrors).toEqual([
      { field: "amountCents", code: "too_small" },
      { field: "split.userId", code: "invalid_format" },
    ]);
  });

  it("NFR-SEC-002 never copies the rejected values into the error", () => {
    const result = schema.safeParse({ amountCents: -5, split: { userId: "ana@example.com" } });
    const error = ValidationError.fromZod(result.error as z.ZodError);
    expect(JSON.stringify(error.fieldErrors) + error.message).not.toContain("ana@example.com");
  });

  it("NFR-SEC-002 leaves out the field of a rule about the whole input", () => {
    const range = z
      .object({ from: z.number(), to: z.number() })
      .refine((value) => value.from <= value.to);
    const result = range.safeParse({ from: 2, to: 1 });
    expect(ValidationError.fromZod(result.error as z.ZodError).fieldErrors).toEqual([
      { code: "custom" },
    ]);
  });
});
