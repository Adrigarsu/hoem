# HØEM — Software Requirements Specification

Oct 6, 2026 · @Adri · Version 0.1 (draft)

## 1. Introduction

### 1.1 Purpose

This document specifies the requirements for HØEM, a web application to manage everyday home life: meals, shopping and money, shared between the people who live together. It is the single source of truth for scope, and every feature, test and commit should trace back to a requirement ID defined here.

### 1.2 Scope

HØEM is a responsive web application (desktop and mobile browsers). The MVP covers accounts and households, a daily dashboard, recipes and daily meal planning, a shared shopping list and basic expense tracking. Savings goals, subscriptions, shopping history, household chores, habits, receipt scanning and an AI assistant are planned for later phases (section 4).

Out of scope: pantry or home inventory, native mobile apps, bank account integrations, smart-home devices, payments between users and any automated decision-making without user confirmation.

### 1.3 Document conventions

The structure follows ISO/IEC/IEEE 29148:2018 (Requirements engineering). Each requirement has a unique, stable ID:

| Prefix           | Meaning                    | Example      |
| ---------------- | -------------------------- | ------------ |
| FR-\<MODULE>-NNN | Functional requirement     | FR-MEAL-003  |
| NFR-\<AREA>-NNN  | Non-functional requirement | NFR-A11Y-001 |
| US-\<MODULE>-NN  | User story                 | US-SHOP-02   |

Priorities use MoSCoW: **Must** (MVP blocker), **Should** (MVP if time allows), **Could** (later phase), **Won't** (explicitly excluded for now). The keywords MUST, SHOULD and MAY follow RFC 2119.

### 1.4 References

- ISO/IEC/IEEE 29148:2018 — Systems and software engineering, requirements engineering
- WCAG 2.2 — Web Content Accessibility Guidelines (level AA)
- OWASP Top 10 (2021) and OWASP ASVS 4.0 — web security
- RFC 2119 — requirement keywords
- HØEM visual reference (design by a third party, used with permission)

## 2. Product overview

### 2.1 Vision

HØEM reduces the mental load of running a home by connecting tasks that usually live in separate apps. A planned meal sends its ingredients to the shopping list in one tap; finishing the shopping records the expense. The user always decides; HØEM organises, connects and reminds.

### 2.2 Personas

| Persona                   | Context                                     | Main need                                                  |
| ------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| Lucía, 22, student        | Shares a flat with two people, tight budget | Split shared expenses fairly and avoid buying things twice |
| Marcos, 34, couple        | Both work full time, cooks at weekends      | Plan the week's meals in 10 minutes and shop once          |
| Elena, 45, family of four | Manages most household logistics alone      | Share the load: everyone sees and updates the same list    |

### 2.3 Operating environment

- Latest two versions of Chrome, Firefox, Safari and Edge, desktop and mobile.
- Viewports from 360 px wide (mobile) to 1920 px (desktop).
- Light theme by default; dark theme available from the MVP, following the system preference unless the user overrides it.
- Interface language: English in the MVP, with all text externalised so Spanish can be added without code changes.

### 2.4 Assumptions and constraints

- Every piece of data belongs to a household, never directly to a user. A new user gets a personal household automatically (see section 6). Private expenses still belong to the household but are visible only to their creator.
- Users have a stable internet connection in the MVP; offline support is a phase 3 item.
- Hosting must fit free tiers (Vercel, Supabase) during development and for the portfolio demo.
- One developer, part-time: scope per phase must stay deliverable in roughly 6–8 weeks.
- Monetary amounts use a single currency per household (EUR by default).

## 3. Functional requirements (MVP)

The MVP has five modules plus the integrations between them. Acceptance criteria use the Given / When / Then format (Gherkin), so they can become automated end-to-end tests directly.

### 3.1 Accounts and households (ACC)

