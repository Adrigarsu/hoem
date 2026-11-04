# Testing

How to write tests that pass in jsdom and in three browsers. The strategy is ADR-010; the rules
(test-first, names that start with the requirement ID, queries by role) are in `AGENTS.md` and
`.claude/rules/testing.md`.

## Commands

| Command              | What it runs                                                                    |
| -------------------- | ------------------------------------------------------------------------------- |
| `pnpm test`          | Unit and component tests (Vitest, jsdom)                                        |
| `pnpm test:coverage` | The same, failing below 80 % on domain, services and pure utilities             |
| `pnpm db:test`       | pgTAP database and policy tests, against the local Supabase                     |
| `pnpm test:e2e`      | Playwright on a production build: Chromium, Chrome and Safari at 360, 768, 1440 |

## Unit and component tests

- jsdom joins the text of sibling spans without the spaces a browser adds, so an accessible name
  built from several spans may need a looser match in unit tests: `/^Appearance ?, ?System$/`.

## End-to-end tests

**Opening pages**

- Open pages with the `visit` fixture (`tests/e2e/support/fixtures.ts`), so axe-core and the
  no-horizontal-scroll check run on every one, in both themes.
- Sign in and out with `signIn` and `signOut` from `tests/e2e/support/session.ts`: right after
  signing out, Account settings (which has an Email field) is briefly still on screen.
- After clicking a link, wait for the new page's heading before calling `visit` on the same URL,
  or Safari interrupts the navigation.

**Finding elements**

- Next.js keeps a route announcer with `role="alert"`: look for a page's alert inside `main`.
- Look for texts inside `main` too (`page.getByRole("main").getByText(…)`): while a page streams in,
  React keeps a hidden copy of a Suspense boundary outside `main` for an instant, and strict mode
  fails.
- Next.js keeps the previous route in a hidden `<Activity>` after a client navigation, so its fields
  stay in the DOM: prefer `getByRole` to `getByLabel`, and interact without reloading to catch what
  a route leaves behind.
- `getByLabel` matches substrings ("Email" also finds "Your email"): pass `{ exact: true }`.
- `/settings` holds one block per width, so filter what is on screen (`:visible`). A modal shared by
  both blocks lives once, outside them (see `DeleteAccountProvider`), never once per block.

**Imports and clean-up**

- Specs import a feature's pure modules (`domain/`, `schemas.ts`) directly: its `index.ts` also
  brings `server-only` code, which Playwright cannot load.
- Effects must clean up (`Dialog` closes itself), or the next page is inert.
