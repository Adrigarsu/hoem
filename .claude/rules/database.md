---
paths:
  - "src/db/**"
  - "supabase/**"
---

# Database and migrations

- A merged migration is never edited. Every change is a new migration file.
- Every new table enables row-level security and gets its policies **in the same migration**.
- Policies use the helpers `is_member`, `is_owner`, `is_parent`, `can_manage_members`
  (docs/architecture.md §7.1) instead of repeating subqueries.
- `security definer` functions set a fixed `search_path` and are not exposed through the API.
- Every `household_id` and every foreign key is indexed. Foreign keys to `households`
  use `on delete cascade`.
- Money columns are `bigint` cents with `check (amount_cents > 0)`; quantities are `numeric(10,3)`.
- Primary keys default to `uuid_generate_v7()`; tables have `created_at timestamptz not null default now()`.
- Any policy change ships with a policy test that signs in as every affected role
  (docs/architecture.md §7.5).