| ID         | Requirement                                                                                                                                                                                                                                                                                          | Priority |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-ACC-001 | Users can sign up and sign in with email and password, with email verification.                                                                                                                                                                                                                      | Must     |
| FR-ACC-002 | Users can sign in with Google (OAuth 2.0).                                                                                                                                                                                                                                                           | Should   |
| FR-ACC-003 | On sign-up, the system creates a personal household of type "single person" with the user as owner.                                                                                                                                                                                                  | Must     |
| FR-ACC-004 | A user can belong to several households and switch the active one from the header.                                                                                                                                                                                                                   | Must     |
| FR-ACC-005 | An owner can invite people by email; the invitation link expires after 7 days.                                                                                                                                                                                                                       | Must     |
| FR-ACC-006 | Roles: owner (manages members and settings) and member (manages content). In family households each person is also a parent, a child or a relative (see 3.7).                                                                                                                                        | Must     |
| FR-ACC-007 | Users can edit their profile (name, avatar, theme, language) and delete their account.                                                                                                                                                                                                               | Must     |
| FR-ACC-008 | Users can reset a forgotten password by email.                                                                                                                                                                                                                                                       | Must     |
| FR-ACC-009 | Each household has a type: single person, family, shared flat or other. The owner sets it on creation and can change it in settings.                                                                                                                                                                 | Must     |
| FR-ACC-010 | The household type sets roles, visibility rules and defaults as described in 3.7.                                                                                                                                                                                                                    | Must     |
| FR-ACC-011 | Sign in with Apple. Not needed for the web app to work on Apple devices (Safari supports email and Google sign-in); it requires a paid Apple Developer account and renewing the signing key every 6 months. Reconsider only if a native iOS app is published, where App Store guideline 4.8 applies. | Won't    |

**US-ACC-01 — Invite a flatmate.** As a household owner, I want to invite my flatmate by email so that we can share the shopping list and expenses.

- Given I am the owner of a household, when I send an invitation to a valid email, then the invitee receives a link valid for 7 days.
- Given I received an invitation, when I open the link and sign in, then I join the household as a member and see its data.
- Given an invitation is older than 7 days, when someone opens it, then the system shows that it has expired.

### 3.2 Dashboard (DASH)

| ID          | Requirement                                                                                                             | Priority |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-DASH-001 | The home screen greets the user by name according to the time of day.                                                   | Must     |
| FR-DASH-002 | It shows today's planned meals, slot by slot.                                                                           | Must     |
| FR-DASH-003 | It shows the number of pending items on the shopping list, with a link to it.                                           | Must     |
| FR-DASH-004 | It shows this month's shared spending against the household budget and, separately, the user's own private spending.    | Must     |
| FR-DASH-005 | It shows a feed of recent activity by household members (e.g. "Lucía added milk"); private expenses never appear in it. | Should   |

### 3.3 Recipes and meal plan (MEAL)

| ID          | Requirement                                                                                                                                  | Priority |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-MEAL-001 | Members can create, edit and delete recipes: name, photo, servings, prep time, ingredients (name, quantity, unit) and steps.                 | Must     |
| FR-MEAL-002 | Members can search recipes by name and filter by tag (e.g. vegetarian, quick).                                                               | Must     |
| FR-MEAL-003 | Each day has five meal slots: breakfast, morning snack, lunch, afternoon snack and dinner. The plan can be viewed by day or as a 7-day week. | Must     |
| FR-MEAL-004 | Members can assign a recipe to a slot by drag and drop, with a keyboard-accessible alternative.                                              | Must     |
| FR-MEAL-005 | Members can adjust servings per planned meal; ingredient quantities scale proportionally.                                                    | Should   |
| FR-MEAL-006 | Members can copy last week's plan into the current week.                                                                                     | Could    |
| FR-MEAL-007 | Members can hide meal slots their household does not use (e.g. snacks).                                                                      | Should   |

### 3.4 Shopping list (SHOP)

| ID          | Requirement                                                                          | Priority |
| ----------- | ------------------------------------------------------------------------------------ | -------- |
| FR-SHOP-001 | Members can add, edit, check and remove items (name, quantity, unit, category).      | Must     |
| FR-SHOP-002 | Items are grouped by category (produce, dairy, cleaning…).                           | Must     |
| FR-SHOP-003 | Changes made by one member appear for the others within 2 seconds without reloading. | Must     |
| FR-SHOP-004 | Members can clear all checked items in one action.                                   | Must     |
| FR-SHOP-005 | The list remembers frequent items and suggests them while typing.                    | Could    |

### 3.5 Expenses (EXP)

