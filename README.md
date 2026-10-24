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

Requirements: Node.js 22 (see `.nvmrc`), pnpm (version pinned in `package.json`; enable it
with `corepack enable`) and Docker Desktop for the local Supabase.

```bash
pnpm install
pnpm db:start
```

`pnpm db:start` runs Supabase locally in Docker, applies the migrations in
`supabase/migrations/` and prints the local URLs and keys. Copy `.env.example` to `.env.local`
and fill it in with the API URL and the publishable key it printed (`pnpm exec supabase status`
shows them again). The app refuses to start while a variable is missing.

```bash
pnpm dev
```

Open http://localhost:3000. Stop Supabase with `pnpm db:stop`.

## Scripts

| Script             | What it does                                                                          |
| ------------------ | ------------------------------------------------------------------------------------- |
| `pnpm dev`         | Start the development server                                                          |
| `pnpm build`       | Build for production                                                                  |
| `pnpm start`       | Serve the production build                                                            |
| `pnpm lint`        | Lint with ESLint (`pnpm lint:fix` to autofix)                                         |
| `pnpm typecheck`   | Type-check with TypeScript                                                            |
| `pnpm format`      | Format with Prettier (`pnpm format:check` to verify)                                  |
| `pnpm test`        | Run unit tests with Vitest (`pnpm test:watch`)                                        |
| `pnpm check`       | Lint, typecheck, format check and tests                                               |
| `pnpm db:start`    | Start the local Supabase in Docker                                                    |
| `pnpm db:stop`     | Stop the local Supabase                                                               |
| `pnpm db:generate` | Generate a migration from `src/db/schema/` (`--custom --name=…` for hand-written SQL) |
| `pnpm db:migrate`  | Apply pending migrations to the local Supabase                                        |
| `pnpm db:reset`    | Recreate the local database and apply every migration from scratch                    |
| `pnpm db:test`     | Run the pgTAP database tests in `supabase/tests/`                                     |
| `pnpm db:seed`     | Load local seed data (`src/db/seed/`)                                                 |

## Project docs

- [`docs/srs.md`](docs/srs.md): requirements, each with a stable ID
- [`docs/architecture.md`](docs/architecture.md): architecture, data model and decisions
- [`docs/adr/`](docs/adr/): architecture decision records
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

- **Vercel** builds the app through its GitHub integration. Functions run in `fra1` (Frankfurt,
  set in `vercel.json`), the same EU region as Supabase.
- **Production:** every merge into `main` deploys to https://hoemapp.com.
- **Previews:** every pull request gets its own `*.vercel.app` URL, protected by Vercel
  Authentication.
- **Domain:** `hoemapp.com` is registered at Cloudflare, which hosts its DNS. The apex `A` record
  and the `www` `CNAME` point to Vercel as "DNS only" (proxy off), so TLS certificates and
  caching stay with Vercel. `www.hoemapp.com` redirects permanently (308) to `hoemapp.com`.
- **Supabase:** `hoem-staging` (used by previews) in Frankfurt and `hoem-production` in Ireland
  (ADR-013).
  Vercel holds `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` per
  environment. The service-role key is never set in Vercel; only background jobs use it.
- **Keep-alive:** free Supabase projects pause after a week without activity, so the
  `keep-alive.yml` workflow calls `ping()` on both projects every three days. GitHub disables
  scheduled workflows after 60 days without commits; its failure e-mail is the signal to
  re-enable it.
