# Local setup

From a fresh clone to the app running on http://localhost:3000, with its own Supabase in Docker.

## Requirements

- Node.js 22 (see `.nvmrc`)
- pnpm, the version pinned in `package.json`: enable it with `corepack enable`
- Docker Desktop, for the local Supabase
- Google Chrome, for the end-to-end tests in the Chrome project

## Steps

1. Install the dependencies:

   ```bash
   pnpm install
   ```

2. Start Supabase locally. It runs in Docker, applies the migrations in `supabase/migrations/` and
   prints the local URLs and keys:

   ```bash
   pnpm db:start
   ```

3. Copy `.env.example` to `.env.local` and fill it in with the API URL and the publishable key it
   printed (`pnpm exec supabase status` shows them again). The app refuses to start while a
   variable is missing.
4. Start the app and open http://localhost:3000:

   ```bash
   pnpm dev
   ```

5. Sign up. E-mails from the local Supabase never leave your machine: open Mailpit at
   http://127.0.0.1:54324 to read them and click the verification link.

Stop Supabase with `pnpm db:stop`. `pnpm db:reset` recreates the local database from every
migration, and `pnpm db:seed` loads local test data.

## End-to-end tests

They run against the local Supabase, on a production build. Install the Playwright browsers once:

```bash
pnpm exec playwright install chromium webkit
```

Then `pnpm test:e2e` (or `pnpm test:e2e:ui` to debug). How to write them: `testing.md`.

## Without `.env.local`

A fresh cloud session has no `.env.local`. `pnpm typecheck` and `pnpm build` load
`next.config.ts`, which validates the variables, so give them the same placeholders CI uses:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_ci RESEND_API_KEY=re_ci_placeholder pnpm check
```
