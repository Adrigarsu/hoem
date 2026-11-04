# Migrations

How to change the database. The rules (row-level security in the same migration, indexes, money
columns…) are in `.claude/rules/database.md` and `docs/architecture.md` §6–7; the pipeline is
ADR-014.

## Create one

- **A table or column:** change `src/db/schema/`, then run `pnpm db:generate`. Drizzle writes a
  timestamped file to `supabase/migrations/`.
- **Policies, functions, triggers:** run `pnpm db:generate --custom --name=<what-it-does>` and write
  the SQL in the empty file it creates, so Drizzle's journal stays complete.

Apply it with `pnpm db:migrate` (or `pnpm db:reset` to start from scratch) and test it with
`pnpm db:test`. Every function, trigger and policy change has a pgTAP test in
`supabase/tests/database/`; a policy test signs in as every affected role.

## Expand, then contract

Vercel deploys the app while `migrate.yml` is still migrating, so the database and the code can
change in either order. Every migration is backward compatible:

1. **Expand:** a pull request with only the migration that adds the column, table or function.
   Merge it first (with `/start-partial` and `/ship-partial` when it is part of an issue).
2. **Use it:** the pull request with the code that needs it.
3. **Contract:** removing or renaming the old one waits for a later pull request, once no deployed
   code reads it.

A merged migration is never edited: every change is a new file.

## When `main` merges a newer migration than yours

The Supabase CLI refuses a migration older than the last one applied, so yours must sort last:

1. Merge `main` into your branch (`git fetch origin`, `git merge origin/main`), taking `main`'s
   `supabase/migrations/meta/_journal.json`.
2. `git rm` your migration file and its snapshot.
3. Run `pnpm db:generate --custom` again (same `--name`) and copy your SQL into the new file.
4. `pnpm db:reset` and `pnpm db:test`.