| ID         | Requirement                                                                                                                                                                | Priority |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-EXP-001 | Members can record an expense: amount, date, category, description, who paid and visibility (shared or private).                                                           | Must     |
| FR-EXP-002 | Members can list expenses by month and filter by category, payer and visibility.                                                                                           | Must     |
| FR-EXP-003 | Owners can set a monthly budget for shared expenses, overall and optionally per category.                                                                                  | Must     |
| FR-EXP-004 | A monthly summary shows totals per category as a simple chart, in two views: household (shared only) and personal (own private expenses plus own share of shared ones).    | Must     |
| FR-EXP-005 | An expense can be marked as shared, splitting it equally between selected members.                                                                                         | Should   |
| FR-EXP-006 | The system shows balances between members (who owes whom), based on shared expenses only.                                                                                  | Should   |
| FR-EXP-007 | Private expenses are visible only to their creator, except where the household type allows otherwise (see 3.7). They never count in household totals, budgets or balances. | Must     |
| FR-EXP-008 | Each member can set a personal monthly budget for their private expenses.                                                                                                  | Must     |

**US-EXP-01 — Shared and private expenses in one place.** As a member of a family household, I want to record both household and personal expenses so that I can track all my money in one app.

- Given I did the family's weekly shop on Monday, when I save it as shared, then every member sees it and it counts in the household total.
- Given I bought a toy for myself on Tuesday, when I save it as private, then only I can see it and it does not count in the household total.
- Given another member opens the expenses list, when my private expense exists, then it does not appear in their list, summary or balances.

### 3.6 Cross-module integrations (INT)

These connections are the product's main differentiator.

| ID         | Requirement                                                                                                                                                             | Priority |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-INT-001 | From any recipe or planned meal, a member can add its ingredients to the shopping list; an ingredient already on the list with the same unit is merged, not duplicated. | Must     |
| FR-INT-002 | Before adding them, the member reviews the ingredients and can untick the ones already at home.                                                                         | Must     |
| FR-INT-003 | When finishing a shopping trip, the member can record the total as an expense in the "Groceries" category in one step, shared by default.                               | Must     |

**US-INT-01 — From recipe to shopping list.** As a member, I want to add a recipe's ingredients to the shopping list so that I don't have to type them one by one.

- Given a planned meal with a recipe, when I choose "Add ingredients to shopping list", then I see its ingredients with checkboxes, all ticked.
- Given I untick olive oil because I already have it, when I confirm, then only the ticked ingredients are added.
- Given the list already has "Rice — 200 g", when I add a recipe that needs 300 g of rice, then the list shows a single item "Rice — 500 g".

### 3.7 Household types and permissions (HH)

The household type decides who can see what. These rules are enforced in the database (NFR-SEC-001), not just hidden in the interface.

| Rule                        | Single person | Family                                                       | Shared flat                                           | Other        |
| --------------------------- | ------------- | ------------------------------------------------------------ | ----------------------------------------------------- | ------------ |
| Roles                       | Owner         | Parent, child or relative                                    | Owner or member                                       | Configurable |
| Who manages members         | Owner         | Parents                                                      | Owner                                                 | Owner        |
| Private expenses visible to | Creator       | Creator; a child's also to the parents                       | Creator only                                          | Configurable |
| Meal plan                   | Personal      | One plan shared by the whole family                          | Shared and private plans                              | Configurable |
| Private shopping lists      | Not needed    | Yes, alongside shared lists                                  | Yes, alongside shared lists                           | Configurable |
| Expense splitting           | Off           | Optional; between parents by default, others can be included | Each member chooses which expenses to share and split | Configurable |

In "other" households the owner sets each rule, choosing among the options the other types use. A new "other" household starts with the shared-flat settings.

