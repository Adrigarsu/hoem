# ADR-016 Session only in HttpOnly cookies

Date: 2026-10-25 · Status: Proposed

## Context

NFR-SEC-004 requires HttpOnly, Secure and SameSite=Lax cookies. `@supabase/ssr` writes cookies a
script can read by default, because its browser client keeps the session in them. Privacy between
household members is the top quality goal, and a token that any script can read (an injected
script, a compromised dependency) is a way around it.

## Decision

We will keep the Supabase session only in HttpOnly cookies: `authCookieOptions()` sets
`httpOnly: true`, `sameSite: "lax"` and `secure` on every https origin. Sign-up, sign-in,
verification and sign-out run on the server (Server Actions and `/auth/confirm`), and
`src/proxy.ts` refreshes the session on every page request. The app has no Supabase browser
client. When a feature needs Supabase from the browser (Realtime for shared shopping lists,
FR-SHOP-003), the server will hand the page a short-lived access token for that connection only.

## Consequences

No script in the page can read the refresh token, and the proxy is the one place that refreshes
the session, so tokens never race between tabs. Every data change goes through the server, which
also keeps authorization in the services (ADR-004). Realtime needs an extra step to get its token,
and that token must be renewed before it expires. `Secure` is dropped only on a plain-http origin,
so the local end-to-end server works in Safari, which discards Secure cookies over http.

Rejected: the default readable cookies with the browser client, simpler for Realtime but against
NFR-SEC-004.
