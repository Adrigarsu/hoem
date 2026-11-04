# ADR-021 Count REST API rate limits in Postgres

Date: 2026-11-04 · Status: Proposed

## Context

The REST API promises 60 write requests per minute per user, answered with 429 and `Retry-After`
once over the limit (docs/architecture.md §5.5, NFR-SEC-006). A client holding an access token can
otherwise call a write route without bound, and each call runs several Supabase queries. Vercel runs
many serverless instances, so a counter in memory would let each one allow 60. The demo milestone
needs a second limit, 10 demo sessions per hour per IP address, from the same mechanism.

## Decision

We will count requests in Postgres, in `private.api_rate_limits`, through
`private.consume_rate_limit(bucket, max_requests, window_seconds)`, a `security definer` function
outside the Data API, called through the `security invoker` wrapper `public.consume_rate_limit` with
the user's own JWT.

- A fixed window, aligned with `date_bin`: one row per user and bucket holds the window's start and
  its count, so the table never grows past that and needs no cleanup job.
- One `insert … on conflict do update` counts the request, so concurrent requests are counted one
  after the other.
- It takes no user id, so a caller only spends their own allowance. It answers 0 when the request is
  allowed, or the seconds until the window ends, which become `Retry-After`.
- The table has row-level security and no grants: only the function touches it. Its rows are deleted
  with the account (`on delete cascade`, ADR-019).

The app calls it from a shared helper before the service, in every `/api/v1` write route.

## Consequences

- No new service, secret or processor of personal data: the counters live in the same database, in
  the EU (ADR-013), and pgTAP tests them.
- Each write request costs one more round trip to the database, a few milliseconds at MVP scale.
- A fixed window lets a client send up to twice the limit across a window boundary. That is enough to
  stop a runaway client; a sliding window can replace it later behind the same function.
- A request without a session is not counted: it is refused with 401 by the service anyway. The demo
  limit per IP address needs a key other than `auth.uid()`, added when the demo is built.

Rejected:

- Upstash Redis through the Vercel integration is faster and made for this, but adds a service, a
  secret in `server-env.ts` and another processor of user IDs, for a limit Postgres handles at this
  scale.
- Vercel's WAF rate limiting needs no code, but it cannot tell the user behind a session cookie,
  lives outside version control and cannot be tested in the repository.