| ID        | Requirement                                                                                                                                                                                                                                                                                                                                                                   | Priority |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-HH-001 | The household type determines roles, visibility and defaults according to the table above.                                                                                                                                                                                                                                                                                    | Must     |
| FR-HH-002 | In family households, parents can see every child's expenses, including private ones; children cannot see parents' private expenses.                                                                                                                                                                                                                                          | Must     |
| FR-HH-003 | When a child marks an expense as private, the form clearly states that their parents can still see it.                                                                                                                                                                                                                                                                        | Must     |
| FR-HH-004 | In shared flats, private expenses are visible only to their creator, with no exception for owners.                                                                                                                                                                                                                                                                            | Must     |
| FR-HH-005 | In family households and shared flats, members can create private shopping lists, visible only to them, alongside the shared ones. Private meal plans exist only in shared flats; a family has a single shared meal plan.                                                                                                                                                     | Must     |
| FR-HH-006 | In family households, only parents can invite people and assign the parent, child or relative role.                                                                                                                                                                                                                                                                           | Must     |
| FR-HH-007 | Changing the household type never exposes existing private data: new visibility rules only apply to records created after the change, and the owner is warned before confirming.                                                                                                                                                                                              | Must     |
| FR-HH-008 | Family households have a relative role for any other family member (e.g. a grandparent or an aunt). Relatives work with shared content like any adult member; their private expenses are visible only to them, and they cannot see anyone else's private expenses.                                                                                                            | Must     |
| FR-HH-009 | In family households, parents decide through a household setting whether expenses can be split equally. When enabled, any expense, shared or private and including children's, can be split between the parents by default. Parents can authorise other members (children or relatives) to take part in splits; the app does not check ages and relies on that authorisation. | Must     |
| FR-HH-010 | In "other" households, the owner can configure each rule in the table above from a settings screen.                                                                                                                                                                                                                                                                           | Should   |

**US-HH-01 — Parents oversee family spending.** As a parent in a family household, I want to see my children's expenses, including private ones, so that I can help them manage their money.

- Given my son saves a private expense, when I open the expenses list, then I see it labelled as his private expense.
- Given I save a private expense, when my son opens the expenses list, then he does not see it.
- Given my flatmate saves a private expense in our shared flat, when I open the list as owner, then I do not see it.

### 3.8 Demo mode (DEMO)

People reviewing the project (recruiters, interviewers) will not register, create a household and invite others. The demo lets anyone explore a realistic HØEM in under a minute, without an account.

| ID          | Requirement                                                                                                                                                   | Priority |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-DEMO-001 | The sign-in screen offers "Try the demo", which opens HØEM without registering.                                                                               | Must     |
| FR-DEMO-002 | Each visitor gets a private, temporary copy of the demo data through an anonymous session, so visitors never see each other's changes.                        | Must     |
| FR-DEMO-003 | The demo data covers every MVP module: recipes, two weeks of planned meals, an active shopping list, and a month of shared and private expenses with budgets. | Must     |
| FR-DEMO-004 | The demo includes two households, a family and a shared flat, so visitors can switch between them and see how the rules in 3.7 change.                        | Should   |
| FR-DEMO-005 | A persistent banner states that this is a demo and offers "Create your own account".                                                                          | Must     |
| FR-DEMO-006 | Actions that reach the outside world are disabled in the demo (sending invitations or emails, changing email or password), with a message explaining why.     | Must     |
| FR-DEMO-007 | Demo copies and their anonymous users are deleted automatically 24 hours after creation.                                                                      | Must     |
| FR-DEMO-008 | Demo creation is rate-limited per IP address to prevent abuse.                                                                                                | Should   |

**US-DEMO-01 — Try it in two minutes.** As a recruiter reviewing a portfolio, I want to try HØEM without creating an account so that I can judge the product quickly.

- Given I open HØEM and choose "Try the demo", when the demo loads, then I land on a dashboard with realistic data within 3 seconds.
- Given I check items on the demo shopping list, when another visitor opens the demo, then they see the original, unchanged list.
- Given I try to invite someone, when I press Invite, then the app explains that invitations are disabled in the demo.

Implementation note: Supabase anonymous sign-ins create the session; a database function copies a template household into the visitor's own household, and a scheduled job removes expired copies.

### 3.9 Household setup guide (ONB)

A new household is empty, and an empty app is hard to understand. The setup guide walks the owner through the few decisions that change how HØEM behaves, in short steps that can all be changed later in settings.

