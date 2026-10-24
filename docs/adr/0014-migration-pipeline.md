# ADR-014 Migration pipeline with expand/contract

Date: 2026-10-24 · Status: Proposed

## Context

ADR-003 has Drizzle generate migrations and the Supabase CLI apply them. The CLI only reads
`supabase/migrations/`, so the `src/db/migrations/` folder planned in §4.1 cannot work. Previews
share the staging database, and Vercel deploys the app on its own, so the app and the database can
change in either order. A broken migration must never reach production, and no pull request may
change a shared database before it is reviewed and merged.

## Decision

We will keep every migration in `supabase/migrations/`. Drizzle generates them there with the
`supabase` prefix (timestamped names the CLI expects); hand-written SQL is created with
`pnpm db:generate --custom` so Drizzle's journal stays complete. The Supabase CLI is the only tool
that applies migrations.

- **Pull requests:** CI starts a throw-away Postgres in Docker, applies every migration from scratch,
  runs the pgTAP tests in `supabase/tests/` and fails if the Drizzle schema changed without a
  migration. No pull request reaches staging or production.
- **Merges to `main`:** `migrate.yml` applies pending migrations to staging, then to production; a
  failure on staging skips production. The connection strings live in the `supabase-staging` and
  `supabase-production` GitHub environments, which only the `main` branch can use.
- **Expand/contract:** every migration is backward compatible. Vercel deploys the app while
  `migrate.yml` runs, and production may lag if staging fails, so the migration that adds a column,
  table or function merges in its own pull request, before the code that uses it. Removing the old
  one happens in a later pull request, once nothing reads it.

## Consequences

- The order between migrating and deploying stops being critical, and a failed migration leaves
  the running app working.
- Adding a column and using it takes two pull requests, and so does removing or renaming one. In
  return, previews always run against a staging database that already has what their code needs.
- Rejected: one pull request with the migration and the code that uses it (production would query
  a column that does not exist yet until `migrate.yml` finishes). Rejected: holding the Vercel
  deploy until migrations finish (more pipeline to maintain for the same guarantee).
- Rejected: `drizzle-kit migrate` (a second migration history next to the CLI's, and no support
  for the Supabase-specific setup). Rejected: generating into `src/db/migrations/` and copying to
  `supabase/migrations/` (two copies that drift). Rejected: applying migrations from pull requests
  to staging (an unreviewed change would break every other preview).
