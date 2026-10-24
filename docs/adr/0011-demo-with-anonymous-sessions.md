# ADR-011 Demo mode with anonymous sessions

Date: 2026-10-14 · Status: Accepted

## Context

Reviewers must try the app without registering, without seeing each other's changes (FR-DEMO-001 to
008).

## Decision

"Try the demo" signs the visitor in with a Supabase anonymous session; a SQL function copies the
template households into new households owned by that session. A scheduled job deletes anonymous
users and their data after 24 hours. Outgoing actions (invitations, emails, push) check
`is_anonymous` in the JWT and refuse.

## Consequences

The demo runs on exactly the same code and policies as real accounts, so it also demonstrates them.