| ID         | Requirement                                                                                                                                                      | Priority |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-ONB-001 | After creating a household, the owner can choose "Set it up with me" or "Skip for now"; skipping is always possible and the guide can be reopened from settings. | Must     |
| FR-ONB-002 | Step 1, the household: name and type (single person, family, shared flat, other).                                                                                | Must     |
| FR-ONB-003 | Step 2, meals: which of the five daily meal slots the household uses.                                                                                            | Must     |
| FR-ONB-004 | Step 3, money: currency, monthly shared budget (optional) and whether shared expenses are split, with the default for the chosen type pre-selected.              | Must     |
| FR-ONB-005 | Step 4, people: invite members by email and, in family households, choose their role. Can be left empty.                                                         | Must     |
| FR-ONB-006 | A progress indicator shows the current step and the total (e.g. "Step 2 of 4"); Back keeps what was entered.                                                     | Must     |
| FR-ONB-007 | Steps that do not apply to the type are skipped (a single-person household has no splitting or invitations step).                                                | Should   |

**US-ONB-01 — Ready in two minutes.** As someone who has just created a household, I want a short guided setup so that the app matches how my home works from day one.

- Given I created a household, when the guide opens, then I can start it or skip it.
- Given I chose "Shared flat" in step 1, when I reach step 3, then splitting shared expenses is already switched on.
- Given I finish or skip the guide, when I open Settings, then I can run it again.

### 3.10 Notes and reminders (NOTE)

Short free-text notes that live on the home screen, optionally with a reminder. They cover what the other modules do not: "Pay the rent to the landlord", "Water the plants", "Grandma's birthday".

| ID          | Requirement                                                                                                            | Priority |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-NOTE-001 | Members can create, edit, pin and delete notes made of free text (up to 500 characters).                               | Must     |
| FR-NOTE-002 | Each note is shared with the household or private, following the visibility rules of 3.7.                              | Must     |
| FR-NOTE-003 | A note can have a reminder on a date and time, or a repeating one: daily, weekly (chosen weekdays), monthly or yearly. | Must     |
| FR-NOTE-004 | On a shared note, the creator chooses which members receive the reminder; by default only the creator.                 | Must     |
| FR-NOTE-005 | Home shows pinned notes and the next upcoming reminders first, with "See all".                                         | Must     |
| FR-NOTE-006 | Members can mark a reminder as done or snooze it (1 hour, tonight, tomorrow).                                          | Should   |

**US-NOTE-01 — Never forget the rent.** As a flatmate, I want a monthly reminder to pay the rent so that I don't have to remember it myself.

- Given I create the note "Pay rent to Ana" with a monthly reminder on day 1 at 09:00, when that moment arrives, then I receive a push notification.
- Given the note is shared and I chose Marcos as a recipient, when the reminder fires, then Marcos receives it too.
- Given I mark the reminder as done, when I open Home, then the next occurrence is shown for next month.

Implementation note: repeating reminders are stored as iCalendar recurrence rules (RFC 5545), for example `FREQ=MONTHLY;BYMONTHDAY=1`, the same format used by Google Calendar and Outlook. A scheduled job computes the next occurrence and sends the notifications.

### 3.11 Navigation and notifications (NAV)

| ID           | Requirement                                                                                                                                                                                                                                                                                                                                                                   | Priority |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| FR-NAV-001   | On mobile, a bottom tab bar has five destinations in this order: Shopping, Expenses, Home (always in the centre), Planner (notes and reminders) and Meals. Profile and settings open from the user's avatar, fixed at the top right of every main screen. On desktop, a left sidebar lists Home, Planner, Meals, Shopping and Expenses, with the profile entry at the bottom. | Must     |
| FR-NAV-002   | Home is the hub: from it every module, the notes and the notifications are one tap away.                                                                                                                                                                                                                                                                                      | Must     |
| FR-NAV-003   | Profile and settings (from the avatar on mobile, the sidebar on desktop) give access to the account, appearance, notifications, privacy, household settings and sign-out.                                                                                                                                                                                                     | Must     |
| FR-NAV-004   | While the app starts and checks the session, a launch screen with the logo is shown for as short a time as possible.                                                                                                                                                                                                                                                          | Must     |
| FR-NOTIF-001 | HØEM is an installable PWA (web app manifest and service worker) from the MVP.                                                                                                                                                                                                                                                                                                | Must     |
| FR-NOTIF-002 | Reminders and household events are delivered as push notifications using the Web Push standard (RFC 8030, with VAPID keys, RFC 8292). Users opt in explicitly and choose which kinds they receive.                                                                                                                                                                            | Must     |
| FR-NOTIF-003 | An in-app notification centre lists recent notifications, so nothing is lost if push is off or blocked.                                                                                                                                                                                                                                                                       | Must     |
| FR-NOTIF-004 | On iPhone and iPad, the app explains that push requires adding HØEM to the home screen first (an iOS 16.4+ restriction).                                                                                                                                                                                                                                                      | Must     |

