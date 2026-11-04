# ADR-017 Active household in an HttpOnly cookie, checked on every request

Date: 2026-11-02 · Status: Accepted

## Context

A user can belong to several households and switch the active one from the header (FR-ACC-004).
Every screen shows the data of that household, the choice must survive a reload and a new sign-in,
and a household the user left must never be shown again. Privacy between household members is the
top quality goal, so whatever remembers the choice must not become a way to reach another
household's data.

## Decision

We will remember the chosen household in the `hoem-household` cookie: HttpOnly, SameSite=Lax,
Secure on https (as the session, ADR-016), for a year, and kept when the user signs out. The
cookie is only a preference. On every request `activeHousehold()` reads the households the user
can see, which row-level security already limits to their memberships (`is_member`), and picks the
one the cookie names; if it is not among them, or the cookie is missing or malformed, the first
household is active. Switching goes through `switchHousehold()`, which writes the cookie only for a
household the user belongs to. Features get the active household from `currentHousehold()`
(`src/features/households`), read once per request.

## Consequences

No migration is needed, and nothing outside the household list ever trusts the cookie's id, so a
forged or stale cookie can only change which of the user's own households is shown. RLS stays the
second barrier for every query. The choice belongs to the device: another browser starts on the
first household. Someone signing in on a shared device after another user may see a cookie naming
a household they do not belong to, which simply falls back to their first household. Every page
that reads the active household is dynamic, so it renders inside `<Suspense>` (`cacheComponents`).

Rejected: a column on `profiles`, which would follow the user across devices but needs a migration
and a write on every switch; and the household id in the URL, which would put it in history and
logs and make every link carry it.
