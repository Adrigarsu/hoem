# Architecture Decision Records

Each significant technical decision is recorded here in Michael Nygard's format (Context,
Decision, Consequences), as required by NFR-MNT-005. A decision is never edited to say something
else: a new ADR supersedes or amends it, and the old one points to the new one.

| ADR | Title                                                                               | Date       | Status                                                        |
| --- | ----------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| 001 | [One Next.js application in one repository](0001-modular-monolith.md)               | 2026-10-14 | Accepted                                                      |
| 002 | [Supabase as the backend platform](0002-supabase-backend.md)                        | 2026-10-14 | Accepted · Amended by ADR-013 (production region)             |
| 003 | [Drizzle ORM and SQL migrations](0003-drizzle-and-sql-migrations.md)                | 2026-10-14 | Accepted · Amended by ADR-014 (migration folder and pipeline) |
| 004 | [Authorization in two layers](0004-two-layer-authorization.md)                      | 2026-10-14 | Accepted                                                      |
| 005 | [Server Actions and a REST API with OpenAPI](0005-server-actions-and-rest-api.md)   | 2026-10-14 | Accepted                                                      |
| 006 | [Visibility decided at write time](0006-visibility-at-write-time.md)                | 2026-10-14 | Accepted                                                      |
| 007 | [Money as integer cents](0007-money-as-integer-cents.md)                            | 2026-10-14 | Accepted                                                      |
| 008 | [Reminders with iCalendar rules and Web Push](0008-reminders-icalendar-web-push.md) | 2026-10-14 | Accepted                                                      |
| 009 | [Delete with a 5-second undo, no soft delete](0009-delete-with-undo.md)             | 2026-10-14 | Accepted                                                      |
| 010 | [Testing strategy](0010-testing-strategy.md)                                        | 2026-10-14 | Accepted                                                      |
| 011 | [Demo mode with anonymous sessions](0011-demo-with-anonymous-sessions.md)           | 2026-10-14 | Accepted                                                      |
| 012 | [Internationalisation](0012-internationalisation.md)                                | 2026-10-14 | Accepted                                                      |
| 013 | [Production Supabase project in Ireland](0013-production-supabase-in-ireland.md)    | 2026-10-24 | Proposed                                                      |
| 014 | [Migration pipeline with expand/contract](0014-migration-pipeline.md)               | 2026-10-24 | Proposed                                                      |

To add one, run `/adr <title>` in Claude Code or copy the structure of an existing file with the
next free number. New ADRs start as Proposed; the developer changes them to Accepted after review.
Add the new row here and in `docs/architecture.md` §3.
