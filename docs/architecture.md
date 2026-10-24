# HØEM — Software Architecture

Oct 8, 2026 · @Adri · Version 0.1 (draft)

## 1. Introduction

HØEM is a single Next.js application backed by Supabase (PostgreSQL in the EU), with privacy enforced inside the database by row-level security. This document explains how the system is built and why, so that every requirement in the Software Requirements Specification (SRS) has a clear home in the code.

### 1.1 Standards used

| Standard                   | What it gives this document                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ISO/IEC/IEEE 42010:2022    | What an architecture description must contain: stakeholders, concerns, views and the rationale behind decisions |
| C4 model (Simon Brown)     | How the diagrams are drawn: system context, containers, components                                              |
| arc42 (lite)               | The section order: context, building blocks, runtime, deployment, decisions, quality                            |
| ADR, Michael Nygard format | One short record per significant decision: context, decision, consequences                                      |
| RFC 2119                   | MUST, SHOULD and MAY carry the same meaning as in the SRS                                                       |

### 1.2 Quality goals

The five goals below drive every trade-off, in this order of priority.

| Priority | Goal                                                                       | Main SRS requirements                             |
| -------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| 1        | Privacy: no member ever sees data the household rules hide from them       | NFR-SEC-001, FR-HH-001 to 010, NFR-LEG-001 to 003 |
| 2        | Accessibility: WCAG 2.2 AA in both themes                                  | NFR-A11Y-001 to 006                               |
| 3        | Maintainability by one part-time developer                                 | NFR-MNT-001 to 005                                |
| 4        | Responsiveness: shared changes visible in under 2 s, LCP ≤ 2.5 s on mobile | FR-SHOP-003, NFR-PERF-001 to 003                  |
| 5        | Zero running cost on free tiers                                            | SRS 2.4 constraints                               |

### 1.3 Stakeholders

| Stakeholder                   | Concern                                                                   |
| ----------------------------- | ------------------------------------------------------------------------- |
| Household members (end users) | Their private data stays private; the app is fast and simple              |
| The developer                 | Clear structure, few moving parts, fast feedback from tests               |
| Recruiters and interviewers   | A demo that works in a minute; code and decisions that are easy to follow |

## 2. System context and containers

HØEM is one web app on Vercel and one Supabase project, both in the EU; the browser talks to the app over HTTPS and to Supabase Realtime directly for live list updates.

&#91;embedded content: C4 container view · 1 app, 5 Supabase services, 2 external services\]

PostgreSQL, highlighted, is where privacy is decided: the app and the browser reach data only with the user's own token, so the row-level security policies in section 7 apply to every query and every live update.

| Container | Technology                                                        | Responsibility                                                   |
| --------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| Web app   | Next.js (App Router), React, TypeScript, Tailwind, TanStack Query | Pages, Server Actions, REST API, PWA manifest and service worker |
| Database  | PostgreSQL 17 on Supabase, Drizzle ORM                            | All data, RLS policies, triggers, helper functions               |
| Auth      | Supabase Auth                                                     | Sessions, email and Google sign-in, anonymous demo sessions      |
| Realtime  | Supabase Realtime                                                 | Shopping list changes and presence                               |
| Storage   | Supabase Storage                                                  | Recipe photos and avatars in private buckets                     |
| Jobs      | Supabase Edge Functions (Deno) + pg\_cron                         | Reminder dispatch, demo cleanup, invitation expiry               |
| E-mail    | Resend                                                            | Invitation and account e-mails                                   |
| Push      | Browser push services (Apple, Google, Mozilla)                    | Delivering reminders to devices                                  |

## 3. Architecture decisions

Thirteen decisions shape the system. Each is summarised here and lives as its own file in `docs/adr/` (for example `docs/adr/0004-two-layer-authorization.md`), so it can be reviewed in a pull request and superseded later without rewriting history.

| ADR | Decision                                                                             | Status   |
| --- | ------------------------------------------------------------------------------------ | -------- |
| 001 | One Next.js application in one GitHub repository (modular monolith)                  | Accepted |
| 002 | Supabase as the backend platform, hosted in the EU                                   | Accepted |
| 003 | Drizzle ORM for queries and schema; plain SQL migrations for policies                | Accepted |
| 004 | Authorization in two layers: application services and PostgreSQL RLS                 | Accepted |
| 005 | Server Actions for the web app; REST API v1 described with OpenAPI 3.1               | Accepted |
| 006 | Visibility of private records is decided when they are written                       | Accepted |
| 007 | Money stored as integer cents, one currency per household                            | Accepted |
| 008 | Reminders as iCalendar rules, dispatched by a database scheduler, sent with Web Push | Accepted |
| 009 | Deletes are immediate after a 5-second undo window; no soft delete                   | Accepted |
| 010 | Test pyramid: test-first for domain and services, end-to-end per story               | Accepted |
| 011 | Demo mode with anonymous sessions and per-visitor copies                             | Accepted |
| 012 | Internationalisation with next-intl; locale from the profile, not the URL            | Accepted |
| 013 | Production Supabase project stays in Ireland (`eu-west-1`); staging in Frankfurt     | Proposed |

