import { AppError, ValidationError, type ErrorCode, type FieldError } from "./errors";

// RFC 9457 Problem Details for the REST API (docs/architecture.md §5.3). The body carries the
// stable code (in `type`), a fixed title and the request ID; never the error's message or stack,
// which stay in the server logs.
export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  instance: string;
  requestId: string;
  errors?: FieldError[];
};

type ProblemContext = { instance: string; requestId: string };

const problemTypeBase = "https://hoemapp.com/problems/";

// API clients read `type`; the titles are fixed English text for people reading the response.
// Keyed by every ErrorCode, so a new error without a title does not compile.
const titles: Record<ErrorCode, string> = {
  validation_failed: "The request has invalid fields",
  not_authenticated: "Sign in to continue",
  forbidden: "You cannot do this in this household",
  not_found: "Not found",
  conflict: "The request conflicts with the current state",
  demo_restricted: "Not available in the demo",
  auth_failed: "Authentication failed",
  rate_limited: "Too many requests",
};

const internalError = {
  type: `${problemTypeBase}internal_error`,
  title: "Something went wrong",
  status: 500,
};

export function toProblemDetails(error: unknown, context: ProblemContext): ProblemDetails {
  if (!(error instanceof AppError)) return { ...internalError, ...context };

  const body: ProblemDetails = {
    type: `${problemTypeBase}${error.code}`,
    title: titles[error.code],
    status: error.status,
    ...context,
  };
  if (error instanceof ValidationError && error.fieldErrors.length > 0) {
    body.errors = error.fieldErrors;
  }
  return body;
}

// The response for a route handler. An unexpected error is logged here with the request ID the
// client receives, so a support request can be traced to its stack.
export function problemResponse(error: unknown, context: ProblemContext): Response {
  if (!(error instanceof AppError)) console.error(context.requestId, error);
  const body = toProblemDetails(error, context);
  const headers = new Headers({ "content-type": "application/problem+json" });
  // RFC 9110 §15.5.2: every 401 names the scheme to authenticate with (ADR-016: Bearer tokens).
  if (body.status === 401) headers.set("www-authenticate", "Bearer");
  return Response.json(body, { status: body.status, headers });
}