## 4. Future requirements

These are recorded now so the data model leaves room for them, but they are not built in the MVP. They will be detailed into full requirements before each phase starts.

| ID          | Module        | Requirement                                                                                                                                                                                            | Phase |
| ----------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| FR-SAV-001  | Savings       | Savings goals with target amount, deadline and progress bar.                                                                                                                                           | 2     |
| FR-SUB-001  | Subscriptions | Recurring payments with next charge date, shown on the dashboard 3 days ahead.                                                                                                                         | 2     |
| FR-INT-004  | Integrations  | When every item on the list is checked, the shopping trip is marked complete, saved to the shopping history and the list starts empty.                                                                 | 2     |
| FR-I18N-001 | Platform      | Spanish translation of the full interface.                                                                                                                                                             | 2     |
| FR-CHO-001  | Chores        | Recurring household chores assigned to members, with rotation.                                                                                                                                         | 3     |
| FR-HAB-001  | Habits        | Personal habit tracking with streaks (private to each user).                                                                                                                                           | 3     |
| FR-PWA-001  | Platform      | Offline read access. The installable app and push notifications moved to the MVP (see 3.11).                                                                                                           | 3     |
| FR-AI-001   | Assistant     | Assistant that proposes meals for the week based on the household's habits (past meal plans, most-used recipes, usual slots); the user always confirms.                                                | 3     |
| FR-EXP-009  | Expenses      | A member can add an expense from a photo of a receipt or a screenshot: amount, date, category and merchant name are extracted and shown pre-filled for the member to confirm or correct before saving. | 3     |

A pantry or home-inventory module is explicitly out of scope: keeping it accurate would depend on users recording everything they use, which is unrealistic.

## 5. Non-functional requirements

Each requirement has a measurable criterion so it can be verified, not just intended.

### 5.1 Accessibility (A11Y)

| ID           | Requirement                                                                                                      | Verification                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| NFR-A11Y-001 | The interface MUST conform to WCAG 2.2 level AA in both light and dark themes.                                   | axe-core in CI with zero violations; manual check per release |
| NFR-A11Y-002 | Text contrast MUST be at least 4.5:1 (3:1 for text ≥ 24 px or bold ≥ 18.5 px and for UI components).             | Contrast checked at token level in the design system          |
| NFR-A11Y-003 | Every feature MUST be usable with keyboard only, with a visible focus indicator.                                 | Playwright keyboard-navigation tests                          |
| NFR-A11Y-004 | Icon-only buttons MUST have an accessible name (aria-label) and a tooltip.                                       | axe-core rule button-name                                     |
| NFR-A11Y-005 | Colour MUST NOT be the only way to convey information (module colours are always paired with an icon and label). | Design review                                                 |
| NFR-A11Y-006 | Animations MUST respect prefers-reduced-motion.                                                                  | Manual check with the OS setting enabled                      |

### 5.2 Security (SEC)

| ID          | Requirement                                                                                                                                                                                 | Verification                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| NFR-SEC-001 | A user MUST only read or modify data of households they belong to, and private records only as the household rules in 3.7 allow, enforced on the server and by database row-level security. | Integration tests with two users in different households |
| NFR-SEC-002 | All input MUST be validated on the server with shared schemas.                                                                                                                              | Unit tests per schema                                    |
| NFR-SEC-003 | Passwords MUST be handled by the auth provider; the application never stores them.                                                                                                          | Code review                                              |
| NFR-SEC-004 | All traffic MUST use HTTPS; cookies MUST be HttpOnly, Secure and SameSite=Lax.                                                                                                              | Security headers scan                                    |
| NFR-SEC-005 | Secrets MUST live in environment variables, never in the repository.                                                                                                                        | Secret scanning on GitHub                                |
| NFR-SEC-006 | The application MUST address the OWASP Top 10 risks.                                                                                                                                        | Checklist reviewed before each release                   |

