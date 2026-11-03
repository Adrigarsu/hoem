# ADR-018 Theme in a readable cookie, applied by an inline script

Date: 2026-11-03 · Status: Proposed

## Context

Users choose System, Light or Dark, and the choice follows them to every device (FR-ACC-007). The
wrong theme must not flash on load. The issue asked to apply the theme server-side, but `<html>` is
part of a static shell per locale (ADR-015): reading a cookie or the profile in the root layout makes
every route, public ones included, render per request. ADR-015 already rejected that for the locale.

## Decision

We will keep `profiles.theme` as the source of truth and bring it to the browser in the `hoem-theme`
cookie: SameSite=Lax, Secure on https, for a year, and readable by scripts. A small constant script in
`<head>` reads it and sets `data-theme` on `<html>` before the first paint; only `light` and `dark`
reach the attribute, and anything else leaves the theme to `prefers-color-scheme`. Sign-in, e-mail
verification and the password reset write the cookie from the profile. `ThemeSync`, in the app shell,
compares it with the profile on each signed-in page and corrects a device whose cookie is older.

## Consequences

Every route keeps its static shell and there is no flash on a full page load. This is not literally
server-side: without JavaScript the app follows the system theme. Signing in is a client navigation,
so the script does not run again and the theme arrives from `ThemeSync` a moment later, once. The
cookie is readable by any script and stays after signing out, like `hoem-locale`, but it only holds
one of three words; the session stays HttpOnly (ADR-016). A future Content Security Policy must allow
this script by its hash. Pages outside `[locale]` (`global-not-found`) render the script too.

Rejected: a `[theme]` segment in the internal rewrite, which is truly server-side but triples the
shells and moves every route one folder deeper; and a dynamic root layout, for the reason in ADR-015.
