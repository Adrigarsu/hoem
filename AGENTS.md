# AGENTS.md

Instructions for AI coding agents working on HØEM. Humans should start with `README.md`.

## Project

HØEM is a household management web app: meal planning (five daily slots), shared and private
shopping lists, shared and private expenses with splits and budgets, a Planner (notes and
reminders with push notifications) and households of type single, family, shared flat or other.
**Privacy between household members is the top quality goal**, followed by accessibility.

Sources of truth. Read the relevant parts before designing anything non-trivial:

- `docs/srs.md`: requirements with IDs (`FR-EXP-007`, `NFR-A11Y-001`…)
- `docs/architecture.md`: architecture, data model, row-level security, decisions (ADRs)
- `docs/adr/`: new architecture decisions, one file each

If the code and these documents disagree, stop and ask. Never silently pick one.

## Stack

Next.js 16 (App Router) · React 19 with React Compiler · TypeScript strict · Tailwind CSS 4 ·
Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) · Drizzle ORM · Zod ·
TanStack Query · next-intl · Vitest + Testing Library · Playwright + axe-core · pnpm · Node 22.

Not everything is installed yet. Add a dependency only when the task needs it, and say so.

## Commands

- `pnpm dev`: dev server on http://localhost:3000
- `pnpm check`: lint + typecheck + format check + tests. **Run it before saying a task is done.**
- `pnpm test` / `pnpm test:watch`: unit tests (Vitest)
- `pnpm lint:fix`, `pnpm format`: autofix

Use pnpm only. Never edit `pnpm-lock.yaml` by hand.

## Architecture rules

- Code is grouped by feature, then by layer:
  `src/features/<feature>/{components/, actions.ts, service.ts, domain/, repository.ts, schemas.ts, index.ts}`
- Dependencies only point down: presentation → entry points (Server Actions, `src/app/api/v1`)
  → application (`service.ts`) → domain (`domain/`, pure) and data (`repository.ts`).
- `domain/` is pure TypeScript: no React, no I/O, no Supabase.
- A feature is imported by others only through its `index.ts`.
- Business rules live once, in services. Server Actions and API routes stay thin:
  parse input, call the service, map the result.
- `src/app/` contains routes only.

## Non-negotiables

- **Authorization twice:** services check membership and role, and Postgres RLS enforces the
  same rules with the user's own JWT. Never use the service-role key while handling a request.
  Never disable RLS.
- Every query on household data is scoped by `household_id`.
- Visibility of private records is decided at write time (`visible_to_parents`, set by a
  trigger). Never use the current household type to decide visibility.
- Money is integer cents (`amountCents: number` in TS, `bigint` in SQL). Never floats.
  Format only in the UI with `Intl.NumberFormat`.
- Instants are `timestamptz` in UTC; calendar days are `date`. Apply the user's time zone only
  when displaying.
- IDs are UUID v7.
- Services throw typed `AppError` subclasses with stable codes; the API answers with RFC 9457
  Problem Details. Stack traces never reach the client.
- Configuration comes from environment variables validated with Zod in `src/lib/env.ts`.
  Never commit secrets and never read `.env` files.
- Deleting hides the item at once with a 5-second undo, then deletes for real. No soft delete.
- **Migrations are backward compatible (expand/contract, ADR-014):** a migration that adds a
  column, table or function merges in its own pull request, before the code that uses it, because
  Vercel deploys the app while `migrate.yml` is still running. Remove the old one in a later pull
  request, once nothing reads it. Never rename or drop something the deployed code still uses.

## UI and accessibility (WCAG 2.2 AA, light and dark themes)

- Use design-system tokens (CSS variables) and components from `src/design-system/`.
  No hard-coded colours, fonts or spacing.
- Prefer native elements (`button`, `a`, `dialog`, `label`); follow the WAI-ARIA Authoring
  Practices for custom widgets.
- Touch targets at least 44×44 px, visible focus, colour never the only signal.
- No literal user-facing text in components: use next-intl messages (`messages/en.json`).

## Testing

- Domain functions and services are written test-first (red → green → refactor).
- Test names start with the requirement ID:
  `it("FR-EXP-007 hides a private expense from flatmates", …)`.
- Query components by role and accessible name, not by class names or test IDs.
- Every RLS change needs a policy test that signs in as each affected role.

## Code style

- No `any`. No non-null assertion (`!`) without a comment explaining why. Use `import type`.
- Files kebab-case; components and types PascalCase; functions camelCase verbs;
  SQL snake_case with plural table names.
- Small functions, early returns, no dead or commented-out code.
- Comments explain why, not what.

## Git workflow

- GitHub Flow: never commit to `main`. One branch per issue, named `type/REQ-ID-short-name`,
  for example `feat/FR-SHOP-003-realtime-list`.
- Conventional Commits with the requirement ID: `feat(shopping): live updates (FR-SHOP-003)`.
- Never use `--no-verify`, never force-push, never rewrite `main`.
- Pull requests link their issue (`Closes #12`) and are squash-merged by the developer, never by you.

## Definition of done

1. The issue's acceptance criteria are met and covered by tests.
2. `pnpm check` passes.
3. UI work is checked with keyboard only and in both themes.
4. `docs/` is updated if a decision or a documented behaviour changed.
5. You summarise what changed, what you left out and any open question.

## Working with the developer

- Reply to the developer in **Spanish**. Write code, comments, commits, PRs and docs in **English**.
- The developer is a computer engineering student. The first time you apply a standard or
  pattern in a task, explain it in one or two sentences.
- For anything beyond a small fix, propose a short plan and wait for approval before coding.
- When requirements are ambiguous, ask instead of guessing.
