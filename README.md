# HØEM

HØEM is a household management web app for the people who live together, whether that is a
family, a shared flat or a single person. It brings meal planning, shopping lists, expenses and
reminders into one place, keeps private records private between household members, and is
built to meet WCAG 2.2 AA in light and dark themes.

**Live:** https://hoemapp.com

## Features

- **Households:** single, family, shared flat or other, with roles and permissions per type
- **Meals:** recipes and a daily meal plan with five slots
- **Shopping:** shared and private shopping lists with live updates
- **Expenses:** shared and private expenses with splits and budgets
- **Planner:** notes and reminders with push notifications
- **Dashboard:** today's meals, lists and reminders at a glance

## Tech stack

Next.js 16 (App Router) · React 19 with React Compiler · TypeScript (strict) · Tailwind CSS 4 ·
Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) · Drizzle ORM · Zod · TanStack Query · next-intl ·
Vitest + Testing Library · Playwright + axe-core · pnpm

## Getting started

Requirements: Node.js 22, pnpm (`corepack enable`) and Docker Desktop.

```bash
pnpm install
pnpm db:start
cp .env.example .env.local   # fill in the URL and key that db:start printed
pnpm dev
```

Open http://localhost:3000; sign-up e-mails land in Mailpit at http://127.0.0.1:54324. The full
steps, end-to-end tests included, are in [`docs/guides/local-setup.md`](docs/guides/local-setup.md).

## Scripts

| Script                 | What it does                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| `pnpm dev`             | Start the development server                                                              |
| `pnpm build`           | Build for production                                                                      |
| `pnpm start`           | Serve the production build                                                                |
| `pnpm lint`            | Lint with ESLint and Stylelint (`pnpm lint:fix` to autofix)                               |
| `pnpm typecheck`       | Type-check with TypeScript                                                                |
| `pnpm format`          | Format with Prettier (`pnpm format:check` to verify)                                      |
| `pnpm test`            | Run unit tests with Vitest (`pnpm test:watch`)                                            |
| `pnpm test:coverage`   | Unit tests with coverage; fails below 80 % on domain, services and pure utilities         |
| `pnpm test:e2e`        | Build and run the Playwright end-to-end tests with axe-core (`pnpm test:e2e:ui` to debug) |
| `pnpm check`           | Lint, typecheck, format check and tests with coverage                                     |
| `pnpm db:start`        | Start the local Supabase in Docker                                                        |
| `pnpm db:stop`         | Stop the local Supabase                                                                   |
| `pnpm db:generate`     | Generate a migration from `src/db/schema/` (`--custom --name=…` for hand-written SQL)     |
| `pnpm db:migrate`      | Apply pending migrations to the local Supabase                                            |
| `pnpm db:reset`        | Recreate the local database and apply every migration from scratch                        |
| `pnpm db:test`         | Run the pgTAP database tests in `supabase/tests/`                                         |
| `pnpm db:seed`         | Load local seed data (`src/db/seed/`)                                                     |
| `pnpm app:capture`     | Screenshot app pages at three widths in both themes (`docs/guides/screenshots.md`)        |
| `pnpm screens:capture` | Screenshot the reference screens in `docs/design-system/screens/`                         |

## Project docs

- [`docs/README.md`](docs/README.md): index of every document
- [`docs/srs.md`](docs/srs.md): requirements, each with a stable ID
- [`docs/roadmap.md`](docs/roadmap.md): phases, gates and milestones
- [`docs/architecture.md`](docs/architecture.md): architecture, data model and pipeline
- [`docs/adr/`](docs/adr/README.md): architecture decision records
- [`docs/guides/`](docs/guides/README.md): how to set up, deploy, migrate and test
- [`AGENTS.md`](AGENTS.md): conventions for AI coding agents (and a good summary for humans)

## Development workflow

- **GitHub Flow:** `main` is always deployable. Work on a branch per issue named
  `type/REQ-ID-short-name` (for example `feat/FR-SHOP-003-realtime-list`) and open a pull request.
- **Conventional Commits** with the requirement ID, for example
  `feat(shopping): live updates (FR-SHOP-003)`. commitlint checks them on commit.
- **Migrations** live in `supabase/migrations/` and are always backward compatible
  (expand/contract, ADR-014). CI applies them from scratch on a throw-away database; merges to
  `main` apply them to staging, then production.
- Run **`pnpm check`** before pushing. CI runs the same checks plus `pnpm build` on every pull
  request.

## Deployment

Every merge into `main` deploys to https://hoemapp.com on Vercel (`fra1`), with Supabase in the EU;
every pull request gets a preview against the staging project. Infrastructure, DNS, e-mail and the
keep-alive workflow are described in [`docs/guides/deployment.md`](docs/guides/deployment.md).
