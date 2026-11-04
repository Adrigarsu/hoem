# ADR-020 Commit undoable deletes on pagehide with a keepalive request to the REST API

Date: 2026-11-04 · Status: Proposed

## Context

ADR-009 sends a delete still inside its 5-second undo when the page is closed (`pagehide`). The web
app sends deletes through Server Actions (ADR-005), but a Server Action is a plain `fetch`, which
browsers cancel while the page unloads. Removing the profile photo and closing the tab often kept
the photo (#79, #92), and every future delete with undo would have the same gap. Only a
`fetch(…, { keepalive: true })` (or `sendBeacon`, POST only) outlives the page, and a Server Action
cannot be sent that way.

## Decision

`useUndoTimer.start(commit, { onUnload })` calls `onUnload` instead of `commit` on `pagehide`. The
normal commit after 5 seconds, on unmount and before signing out stays a Server Action, which also
refreshes the layout. `onUnload` sends `fetch(…, { method: "DELETE", keepalive: true })` to the REST
route of the same use case, starting with `DELETE /api/v1/profile/avatar`; both entry points call the
same service.

REST routes authenticate either way (`apiCredentials`, `src/lib/api-credentials.ts`):

- `Authorization: Bearer <access token>`: the route builds a Supabase client with that token
  (`createTokenClient`), so queries run as its user under RLS (ADR-004).
- Otherwise the session cookie, accepted only when `Origin` equals the app's own origin. The browser
  sends cookies on its own, so this is the cross-site request forgery guard that Server Actions have
  built in; SameSite=Lax cookies (ADR-016) are the second one. A malformed `Authorization` header is
  refused, never treated as a cookie request.

## Consequences

Closing the tab during the undo now deletes for real, except when the browser is killed and fires
no `pagehide`. The web app calls `/api/v1`, an exception to ADR-005 limited to unload. `/api` is
outside `src/proxy.ts`, so a cookie request with an expired access token may refresh the session in
the route rather than in the proxy (ADR-016); it happens only on unload. Each future delete with
undo needs its REST `DELETE` route. Rejected: `sendBeacon` (POST only, no way to send a JSON error
back), committing on `visibilitychange` (switching apps for a moment would lose the undo), and
moving the routes under the proxy (its redirects and locale rewrite are for pages).
