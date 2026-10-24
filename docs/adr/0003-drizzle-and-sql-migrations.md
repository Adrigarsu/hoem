# ADR-003 Drizzle ORM and SQL migrations

Date: 2026-10-14 · Status: Accepted · Amended by ADR-014 (migration folder and pipeline)

## Context

The schema must be typed in TypeScript, versioned, and include row-level security policies, triggers
and SQL functions that ORMs do not model well.

## Decision

Drizzle ORM defines tables in TypeScript (`src/db/schema/`) and generates migrations. Policies,
functions and triggers are written as hand-reviewed SQL migrations in the same folder, applied in
order by the Supabase CLI.

## Consequences

Queries are type-safe and close to SQL, so they are easy to reason about. Every policy is visible in
code review. Rejected: Prisma (heavier client, weaker fit for RLS and custom SQL).