### 5.3 Performance (PERF)

| ID           | Requirement                                                                   | Verification                        |
| ------------ | ----------------------------------------------------------------------------- | ----------------------------------- |
| NFR-PERF-001 | Core Web Vitals on mobile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.              | Lighthouse CI on every pull request |
| NFR-PERF-002 | Lighthouse scores ≥ 90 in Performance, Accessibility, Best Practices and SEO. | Lighthouse CI                       |
| NFR-PERF-003 | Real-time updates reach other members in ≤ 2 s.                               | Manual test with two sessions       |

### 5.4 Usability (UX)

| ID         | Requirement                                                                                        | Verification                    |
| ---------- | -------------------------------------------------------------------------------------------------- | ------------------------------- |
| NFR-UX-001 | The layout MUST work from 360 px to 1920 px without horizontal scrolling.                          | Playwright tests at 3 viewports |
| NFR-UX-002 | Destructive actions MUST ask for confirmation or offer undo for 5 s.                               | Manual test                     |
| NFR-UX-003 | Every list MUST have an empty state explaining what to do next.                                    | Design review                   |
| NFR-UX-004 | All UI MUST be built from the design system components and tokens; no hard-coded colours or sizes. | Lint rule + code review         |

### 5.5 Internationalisation (I18N)

| ID           | Requirement                                                                                   | Verification |
| ------------ | --------------------------------------------------------------------------------------------- | ------------ |
| NFR-I18N-001 | No user-facing text is hard-coded; all strings live in translation files.                     | Lint rule    |
| NFR-I18N-002 | Dates, numbers and currencies are formatted with the Intl API according to the user's locale. | Unit tests   |

### 5.6 Maintainability (MNT)

| ID          | Requirement                                                                          | Verification                       |
| ----------- | ------------------------------------------------------------------------------------ | ---------------------------------- |
| NFR-MNT-001 | TypeScript in strict mode; no use of `any` without justification.                    | tsc + ESLint in CI                 |
| NFR-MNT-002 | Code style enforced by ESLint and Prettier; commits follow Conventional Commits.     | Pre-commit hooks + CI              |
| NFR-MNT-003 | Unit test coverage ≥ 80 % for business logic (services, utilities).                  | Vitest coverage report             |
| NFR-MNT-004 | Each Must user story has at least one end-to-end test.                               | Playwright suite                   |
| NFR-MNT-005 | Significant technical decisions are recorded as Architecture Decision Records (ADR). | /docs/adr folder in the repository |

### 5.7 Legal and privacy (LEG)

| ID          | Requirement                                                                                                                                    | Verification                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| NFR-LEG-001 | Users under 14 can only join through a family household, added by a parent who consents on their behalf (GDPR art. 8; Spanish LOPDGDD art. 7). | Sign-up flow test with a minor's birth date |
| NFR-LEG-002 | The privacy policy explains in plain language who can see each type of data in each household type.                                            | Legal review before launch                  |
| NFR-LEG-003 | Users can export and delete their personal data (GDPR arts. 17 and 20).                                                                        | E2E test of export and deletion             |

## 6. Conceptual data model

Every record belongs to a household, never directly to a user. Using HØEM alone is simply a household of one, so sharing later only means adding a membership.

&#91;embedded content: conceptual data model · MVP entities\]

Model rules:

- Every household-scoped table has a non-null `household_id` foreign key and a row-level security policy that checks membership.
- Each household has a `type`: single person, family, shared flat or other.
- A membership has a `role` (owner or member) and, in family households, a `family_role` (parent, child or relative).
- Expenses, shopping lists, meal plan entries and notes have a `visibility` (shared or private) and a `created_by`.
- Each private expense stores whether parents can see it, fixed when it is created. This is how FR-HH-007 is guaranteed: changing the household type never rewrites past records.
- A household always has at least one owner; the last owner cannot leave without transferring ownership.
- Deleting a household deletes its data (cascade); deleting a user removes their memberships and their private records.
- Money is stored as integer cents to avoid floating-point rounding errors.
- Later entities (savings goal, subscription, shopping trip, chore) follow the same rule; habits also store `user_id` because they are private to each person.

## 7. Technology stack and architecture