### ADR-001 One Next.js application in one repository

**Context.** One part-time developer builds a web app with a design system, a REST API and background jobs. Splitting these into separate packages (a Turborepo monorepo) adds build configuration, versioning and tooling before any feature exists.

**Decision.** A single Next.js project in one GitHub repository, organised as a modular monolith: code grouped by feature, layers inside each feature, and lint rules that forbid imports across feature boundaries except through each feature's public `index.ts`.

**Consequences.** One build, one deploy, one test run. The design system lives in `src/design-system/` and could be extracted into a package later because nothing outside it reaches into its internals. Rejected: a monorepo (too much setup for the MVP) and a separate backend service (two deploys, duplicated types).

### ADR-002 Supabase as the backend platform

**Context.** The MVP needs PostgreSQL, authentication (email, Google, anonymous), real-time updates for the shopping list, file storage for photos and a scheduler for reminders, within free tiers.

**Decision.** Supabase, in the EU region (Frankfurt), for Postgres, Auth, Realtime, Storage, Edge Functions and pg\_cron. The web app is hosted on Vercel, in the same region. ADR-013 keeps the production project in Ireland instead.

**Consequences.** One managed platform covers every infrastructure need, and EU hosting keeps personal data in the EU (GDPR). Supabase is open source and can be self-hosted, which limits lock-in. Rejected: assembling Auth.js, Neon, Pusher and S3 separately (more integrations, more secrets, more failure points).

### ADR-003 Drizzle ORM and SQL migrations

**Context.** The schema must be typed in TypeScript, versioned, and include row-level security policies, triggers and SQL functions that ORMs do not model well.

**Decision.** Drizzle ORM defines tables in TypeScript (`src/db/schema/`) and generates migrations. Policies, functions and triggers are written as hand-reviewed SQL migrations in the same folder, applied in order by the Supabase CLI.

**Consequences.** Queries are type-safe and close to SQL, so they are easy to reason about. Every policy is visible in code review. Rejected: Prisma (heavier client, weaker fit for RLS and custom SQL).

### ADR-004 Authorization in two layers

**Context.** A privacy leak is the worst failure this product can have (quality goal 1). A single check in application code can be forgotten in one endpoint.

**Decision.** Every request is checked twice. Application services verify membership and role and return a clear error. PostgreSQL row-level security enforces the same rules on every row, using the user's own JWT, so the database refuses what the code forgot. The service-role key is used only by background jobs, never in request handling.

**Consequences.** Defence in depth: a bug in one layer is caught by the other. RLS also protects Realtime subscriptions from the browser. Policies must be tested directly with integration tests that sign in as different users (section 7.5).

### ADR-005 Server Actions and a REST API with OpenAPI

**Context.** The web app benefits from Server Actions (no hand-written fetch code, progressive enhancement). A future native app, the AI assistant and external integrations need a stable, documented HTTP API.

**Decision.** Both entry points call the same application services. Server Actions serve the web UI. A REST API under `/api/v1` exposes the same use cases, is described with OpenAPI 3.1 generated from the shared Zod schemas, and is browsable at `/api/docs`.

**Consequences.** Business rules live once, in the services; the two entry points stay thin. Versioning in the path lets the API evolve without breaking clients. Rejected: Server Actions only (no public API) and tRPC (TypeScript clients only).

### ADR-006 Visibility decided at write time

**Context.** Who can see a private expense depends on the household type and the author's family role (FR-HH-002). FR-HH-007 requires that changing the household type never exposes existing private data.

**Decision.** Each private expense stores `visible_to_parents`, set by a database trigger when the row is inserted, from the household rules in force at that moment. Policies read that column, never the current household type.

**Consequences.** Past records keep the visibility they were created with, which satisfies FR-HH-007 by construction. Changing the rules affects only new records, as the setup screen warns.

### ADR-007 Money as integer cents

**Context.** Floating-point numbers cannot represent most decimal amounts exactly (0.1 + 0.2 ≠ 0.3), which breaks splits and balances.

**Decision.** Amounts are `bigint` cents in the database and `number` cents in TypeScript; formatting to "€43.20" happens only in the interface with `Intl.NumberFormat`. One currency per household (ISO 4217 code). Splits that do not divide evenly give the leftover cent to the payer.

**Consequences.** Totals and balances are exact. Multi-currency households are out of scope.

