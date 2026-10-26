// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  ConflictError,
  ForbiddenError,
  NotAuthenticatedError,
  NotFoundError,
  ValidationError,
} from "./errors";
import { problemResponse, toProblemDetails } from "./problem-details";

const context = { instance: "/api/v1/households/0192/expenses", requestId: "req_8f3a" };

describe("toProblemDetails", () => {
  it("NFR-SEC-002 maps a ValidationError to 422 with one entry per invalid field", () => {
    const error = new ValidationError([{ field: "amountCents", code: "too_small" }]);
    expect(toProblemDetails(error, context)).toEqual({
      type: "https://hoemapp.com/problems/validation_failed",
      title: "The request has invalid fields",
      status: 422,
      instance: "/api/v1/households/0192/expenses",
      requestId: "req_8f3a",
      errors: [{ field: "amountCents", code: "too_small" }],
    });
  });

  it.each([
    [new ForbiddenError(), "forbidden", 403],
    [new ConflictError(), "conflict", 409],
  ])("NFR-SEC-001 maps %o to its stable problem type and status", (error, code, status) => {
    expect(toProblemDetails(error, context)).toMatchObject({
      type: `https://hoemapp.com/problems/${code}`,
      status,
    });
  });

  it("NFR-SEC-001 answers 404 for rows RLS hides, never 403", () => {
    expect(toProblemDetails(new NotFoundError(), context)).toMatchObject({
      type: "https://hoemapp.com/problems/not_found",
      status: 404,
    });
  });

  it("NFR-SEC-001 hides the message and stack of an unexpected error behind the request ID", () => {
    const error = new Error('duplicate key value violates "expenses_pkey" for ana@example.com');
    const body = toProblemDetails(error, context);
    expect(body).toEqual({
      type: "https://hoemapp.com/problems/internal_error",
      title: "Something went wrong",
      status: 500,
      instance: "/api/v1/households/0192/expenses",
      requestId: "req_8f3a",
    });
    expect(JSON.stringify(body)).not.toContain("ana@example.com");
  });

  it("NFR-SEC-001 never sends the internal message of a typed error", () => {
    const body = toProblemDetails(new ForbiddenError("user 42 is not a parent"), context);
    expect(JSON.stringify(body)).not.toContain("user 42");
  });
});

describe("problemResponse", () => {
  it("NFR-SEC-002 answers with application/problem+json and the problem status", async () => {
    const response = problemResponse(new NotFoundError(), context);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBe("application/problem+json");
    expect(await response.json()).toMatchObject({ status: 404, requestId: "req_8f3a" });
  });

  it("NFR-SEC-002 tells a 401 client which scheme to authenticate with", () => {
    const response = problemResponse(new NotAuthenticatedError(), context);
    expect(response.headers.get("www-authenticate")).toBe("Bearer");
  });

  it("NFR-SEC-002 leaves out the errors list when no field is at fault", () => {
    expect(toProblemDetails(new ValidationError(), context)).not.toHaveProperty("errors");
  });

  it("NFR-SEC-001 logs an unexpected error on the server with its request ID", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("connection reset");
    problemResponse(error, context);
    expect(log).toHaveBeenCalledWith("req_8f3a", error);
    log.mockRestore();
  });
});
