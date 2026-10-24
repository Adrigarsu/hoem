---
paths:
  - "src/db/**"
  - "supabase/**"
---

# Database and migrations

- Migrations live in `supabase/migrations/`. Tables come from `src/db/schema/` with
  `pnpm db:generate`; hand-written SQL (policies, functions, triggers) starts from
  `pnpm db:generate --custom --name=<what-it-does>`, so Drizzle's journal stays complete.
- Every migration is backward compatible (expand/contract, ADR-014). A migration that adds
  something merges in its own pull request, before the code that uses it; removing the old
  column, table or function waits for a later pull request, once nothing reads it.
- A merged migration is never edited. Every change is a new migration file.
- Every new table enables row-level security and gets its policies **in the same migration**.
- Policies use the helpers `is_member`, `is_owner`, `is_parent`, `can_manage_members`
  (docs/architecture.md §7.1) instead of repeating subqueries.
- `security definer` functions set a fixed `search_path` and are not exposed through the API.
- Every `household_id` and every foreign key is indexed. Foreign keys to `households`
  use `on delete cascade`.
- Money columns are `bigint` cents with `check (amount_cents > 0)`; quantities are `numeric(10,3)`.
- Primary keys default to `uuid_generate_v7()`; tables have `created_at timestamptz not null default now()`.
  Editable tables add `updated_at` and a `before update` trigger that calls `set_updated_at()`.
- Database functions and triggers get a pgTAP test in `supabase/tests/` (`pnpm db:test`).
- Any policy change ships with a policy test that signs in as every affected role
  (docs/architecture.md §7.5).