### ADR-008 Reminders with iCalendar rules and Web Push

**Context.** Notes can repeat (daily, chosen weekdays, monthly, yearly) and must notify chosen members even when the app is closed (FR-NOTE-003, FR-NOTIF-002).

**Decision.** A reminder stores its start, time zone and an RFC 5545 recurrence rule (`FREQ=MONTHLY;BYMONTHDAY=1`), plus a precomputed `next_fire_at`. pg\_cron calls an Edge Function every minute; it sends due reminders with the Web Push protocol (RFC 8030, VAPID keys per RFC 8292), writes them to the in-app notification centre, and computes the next occurrence with the `rrule` library.

**Consequences.** A standard format any calendar understands; times stay correct across daylight-saving changes because rules are evaluated in the user's time zone. Delivery is at most about one minute late. On iOS, push requires the app to be installed to the home screen (FR-NOTIF-004).

### ADR-009 Delete with a 5-second undo, no soft delete

**Context.** NFR-UX-002 requires confirmation or undo for destructive actions. A recycle bin (soft delete) would add a `deleted_at` filter to every query and every policy.

**Decision.** The interface hides the item at once and shows a toast with Undo for 5 seconds; only then does it call the delete. If the page is closed during those 5 seconds, the pending delete is sent on `pagehide`. Deleting a whole household or account still asks for typed confirmation.

**Consequences.** Simple data model and policies. Once the 5 seconds pass, data is gone for good, which also simplifies the GDPR right to erasure.

### ADR-010 Testing strategy

**Context.** Business rules (splits, merging ingredients, privacy) must be right; interfaces change often during the MVP.

**Decision.** A test pyramid. Domain functions and services are written test-first with Vitest (TDD). RLS policies get integration tests against a local Supabase. Each user story gets at least one Playwright end-to-end test once its interface is done, with axe-core accessibility checks on every page visited.

**Consequences.** Fast, stable tests where bugs are most expensive; fewer brittle UI tests. Coverage target 80 % for domain and services (NFR-MNT-003).

### ADR-011 Demo mode with anonymous sessions

**Context.** Reviewers must try the app without registering, without seeing each other's changes (FR-DEMO-001 to 008).

**Decision.** "Try the demo" signs the visitor in with a Supabase anonymous session; a SQL function copies the template households into new households owned by that session. A scheduled job deletes anonymous users and their data after 24 hours. Outgoing actions (invitations, emails, push) check `is_anonymous` in the JWT and refuse.

**Consequences.** The demo runs on exactly the same code and policies as real accounts, so it also demonstrates them.

### ADR-012 Internationalisation

**Context.** English first, Spanish in phase 2 (NFR-I18N-001). The app is behind a sign-in, so localised URLs bring no search benefit.

**Decision.** next-intl with message files per locale (`messages/en.json`). The locale comes from the profile, then the `Accept-Language` header; it is not part of the URL. Dates, numbers and money are formatted with the `Intl` API.

**Consequences.** Clean URLs, one place for every string, and a lint rule can forbid literal text in components.

## 4. Code organisation and conventions

Code is grouped by feature first and by layer second, so everything about shopping lives in one folder and a reader never hunts across the tree.

### 4.1 Repository layout

```
hoem/
├── src/
│   ├── app/                     Next.js routes only: pages, layouts, route handlers
│   │   ├── (auth)/              sign-in, sign-up, password reset
│   │   ├── (app)/               signed-in area: home, meals, shopping, expenses, planner, settings
│   │   └── api/v1/              REST route handlers (thin: parse, call service, respond)
│   ├── features/
│   │   ├── households/          one folder per bounded context
│   │   ├── meals/
│   │   ├── shopping/
│   │   ├── expenses/
│   │   ├── planner/             notes and reminders
│   │   └── notifications/
│   ├── design-system/           tokens, components, Storybook stories
│   ├── db/
│   │   ├── schema/              Drizzle table definitions
│   │   ├── migrations/          generated + hand-written SQL (policies, triggers)
│   │   └── seed/                demo template and local test data
│   └── lib/                     Supabase clients, errors, env, i18n, logging
├── supabase/functions/          Edge Functions: dispatch-reminders, cleanup-demo
├── messages/                    en.json, es.json
├── tests/e2e/                   Playwright specs, one per user story
└── docs/adr/                    Architecture Decision Records
```

### 4.2 Layers inside a feature

Dependencies only point down; an ESLint rule (`eslint-plugin-boundaries`) fails the build when one points up.

