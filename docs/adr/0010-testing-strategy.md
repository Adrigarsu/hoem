# ADR-010 Testing strategy

Date: 2026-10-14 · Status: Accepted

## Context

Business rules (splits, merging ingredients, privacy) must be right; interfaces change often during
the MVP.

## Decision

A test pyramid. Domain functions and services are written test-first with Vitest (TDD). RLS policies
get integration tests against a local Supabase. Each user story gets at least one Playwright
end-to-end test once its interface is done, with axe-core accessibility checks on every page
visited.

## Consequences

Fast, stable tests where bugs are most expensive; fewer brittle UI tests. Coverage target 80 % for
domain and services (NFR-MNT-003).