HØEM is a full-stack TypeScript application built with Next.js on top of Supabase. Each choice below will get its own ADR in the repository.

### 7.1 Stack

| Layer              | Technology                                    | Reason                                                                           |
| ------------------ | --------------------------------------------- | -------------------------------------------------------------------------------- |
| Language           | TypeScript (strict)                           | One typed language across client and server                                      |
| Framework          | Next.js (App Router) + React                  | Server rendering, routing and server actions in one project                      |
| Database           | PostgreSQL (Supabase)                         | Relational model fits households, members and shared data                        |
| Auth               | Supabase Auth                                 | Email, Google OAuth and integration with row-level security                      |
| Real time          | Supabase Realtime                             | Live updates of the shared shopping list (FR-SHOP-003)                           |
| File storage       | Supabase Storage                              | Recipe photos and avatars                                                        |
| ORM and migrations | Drizzle ORM                                   | SQL-first, type-safe, versioned migrations, RLS policies defined with the schema |
| Validation         | Zod                                           | Same schemas on client forms and server actions                                  |
| UI primitives      | Radix UI (via shadcn/ui)                      | Accessible, unstyled components themed by our tokens                             |
| Styling            | Tailwind CSS + CSS custom properties          | Design tokens as variables; light and dark themes                                |
| Motion             | Framer Motion                                 | Transitions that respect reduced-motion                                          |
| i18n               | next-intl                                     | Externalised strings, locale formatting                                          |
| Design system docs | Storybook                                     | Visual catalogue and accessibility checks per component                          |
| Testing            | Vitest, Testing Library, Playwright, axe-core | Unit, component, end-to-end and accessibility tests                              |
| Quality            | ESLint, Prettier, Husky, commitlint           | Consistent style and Conventional Commits                                        |
| CI/CD              | GitHub Actions + Vercel                       | Checks on every pull request; preview deploy per branch                          |

### 7.2 Architecture

The code is organised by feature (accounts, meals, shopping, expenses), and inside each feature by layer. Dependencies only point downwards:

1. **Presentation** — Next.js routes and React components. No business rules; it calls the application layer.
2. **Application** — services and server actions that implement the use cases (e.g. generate shopping list from plan). They check household membership and validate input with Zod.
3. **Domain** — pure TypeScript types and functions (e.g. merging ingredient quantities). No framework imports, so they are trivial to unit-test.
4. **Data access** — repositories built on Drizzle. Every query is scoped by household ID.

Row-level security in PostgreSQL is the second line of defence: even a bug in the application layer cannot expose another household's data, and Realtime subscriptions from the browser are filtered by the same policies.

### 7.3 Environments

| Environment | Purpose                          | Hosting                                            |
| ----------- | -------------------------------- | -------------------------------------------------- |
| Local       | Development                      | Next.js dev server + Supabase CLI (local Postgres) |
| Preview     | One per pull request, for review | Vercel preview + Supabase staging project          |
| Production  | Public portfolio demo            | Vercel + Supabase production project               |

## 8. Release roadmap and glossary

The project is portfolio-ready at Gate B: everything after it adds value but is optional. Each phase only starts when the previous gate's criteria are met.

&#91;embedded content: release roadmap · 4 phases, 3 gates\]

### Glossary

| Term            | Meaning                                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Household       | The shared space that owns all data; a user can belong to several.                                                          |
| Household type  | Single person, family, shared flat or other; it sets sensible defaults.                                                     |
| Member          | A user who belongs to a household, with the role owner or member.                                                           |
| Meal slot       | One of the five daily meals (breakfast, morning snack, lunch, afternoon snack, dinner) on a given day, e.g. Tuesday dinner. |
| Shared expense  | An expense visible to every member and counted in household totals.                                                         |
| Private expense | An expense visible only to the member who recorded it.                                                                      |
| Design token    | A named design value (colour, spacing, radius) used instead of hard-coded values.                                           |
| RLS             | Row-level security: database policies that limit which rows each user can access.                                           |
| MVP             | Minimum viable product: the smallest version that delivers the core value.                                                  |
| ADR             | Architecture Decision Record: a short document explaining a technical decision and its alternatives.                        |
| E2E test        | End-to-end test that drives the real application in a browser.                                                              |