| Layer        | Files                                 | Allowed to import | Responsibility                                           |
| ------------ | ------------------------------------- | ----------------- | -------------------------------------------------------- |
| Presentation | `components/`, `app/` pages           | Application       | Render, collect input, show errors                       |
| Entry points | `actions.ts`, `app/api/v1/…/route.ts` | Application       | Auth session, input parsing, response mapping            |
| Application  | `service.ts`                          | Domain, Data      | Use cases, membership and role checks                    |
| Domain       | `domain/*.ts`                         | nothing           | Pure rules: splits, merging ingredients, next occurrence |
| Data         | `repository.ts`                       | `src/db`          | Queries, always scoped by `household_id`                 |

Shared contracts sit beside them: `schemas.ts` (Zod, used by forms, actions and the API) and `index.ts` (the only file other features may import).

### 4.3 Naming

| Thing                    | Convention                                   | Example                                      |
| ------------------------ | -------------------------------------------- | -------------------------------------------- |
| Files and folders        | kebab-case                                   | `shopping-item-row.tsx`                      |
| React components, types  | PascalCase                                   | `ShoppingItemRow`, `Expense`                 |
| Functions, variables     | camelCase, verbs for functions               | `splitEqually()`, `amountCents`              |
| Database tables, columns | snake\_case, plural tables                   | `shopping_items.checked_at`                  |
| Constants, env vars      | UPPER\_SNAKE\_CASE                           | `VAPID_PUBLIC_KEY`                           |
| Branches                 | `type/req-id-short-name`                     | `feat/FR-SHOP-003-realtime-list`             |
| Commits                  | Conventional Commits with the requirement ID | `feat(shopping): live updates (FR-SHOP-003)` |

### 4.4 Errors

Services throw typed `AppError` subclasses, never strings. Each carries a stable code that maps to an HTTP status, a message key in the translation files and, in the API, a Problem Details body (section 5.3).

| Error                   | Code                | HTTP                                                                |
| ----------------------- | ------------------- | ------------------------------------------------------------------- |
| `ValidationError`       | `validation_failed` | 422                                                                 |
| `NotAuthenticatedError` | `not_authenticated` | 401                                                                 |
| `ForbiddenError`        | `forbidden`         | 403                                                                 |
| `NotFoundError`         | `not_found`         | 404 (also for rows RLS hides, so their existence is never revealed) |
| `ConflictError`         | `conflict`          | 409                                                                 |
| `DemoRestrictedError`   | `demo_restricted`   | 403                                                                 |

Unexpected errors are logged with a request ID and shown to the user as a generic message with that ID; stack traces never reach the client.

### 4.5 Other conventions

- **Configuration** follows the Twelve-Factor App: every secret and URL comes from environment variables, validated at start-up with Zod in `src/lib/env.ts`; the app refuses to start if one is missing.
- **Dates:** timestamps are `timestamptz` in UTC; calendar days (a meal, an expense) are `date`; the user's time zone is applied only when displaying.
- **Strings:** no literal user-facing text in components; ESLint (`i18next/no-literal-string`) enforces it.
- **Formatting and style:** Prettier and ESLint run on every commit through Husky and lint-staged; TypeScript runs in `strict` mode.
- **Branching:** GitHub Flow. `main` is always deployable; each issue gets a branch and a pull request that must pass CI before merging.

## 5. API design

The web app talks to the server through Server Actions; everything else uses the REST API under `/api/v1`, and both call the same services (ADR-005).

### 5.1 REST conventions

- **Style:** resource-oriented, JSON bodies, nouns in plural, nested under the household they belong to: `/api/v1/households/{householdId}/expenses`.
- **Methods:** `GET` reads, `POST` creates (201 + `Location` header), `PATCH` updates partially, `DELETE` removes (204). Actions that are not CRUD use a verb sub-resource: `POST /shopping-lists/{id}/finish`.
- **Identifiers:** UUID v7 (time-ordered, so indexes stay compact); never sequential numbers that reveal how many records exist.
- **Formats:** dates ISO 8601 (`2026-10-08`, `2026-10-08T09:00:00Z`), money as `{"amountCents": 8640, "currency": "EUR"}`, property names in camelCase.
- **Pagination:** cursor-based, `?limit=50&cursor=…`, with `nextCursor` in the response; stable under inserts, unlike page numbers.
- **Versioning:** a breaking change creates `/api/v2`; additive fields do not.

### 5.2 Authentication

Requests send the Supabase access token as `Authorization: Bearer <jwt>`. The route handler creates a Supabase client with that token, so every query runs as the user and RLS applies (ADR-004). The web app uses the same token through HTTP-only cookies managed by `@supabase/ssr`.

### 5.3 Errors

Every error response follows RFC 9457 (Problem Details for HTTP APIs), with content type `application/problem+json`:

```json
{
  "type": "https://hoemapp.com/problems/validation_failed",
  "title": "The request has invalid fields",
  "status": 422,
  "detail": "amountCents must be greater than 0",
  "instance": "/api/v1/households/0192…/expenses",
  "requestId": "req_8f3a…",
  "errors": [{ "field": "amountCents", "code": "too_small" }]
}
```

