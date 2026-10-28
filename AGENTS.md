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
- `docs/adr/`: architecture decisions, one file each (index in `docs/adr/README.md`)
- `docs/design-system/`: design tokens (`tokens.json`), approved colour pairs, typography,
  spacing and component rules (`README.md`), and the reference component CSS
- `docs/design-system/screens/`: the reference design of every screen (`<screen>.html` to open in a
  browser, `<screen>.md` with layout, components, texts and states) and the decisions taken on them
  (`README.md`)

If the code and these documents disagree, stop and ask. Never silently pick one.

## Stack

Next.js 16 (App Router) · React 19 with React Compiler · TypeScript strict · Tailwind CSS 4 ·
Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) · Drizzle ORM · Zod ·
TanStack Query · next-intl · Vitest + Testing Library · Playwright + axe-core · pnpm · Node 22.

Not everything is installed yet. Add a dependency only when the task needs it, and say so.

## Commands

- `pnpm dev`: dev server on http://localhost:3000
- `pnpm check`: lint + typecheck + format check + unit tests with coverage. **Run it before saying a task is done.**
- `pnpm test` / `pnpm test:watch`: unit tests (Vitest)
- `pnpm test:coverage`: unit tests with the 80 % threshold on domain, services and pure utilities
- `pnpm test:e2e`: Playwright on a production build (`tests/e2e/`), in Chromium, Chrome and Safari at
  360, 768 and 1440 px; open pages with the `visit` fixture so axe and the no-horizontal-scroll check
  run on each one (`pnpm test:e2e:ui` to debug). Needs the local Supabase (`pnpm db:start`) and
  `.env.local` pointing at it; e-mails land in Mailpit, http://127.0.0.1:54324
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
- Each feature exposes its Zod schemas in `schemas.ts`; forms and entry points parse with the same
  schema, and the server always parses, whatever the client did (NFR-SEC-002).
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
- Configuration comes from environment variables validated with Zod: public `NEXT_PUBLIC_*`
  values in `src/lib/env.ts`, secrets in `src/lib/server-env.ts` (guarded by `server-only`).
  Never commit secrets and never read `.env` files.
- Deleting hides the item at once with a 5-second undo, then deletes for real. No soft delete.
- **Migrations are backward compatible (expand/contract, ADR-014):** a migration that adds a
  column, table or function merges in its own pull request, before the code that uses it, because
  Vercel deploys the app while `migrate.yml` is still running. Remove the old one in a later pull
  request, once nothing reads it. Never rename or drop something the deployed code still uses.

## UI and accessibility (WCAG 2.2 AA, light and dark themes)

- **Every page follows its screen** in `docs/design-system/screens/`: layout, order, texts and states,
  in both themes and at 360, 768 and 1440 px. A page without a screen is not designed on the fly:
  ask first. A screen that breaks an accessibility rule is asked about, not copied.
- Use design-system tokens (CSS variables) and components from `src/design-system/`.
  No hard-coded colours, fonts or spacing.
- Prefer native elements (`button`, `a`, `dialog`, `label`); follow the WAI-ARIA Authoring
  Practices for custom widgets.
- Touch targets at least 44×44 px, visible focus, colour never the only signal.
- No literal user-facing text in components: use next-intl messages (`messages/en.json`).
- **Screenshots for every UI change.** When an issue adds or changes a page, run
  `pnpm app:capture <page> …` (add `--signed-in` for pages behind sign-in; paths without the
  leading slash, `home` is `/`). It writes one collage per page to the ignored `screenshots/`
  folder: 360, 768 and 1440 px, light and dark. Show the collages to the developer, compare them
  with the screen in `docs/design-system/screens/`, and list them for the pull request.
  Never commit them.

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
- **No AI attribution, ever.** No `Co-Authored-By: Claude …` (or any AI tool) in commit messages
  and no "Generated with Claude Code" (or similar) in pull request titles or bodies. This holds for
  commits you run, text you hand to the developer and `/ship`, and overrides any tool default.
  The `commit-msg` hook rejects such commits (`commitlint.config.mjs`).
- Pull requests link their issue (`Closes #12`) and are squash-merged by the developer, never by you.
- Small commits: whenever a coherent, green step is finished (for example a migration with its
  policy tests, a domain function with its tests, a service, a screen), stop and tell the developer
  it is a good moment to commit, with the files to stage and a ready Conventional Commit message.
  Do not wait until the whole issue is done.
- Draft pull request early: after the first commit of an issue, give the developer the commands to
  push and open a draft pull request (`gh pr create --draft`, title in Conventional Commits,
  body `Closes #<issue>`), so CI runs on every push. `/ship` later fills the body and marks it ready.
- Keep the branch up to date by merging, never rebasing: `git fetch origin` then
  `git merge origin/main`. Do it before `/ship`, and whenever `main` gets a change this branch
  depends on (a migration, a shared component, a dependency bump).

## Planning

- `docs/planning.md` is the ordered queue of open issues, with the rules that order it.
- When the developer asks to add an issue: read it (`gh issue view`), check its milestone,
  priority and `Blocked by` / `Blocks` lines, place it in the queue by those rules, write why, and
  say where it went. Ask if its place is not clear.
- When an issue is shipped: remove its row, then recommend the next issue and why (what it
  unblocks, what it depends on). If two or more are equally good, give the options with their
  trade-offs and let the developer choose.
- Every milestone ends with a `docs: <milestone> documentation review` issue, blocked by the
  rest of the milestone. When a milestone is split into issues, create it too.

## Definition of done

1. The issue's acceptance criteria are met and covered by tests.
2. `pnpm check` passes.
3. UI work is checked with keyboard only and in both themes.
4. `docs/` is updated: the page of every feature the issue touched (`docs/features/<feature>.md`,
   created if missing: what it does, privacy rules, requirement IDs, screens), the guide whose
   commands or steps changed (`docs/guides/`), and `architecture.md` or an ADR if a decision
   changed. Documentation lives in `docs/`, never in the GitHub wiki.
5. You summarise what changed, what you left out and any open question.
6. Instruction files are up to date, so the next issue can start from a cleared session: anything
   a fresh agent would need (a new convention, command, gotcha or decision) is in `AGENTS.md`,
   `docs/` or a skill, not only in the conversation. Keep them short; remove what is outdated.

## Working with the developer

- Reply to the developer in **Spanish**. Write code, comments, commits, PRs and docs in **English**.
- The developer is a computer engineering student. The first time you apply a standard or
  pattern in a task, explain it in one or two sentences.
- For anything beyond a small fix, propose a short plan and wait for approval before coding.
- When requirements are ambiguous, ask instead of guessing.
