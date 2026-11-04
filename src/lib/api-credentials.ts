import { ForbiddenError, NotAuthenticatedError } from "./errors";
import { requestOrigin } from "./request-origin";

// How a REST request proves who sends it (docs/architecture.md §5.2, ADR-020). Either a Bearer
// access token, used as is so the query runs as that user under RLS, or none, which means the
// session cookie. The cookie is sent by the browser on its own, so another site could make it send
// one: a cookie request is accepted only from the app's own origin (browsers always send Origin on
// a DELETE, POST, PUT or PATCH). SameSite=Lax cookies already stay home on those; this is the second
// guard Server Actions have built in and route handlers do not.
export type ApiCredentials = { accessToken?: string };

const bearer = /^Bearer\s+(\S+)$/i;

export function apiCredentials(headers: Headers): ApiCredentials {
  const authorization = headers.get("authorization");
  if (authorization !== null) {
    const token = bearer.exec(authorization.trim())?.[1];
    // A broken header is refused rather than ignored, so it never silently becomes a cookie request.
    if (!token) throw new NotAuthenticatedError("Malformed Authorization header");
    return { accessToken: token };
  }
  if (headers.get("origin") !== requestOrigin(headers)) {
    throw new ForbiddenError("Cookie request from another origin");
  }
  return {};
}