### 5.4 Documentation

The OpenAPI 3.1 document is generated at build time from the Zod schemas (`@asteasolutions/zod-to-openapi`), served at `/api/v1/openapi.json` and rendered at `/api/docs`. A CI step fails if a route has no schema, so the documentation cannot drift from the code.

### 5.5 MVP resources

| Resource      | Endpoints                                                                                                                                     | Requirements                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Households    | `GET/POST /households`, `GET/PATCH/DELETE /households/{id}`                                                                                   | FR-ACC-004, FR-ACC-009, FR-HH-001     |
| Members       | `GET /households/{id}/members`, `PATCH/DELETE …/members/{userId}`                                                                             | FR-ACC-006, FR-HH-006                 |
| Invitations   | `POST /households/{id}/invitations`, `POST /invitations/{token}/accept`                                                                       | FR-ACC-005                            |
| Recipes       | `GET/POST /households/{id}/recipes`, `GET/PATCH/DELETE …/recipes/{recipeId}`                                                                  | FR-MEAL-001, FR-MEAL-002              |
| Meal plan     | `GET …/meal-plan?from=&to=`, `PUT …/meal-plan/{date}/{slot}`                                                                                  | FR-MEAL-003 to 006                    |
| Shopping      | `GET/POST …/shopping-lists`, `POST …/shopping-lists/{listId}/items`, `PATCH/DELETE …/items/{itemId}`, `POST …/shopping-lists/{listId}/finish` | FR-SHOP-001 to 004, FR-INT-001 to 003 |
| Expenses      | `GET/POST …/expenses`, `PATCH/DELETE …/expenses/{expenseId}`, `GET …/balances`                                                                | FR-EXP-001 to 008                     |
| Budgets       | `GET/PUT …/budgets/{month}`                                                                                                                   | FR-EXP-003, FR-EXP-008                |
| Notes         | `GET/POST …/notes`, `PATCH/DELETE …/notes/{noteId}`, `POST …/notes/{noteId}/reminder/done`                                                    | FR-NOTE-001 to 006                    |
| Notifications | `GET /notifications`, `POST /notifications/read`, `POST/DELETE /push-subscriptions`                                                           | FR-NOTIF-001 to 003                   |

Rate limits: 60 write requests per minute per user and 10 demo sessions per hour per IP address, returning 429 with a `Retry-After` header.

## 6. Physical data model

Eighteen tables in the `public` schema hold the MVP. Every row of household content reaches a `household_id`, either in its own column or through its parent (an ingredient through its recipe), and that column is what row-level security checks; only profiles, push subscriptions and notifications belong to a user instead.

&#91;embedded content: table relationships · 18 tables in 6 groups\]

Households, highlighted, own every module's tables; memberships join users to households and carry the role used by every policy.

### 6.1 Common rules

- Primary keys are `uuid` v7 (`id uuid primary key default uuid_generate_v7()`), except link tables, which use composite keys.
- Every table has `created_at timestamptz not null default now()`; editable ones add `updated_at`, maintained by a trigger.
- Foreign keys to a household use `on delete cascade`, so deleting a household deletes its data (SRS 6).
- Money is `bigint` cents with `check (amount_cents > 0)`; quantities are `numeric(10,3)`.
- Every `household_id` and every foreign key is indexed; list queries get composite indexes in the order they filter and sort.

### 6.2 Enumerated types

| Type                | Values                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `household_type`    | `single`, `family`, `shared_flat`, `other`                                                                         |
| `member_role`       | `owner`, `member`                                                                                                  |
| `family_role`       | `parent`, `child`, `relative`                                                                                      |
| `visibility`        | `shared`, `private`                                                                                                |
| `meal_slot`         | `breakfast`, `morning_snack`, `lunch`, `afternoon_snack`, `dinner`                                                 |
| `unit`              | `g`, `kg`, `ml`, `l`, `unit`, `tsp`, `tbsp`, `cup`, `pack`                                                         |
| `shopping_category` | `produce`, `dairy`, `meat_fish`, `bakery`, `pantry`, `frozen`, `drinks`, `home_cleaning`, `personal_care`, `other` |
| `expense_category`  | `groceries`, `home`, `utilities`, `eating_out`, `transport`, `leisure`, `health`, `education`, `other`             |

### 6.3 Tables

**Accounts and households**

