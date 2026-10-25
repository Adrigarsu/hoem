# ADR-015 Locale through an internal rewrite

Date: 2026-10-25 · Status: Accepted

## Context

ADR-012 keeps the locale out of the URL: it comes from the profile, then `Accept-Language`, then
English (NFR-I18N-001). The app uses Cache Components, which prerender a static shell of each route
at build time. Reading `headers()` in the root layout to set `<html lang>` (WCAG 3.1.1) makes every
route depend on the request, so the build fails unless the whole app gives up its static shell.

## Decision

We will resolve the locale in `src/proxy.ts`, before rendering: the `hoem-locale` cookie (written
from `profiles.locale` on sign-in and when the user changes it), then `Accept-Language`, then `en`.
The proxy rewrites the request internally to a `[locale]` segment, so `/shopping` is served by
`src/app/[locale]/shopping`; the address bar never shows the locale, and a URL that names one
(`/en/shopping`) redirects to the clean address. Every layout and page under `[locale]` calls
`setLocaleFromParams()`, and `generateStaticParams` builds one shell per supported locale.

## Consequences

Each locale keeps a static shell and partial prefetching, which matters for the public pages and on
slow mobile networks. Routes live one folder deeper (`src/app/[locale]/…`), the profile reaches the
proxy through a cookie that must be kept in sync, and the Supabase session refresh (#13) must share
the same `proxy.ts`. The REST API, Next.js internals and static files are outside the proxy matcher.

Rejected: a dynamic root layout (`instant = false`), simpler but every route, public ones included,
would render per request; and next-intl's own middleware, which would duplicate the tested
`resolveLocale` rules.
