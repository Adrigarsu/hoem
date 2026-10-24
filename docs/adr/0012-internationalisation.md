# ADR-012 Internationalisation

Date: 2026-10-14 · Status: Accepted

## Context

English first, Spanish in phase 2 (NFR-I18N-001). The app is behind a sign-in, so localised URLs
bring no search benefit.

## Decision

next-intl with message files per locale (`messages/en.json`). The locale comes from the profile,
then the `Accept-Language` header; it is not part of the URL. Dates, numbers and money are formatted
with the `Intl` API.

## Consequences

Clean URLs, one place for every string, and a lint rule can forbid literal text in components.