| Table         | Columns (beyond id and timestamps)                                                                             | Constraints and indexes                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `profiles`    | `id` = `auth.users.id`, `display_name`, `avatar_path`, `locale`, `time_zone`, `theme`, `is_minor bool`         | Created by a trigger on sign-up                                                                      |
| `households`  | `name`, `type household_type`, `currency char(3)`, `settings jsonb`, `created_by`                              | `settings` holds split rules, meal slots in use and, for `other`, the privacy options                |
| `memberships` | `household_id`, `user_id`, `role member_role`, `family_role family_role null`, `can_join_splits bool`          | PK (`household_id`, `user_id`); `family_role` required only when the household is `family` (trigger) |
| `invitations` | `household_id`, `email citext`, `role`, `family_role`, `token_hash`, `expires_at`, `accepted_at`, `invited_by` | Token stored only as a SHA-256 hash; `expires_at` = created + 7 days                                 |

**Meals and shopping**

| Table                | Columns                                                                                                        | Constraints and indexes                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `recipes`            | `household_id`, `created_by`, `name`, `photo_path`, `servings`, `prep_minutes`, `tags text[]`, `steps text[]`  | GIN index on `tags`; trigram index on `name` for search                                                       |
| `recipe_ingredients` | `recipe_id`, `position`, `name`, `quantity`, `unit`                                                            | Unique (`recipe_id`, `position`)                                                                              |
| `meal_plan_entries`  | `household_id`, `owner_id null`, `visibility`, `date`, `slot meal_slot`, `recipe_id null`, `title`, `servings` | Unique (`household_id`, `owner_id`, `date`, `slot`) with `nulls not distinct`; index (`household_id`, `date`) |
| `shopping_lists`     | `household_id`, `owner_id null`, `visibility`, `name`                                                          | `owner_id` set only when private                                                                              |
| `shopping_items`     | `list_id`, `household_id`, `name`, `quantity`, `unit`, `category`, `added_by`, `checked_at`, `checked_by`      | Index (`list_id`, `checked_at`); `household_id` copied from the list so RLS needs no join                     |

**Money**

| Table            | Columns                                                                                                                                             | Constraints and indexes                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `expenses`       | `household_id`, `created_by`, `paid_by`, `visibility`, `visible_to_parents bool`, `amount_cents bigint`, `category`, `description`, `spent_on date` | Index (`household_id`, `spent_on desc`); `visible_to_parents` set by trigger (ADR-006)                              |
| `expense_shares` | `expense_id`, `user_id`, `amount_cents`                                                                                                             | PK (`expense_id`, `user_id`); deferred check that shares add up to the expense                                      |
| `budgets`        | `household_id`, `owner_id null`, `month date`, `category null`, `limit_cents`                                                                       | Unique (`household_id`, `owner_id`, `month`, `category`) with `nulls not distinct`; `owner_id` null = shared budget |

**Planner and notifications**

| Table                 | Columns                                                                                                              | Constraints and indexes                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `notes`               | `household_id`, `created_by`, `visibility`, `body`, `pinned bool`                                                    | `check (char_length(body) <= 500)`                               |
| `reminders`           | `note_id`, `starts_at timestamptz`, `time_zone`, `rrule text null`, `next_fire_at timestamptz null`, `last_fired_at` | Unique `note_id`; partial index on `next_fire_at` where not null |
| `reminder_recipients` | `reminder_id`, `user_id`                                                                                             | PK (`reminder_id`, `user_id`)                                    |
| `notifications`       | `user_id`, `household_id null`, `kind`, `title`, `body`, `link`, `read_at`                                           | Index (`user_id`, `created_at desc`)                             |
| `push_subscriptions`  | `user_id`, `endpoint text unique`, `p256dh`, `auth`, `user_agent`                                                    | Removed when the push service answers 404 or 410                 |
| `activity_events`     | `household_id`, `actor_id`, `kind`, `entity`, `entity_id`                                                            | Written only for shared records (FR-DASH-005)                    |

## 7. Authorization and row-level security

Every table has RLS enabled with no default access; a row is visible only when a policy says so, and the policies encode the household rules of SRS 3.7 directly.

### 7.1 Helper functions

Policies call a few `security definer` functions so membership is looked up once, by primary key, instead of repeated subqueries. They are `stable`, have a fixed `search_path` and are not callable through the API.

| Function                      | Returns true when the current user (`auth.uid()`) …                             |
| ----------------------------- | ------------------------------------------------------------------------------- |
| `is_member(hh uuid)`          | belongs to household `hh`                                                       |
| `is_owner(hh uuid)`           | is an owner of `hh`                                                             |
| `is_parent(hh uuid)`          | has the family role `parent` in `hh`                                            |
| `can_manage_members(hh uuid)` | may invite and change roles: owner, or parent in a family household (FR-HH-006) |

### 7.2 Who can see what

