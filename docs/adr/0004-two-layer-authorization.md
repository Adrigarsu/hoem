# ADR-004 Authorization in two layers

Date: 2026-10-14 · Status: Accepted

## Context

A privacy leak is the worst failure this product can have (quality goal 1, docs/architecture.md
§1.2). A single check in application code can be forgotten in one endpoint.

## Decision

Every request is checked twice. Application services verify membership and role and return a clear
error. PostgreSQL row-level security enforces the same rules on every row, using the user's own JWT,
so the database refuses what the code forgot. The service-role key is used only by background jobs,
never in request handling.

## Consequences

Defence in depth: a bug in one layer is caught by the other. RLS also protects Realtime
subscriptions from the browser. Policies must be tested directly with integration tests that sign in
as different users (docs/architecture.md §7.5).
