import type { ZodError } from "zod";
import { issuePath } from "./validation";

// Typed errors with stable codes (docs/architecture.md §4.4). Services throw them; entry points map
// them to a form message or an RFC 9457 Problem Details body (problem-details.ts). The message is
// for logs only and never reaches the client; never put user data in it.
export type ErrorCode =
  | "validation_failed"
  | "not_authenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "demo_restricted"
  | "auth_failed"
  | "rate_limited";

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly status: number;
}

// A field that failed validation, by path ("split.userId") and Zod issue code ("too_small"); no
// field for a rule about the whole input. The rejected value is never kept: it may be personal
// data.
export type FieldError = { field?: string; code: string };

export class ValidationError extends AppError {
  readonly code = "validation_failed";
  readonly status = 422;

  constructor(readonly fieldErrors: FieldError[] = []) {
    super("Validation failed");
  }

  // For the API, which parses its input with the feature's schemas.ts like the forms do.
  static fromZod(error: ZodError): ValidationError {
    return new ValidationError(
      error.issues.map((issue) => {
        const field = issuePath(issue);
        return field ? { field, code: issue.code } : { code: issue.code };
      }),
    );
  }
}

export class NotAuthenticatedError extends AppError {
  readonly code = "not_authenticated";
  readonly status = 401;

  constructor(message = "Not authenticated") {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly code = "forbidden";
  readonly status = 403;

  constructor(message = "Forbidden") {
    super(message);
  }
}

// Also for rows that row-level security hides, so their existence is never revealed.
export class NotFoundError extends AppError {
  readonly code = "not_found";
  readonly status = 404;

  constructor(message = "Not found") {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly code = "conflict";
  readonly status = 409;

  constructor(message = "Conflict") {
    super(message);
  }
}

// An action the demo household does not allow (FR-DEMO-001).
export class DemoRestrictedError extends AppError {
  readonly code = "demo_restricted";
  readonly status = 403;

  constructor(message = "Not available in the demo") {
    super(message);
  }
}

// Sign-up, sign-in or verification refused by Supabase Auth. `reason` is a message key, chosen so
// it never reveals whether an e-mail address has an account. A rate limit is a 429, so API clients
// back off instead of treating it as a bad token.
export class AuthFailedError extends AppError {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(readonly reason: string) {
    super(`Authentication failed: ${reason}`);
    const rateLimited = reason === "rateLimited";
    this.code = rateLimited ? "rate_limited" : "auth_failed";
    this.status = rateLimited ? 429 : 401;
  }
}