| Record                  | Shared                                      | Private: author       | Private: parent in a family                        | Private: anyone else |
| ----------------------- | ------------------------------------------- | --------------------- | -------------------------------------------------- | -------------------- |
| Expense                 | every member                                | yes                   | yes, when `visible_to_parents` (a child's expense) | no                   |
| Shopping list and items | every member                                | yes                   | no                                                 | no                   |
| Meal plan entry         | every member                                | yes                   | no (families have one shared plan)                 | no                   |
| Note and its reminder   | every member                                | yes                   | no                                                 | no                   |
| Budget                  | every member                                | yes (personal budget) | no                                                 | no                   |
| Recipe                  | every member (recipes have no private mode) | —                     | —                                                  | —                    |

In `other` households the owner's privacy settings are copied into `visible_to_parents` at write time in the same way (ADR-006), so the table above holds for every type.

### 7.3 The expense policies

```sql
alter table expenses enable row level security;

create policy expenses_select on expenses for select using (
  is_member(household_id) and (
    visibility = 'shared'
    or created_by = auth.uid()
    or (visible_to_parents and is_parent(household_id))
  )
);

create policy expenses_insert on expenses for insert with check (
  is_member(household_id)
  and created_by = auth.uid()
  and (visibility = 'shared' or paid_by = auth.uid())
);

create policy expenses_update on expenses for update using (
  created_by = auth.uid()
  or (visibility = 'shared' and is_owner(household_id))
) with check (created_by = auth.uid() or is_owner(household_id));

create policy expenses_delete on expenses for delete using (
  created_by = auth.uid()
  or (visibility = 'shared' and is_owner(household_id))
);
```

The trigger that fills `visible_to_parents` runs `before insert`, ignores any value the client sends, and leaves the column unchanged on update, so nobody can make a past expense more visible.

### 7.4 Other rules enforced in the database

- **Memberships:** members can read the member list of their households; only `can_manage_members` can change roles; the last owner cannot leave or be removed (trigger).
- **Invitations:** readable by managers of the household; accepting goes through a `security definer` function that checks the token hash, the expiry and the e-mail of the signed-in user.
- **Minors:** a profile with `is_minor` can join only a `family` household, added by a parent (NFR-LEG-001).
- **Storage:** recipe photos live under `households/{household_id}/…` in a private bucket; storage policies reuse `is_member`, and the app serves them through short-lived signed URLs.
- **Realtime:** the browser subscribes to `shopping_items` changes; Supabase checks the `select` policy for each change before sending it, so private items never reach other members.

### 7.5 Testing the policies

Policies are tested against a local Supabase with real JWTs. One fixture builds a family (two parents, a child, a relative) and a shared flat (two flatmates). Every row of the table in 7.2 becomes a test that signs in as each person and asserts what they can and cannot read, write and delete. A failing policy test blocks the merge.

## 8. Background jobs, notifications and real time

Three scheduled jobs run inside Supabase (pg\_cron calling Edge Functions with the service-role key); everything a user does still goes through the request path and RLS.

### 8.1 Scheduled jobs

| Job                  | Schedule         | What it does                                                                                                                         | Requirements             |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `dispatch-reminders` | every minute     | Picks reminders with `next_fire_at <= now()` using `for update skip locked`, notifies their recipients, computes the next occurrence | FR-NOTE-003, FR-NOTE-004 |
| `cleanup-demo`       | every hour       | Deletes anonymous users older than 24 h; cascades remove their households                                                            | FR-DEMO-007              |
| `expire-invitations` | daily, 03:00 UTC | Deletes invitations past `expires_at` that were never accepted                                                                       | FR-ACC-005               |

### 8.2 How a reminder reaches a phone

1. A member saves a note with a reminder; the service validates the rule and stores `next_fire_at`, computed in the member's time zone.
2. Every minute, `dispatch-reminders` locks the due rows, so two runs never send the same reminder twice.
3. For each recipient it inserts a row in `notifications` (the in-app centre, FR-NOTIF-003) and sends a Web Push message to each of that user's subscriptions, signed with the VAPID private key.
4. A subscription the push service rejects with 404 or 410 is deleted; other failures are retried on the next run, up to three times.
5. The job stores the next occurrence from the rule, or clears `next_fire_at` for a one-off reminder.
6. On the device, the service worker shows the notification; tapping it opens the note.

### 8.3 Other notifications

| Event                                | Delivered by                          | Recipients                     |
| ------------------------------------ | ------------------------------------- | ------------------------------ |
| Invitation to a household            | E-mail through Resend (transactional) | The invited address            |
| Item added to the shared list        | Push + centre, if the user opted in   | Other members                  |
| Shared budget reaches 80 % and 100 % | Push + centre                         | Owners, or parents in a family |
| Reminder due                         | Push + centre                         | Recipients chosen on the note  |

No notification ever mentions a private record of another member.

### 8.4 Real time

The shopping list subscribes to Postgres changes on `shopping_items` filtered by `list_id`. Each change is checked against RLS before it is sent (section 7.4), arrives in well under the 2-second target of FR-SHOP-003, and is merged into the TanStack Query cache, so the list updates without a reload. Presence ("Marcos is on this list") uses a Realtime presence channel per list.

## 9. Environments, delivery and traceability

Every pull request gets its own preview deployment and must pass the same checks that guard production.

### 9.1 Environments

| Environment                | Address                                       | Web app                    | Database                                           | Data                                       |
| -------------------------- | --------------------------------------------- | -------------------------- | -------------------------------------------------- | ------------------------------------------ |
| Local                      | `localhost:3000`                              | `pnpm dev`                 | Supabase CLI in Docker                             | Seed script: two households, demo template |
| Preview (per pull request) | `*.vercel.app` preview URL                    | Vercel preview             | Supabase staging project, migrations applied by CI | Seed data, reset weekly                    |
| Production                 | `https://hoemapp.com` (`www` redirects to it) | Vercel, `fra1` (Frankfurt) | Supabase production project, Ireland (ADR-013)     | Real users and the demo template           |

**Domain and e-mail.** The domain `hoemapp.com` is registered at Cloudflare, which also hosts its DNS. Vercel serves the app on it with an automatic TLS certificate. Resend sends from `no-reply@hoemapp.com` (region eu-west-1) on a verified domain. Its records are added through Resend's Cloudflare integration (MX and SPF on send, DKIM on resend.\_domainkey), plus a DMARC record on \_dmarc that we add ourselves, so invitations are not marked as spam. Every record for Vercel and Resend is "DNS only" (Cloudflare proxy off), so TLS and caching stay with Vercel and e-mail authentication is not altered. Supabase Auth uses the same Resend account as its SMTP server, so password-reset and confirmation e-mails come from the same address. The VAPID contact for Web Push is `mailto:hello@hoemapp.com`.

### 9.2 Pipeline

GitHub Actions runs these jobs on every pull request; all must pass before merging into `main`.

| Order | Job                                         | Fails when                                                               |
| ----- | ------------------------------------------- | ------------------------------------------------------------------------ |
| 1     | Install, type-check, lint, format check     | Any TypeScript, ESLint or Prettier error, including layer and i18n rules |
| 2     | Unit tests (Vitest) with coverage           | A test fails, or domain and services drop below 80 %                     |
| 3     | Policy tests against Supabase in Docker     | Any row of the visibility matrix (7.2) is wrong                          |
| 4     | Build and OpenAPI generation                | The build fails or a route has no schema                                 |
| 5     | End-to-end tests (Playwright) with axe-core | A story test fails or an accessibility violation is found                |
| 6     | Lighthouse CI on the preview URL            | Any score below 90 (NFR-PERF-002)                                        |
| 7     | Secret scanning and dependency audit        | A secret is committed or a high-severity vulnerability is found          |

Merging into `main` deploys to production: migrations run first, then Vercel promotes the build. Releases are tagged with Semantic Versioning (`v1.0.0` at Gate B).

A scheduled workflow (`keep-alive.yml`, every three days and on demand) calls the `ping()` SQL function on the staging and production projects with the publishable key, so the free Supabase tier never pauses them; it fails loudly if either project does not answer.

### 9.3 Observability

- Errors from the browser and server go to Sentry, with the request ID and no personal data in the payload.
- Logs are structured JSON (`pino`), one line per request, with user and household IDs but never note text or amounts.
- Vercel Analytics records Core Web Vitals from real visits.

### 9.4 Traceability

Every requirement ID in the SRS appears in the branch name, the commit messages and at least one test name (`it('FR-EXP-007 hides a private expense from other flatmates')`), so a search for an ID finds where it is built and proved.

| Area                                      | Where it is built                           | How it is proved                                  |
| ----------------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| Household rules (FR-HH)                   | Trigger and policies, `features/households` | Policy tests (7.5), E2E per type                  |
| Shopping and real time (FR-SHOP, FR-INT)  | `features/shopping`, Realtime channel       | Unit tests for merging, E2E with two browsers     |
| Expenses and splits (FR-EXP)              | `features/expenses/domain`                  | TDD on splits and balances                        |
| Planner and reminders (FR-NOTE, FR-NOTIF) | `features/planner`, `dispatch-reminders`    | Unit tests for next occurrence across DST changes |
| Demo (FR-DEMO)                            | Clone function, `cleanup-demo`              | E2E: two visitors never see each other's changes  |
| Accessibility (NFR-A11Y)                  | Design system                               | axe-core in Storybook and E2E                     |

### 9.5 Resolved questions

- Domain: `hoemapp.com`, already registered.
- E-mail provider: Resend, account already created; the free tier (3,000 e-mails a month) covers the MVP.
