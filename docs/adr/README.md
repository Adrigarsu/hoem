# Architecture Decision Records

Each significant technical decision is recorded here in Michael Nygard's format (Context,
Decision, Consequences), as required by NFR-MNT-005. This file is the only index: other documents
link to single ADRs, never copy the list.

## Rules

- **Numbers never change.** Files are `NNNN-kebab-case-title.md`, numbered in the order they were
  written, and a number is never reused, so a link to an ADR never breaks. The topics below group
  them for reading; the topic is not part of the file name.
- **A decision is never rewritten.** To change it, a new ADR supersedes it (replaces it entirely) or
  amends it (changes one part). Both files say so on their status line: `Superseded by ADR-NNN` or
  `Amended by ADR-NNN (what)` on the old one, `Supersedes ADR-NNN` or `Amends ADR-NNN` on the new one.
- **Status:** `Proposed` while the pull request that introduces it is open; the developer changes it
  to `Accepted` when it merges. `Superseded` once a later ADR replaces it, `Deprecated` if it no
  longer applies and nothing replaces it.
- To add one, run `/adr <title>` in Claude Code or copy [`template.md`](template.md) with the next
  free number, and add its row to the right topic below.

## Index by topic

### Architecture and platform

| ADR | Decision                                                                          | Status                        |
| --- | --------------------------------------------------------------------------------- | ----------------------------- |
| 001 | [One Next.js application in one repository](0001-modular-monolith.md)             | Accepted                      |
| 002 | [Supabase as the backend platform](0002-supabase-backend.md)                      | Accepted · Amended by ADR-013 |
| 005 | [Server Actions and a REST API with OpenAPI](0005-server-actions-and-rest-api.md) | Accepted · Amended by ADR-020 |
| 012 | [Internationalisation](0012-internationalisation.md)                              | Accepted · Amended by ADR-015 |
| 015 | [Locale through an internal rewrite](0015-locale-through-an-internal-rewrite.md)  | Accepted · Amends ADR-012     |

### Data and persistence

| ADR | Decision                                                                                                                                   | Status                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| 003 | [Drizzle ORM and SQL migrations](0003-drizzle-and-sql-migrations.md)                                                                       | Accepted · Amended by ADR-014 |
| 007 | [Money as integer cents](0007-money-as-integer-cents.md)                                                                                   | Accepted                      |
| 009 | [Delete with a 5-second undo, no soft delete](0009-delete-with-undo.md)                                                                    | Accepted                      |
| 020 | [Commit undoable deletes on pagehide with a keepalive request to the REST API](0020-commit-undoable-deletes-on-pagehide-with-keepalive.md) | Accepted · Amends ADR-005     |

### Security and privacy

| ADR | Decision                                                                                                         | Status   |
| --- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| 004 | [Authorization in two layers](0004-two-layer-authorization.md)                                                   | Accepted |
| 006 | [Visibility decided at write time](0006-visibility-at-write-time.md)                                             | Accepted |
| 016 | [Session only in HttpOnly cookies](0016-session-only-in-httponly-cookies.md)                                     | Accepted |
| 017 | [Active household in an HttpOnly cookie, checked on every request](0017-active-household-in-a-cookie.md)         | Accepted |
| 019 | [Delete an account through a security definer function](0019-delete-account-with-a-security-definer-function.md) | Accepted |

### Product features

| ADR | Decision                                                                                                   | Status   |
| --- | ---------------------------------------------------------------------------------------------------------- | -------- |
| 008 | [Reminders with iCalendar rules and Web Push](0008-reminders-icalendar-web-push.md)                        | Accepted |
| 011 | [Demo mode with anonymous sessions](0011-demo-with-anonymous-sessions.md)                                  | Accepted |
| 018 | [Theme in a readable cookie, applied by an inline script](0018-theme-in-a-cookie-with-an-inline-script.md) | Accepted |

### Delivery and quality

| ADR | Decision                                                                         | Status                    |
| --- | -------------------------------------------------------------------------------- | ------------------------- |
| 010 | [Testing strategy](0010-testing-strategy.md)                                     | Accepted                  |
| 013 | [Production Supabase project in Ireland](0013-production-supabase-in-ireland.md) | Accepted · Amends ADR-002 |
| 014 | [Migration pipeline with expand/contract](0014-migration-pipeline.md)            | Accepted · Amends ADR-003 |
