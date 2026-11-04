# M7 MVP release v1.0.0

Everything Gate B asks for before tagging `v1.0.0` (`docs/roadmap.md`): accessibility,
performance, security, legal pages, observability and the release itself. Tracking issue: #40.
Create these issues when M6 is close to done. Instructions and conventions: `README.md` in this
folder.

#54 (Auth e-mails into the Outlook inbox) already exists in this milestone; the release issue
waits for it.

| Variable       | Issue                                                | Priority | Blocked by       |
| -------------- | ---------------------------------------------------- | -------- | ---------------- |
| `$REL_PROCESS` | chore: changelog and version tags                    | should   | —                |
| `$REL_A11Y`    | chore: accessibility audit of every screen           | must     | —                |
| `$REL_PERF`    | ci: Lighthouse CI on every preview                   | must     | —                |
| `$REL_SEC`     | chore: security review against the OWASP Top 10      | must     | —                |
| `$REL_SCAN`    | ci: secret scanning and dependency audit             | must     | —                |
| `$REL_OBS`     | chore: error tracking, structured logs and analytics | must     | —                |
| `$REL_EMPTY`   | chore: every list has an empty state                 | must     | —                |
| `$REL_E2E`     | chore: every Must story has an end-to-end test       | must     | —                |
| `$REL_LEGAL`   | NFR-LEG-002: privacy policy and terms                | must     | —                |
| `$REL_EXPORT`  | NFR-LEG-003: download my data                        | must     | —                |
| `$REL_DOCS`    | docs: M7 documentation review                        | must     | all of the above |
| `$REL_GATE`    | chore: release v1.0.0                                | must     | `$REL_DOCS`, #54 |

The release issue is the only one that goes after the documentation review: it checks Gate B,
which includes that review, and tags the version.

## Setup

```bash
REPO=Adrigarsu/hoem
MILESTONE="M7 MVP release v1.0.0"
BODY=$(mktemp)
add_blocks() {
  gh issue view "$1" --repo "$REPO" --json body -q .body > "$BODY"
  printf 'Blocks: %s\n' "$2" >> "$BODY"
  gh issue edit "$1" --repo "$REPO" --body-file "$BODY" > /dev/null && echo "#$1 blocks $2"
}
```

## 1. chore: changelog and version tags

```bash
cat > "$BODY" <<'MD'
### Kind of work

CI

### Description

There is no changelog and no version tag yet. Conventional Commits already describe every change,
so a tool can turn them into a `CHANGELOG.md`, bump `package.json` with Semantic Versioning and tag
each release. Recommended: release-please (a GitHub Action that keeps a "release" pull request open;
merging it tags the version and publishes the GitHub Release). The developer still decides when to
release, and nothing merges by itself.

### Done when

- [ ] The tool is chosen and recorded in an ADR (release-please, or manual tags with generated
      release notes)
- [ ] Merging into `main` updates the release pull request with the new entries
- [ ] Its commit and pull request pass commitlint and carry no AI attribution
- [ ] `docs/guides/release.md`: how to cut a release and what to check after it

### Related requirement IDs

NFR-MNT-002

### Notes

Squash-merging makes each pull request title the commit on `main`, so titles must stay valid
Conventional Commits (they already are). Versions stay `0.x` until Gate B.
MD
printf '\nBlocked by: —\n' >> "$BODY"
REL_PROCESS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "chore: generate the changelog and tag releases from Conventional Commits" \
  --label "type:chore,area:platform,priority:should" \
  --body-file "$BODY") && echo "$REL_PROCESS" && REL_PROCESS=${REL_PROCESS##*/}
```

## 2. chore: accessibility audit of every screen

```bash
cat > "$BODY" <<'MD'
### Kind of work

Test

### Description

axe-core runs on every page in E2E, but automatic checks find only part of the WCAG failures.
Before v1.0.0, every screen gets a manual pass with the keyboard and a screen reader, in both
themes and at 360, 768 and 1440 px.

### Done when

- [ ] Every screen in `docs/design-system/screens/README.md` checked with keyboard only: order,
      visible focus, no traps, skip link (NFR-A11Y-003)
- [ ] Checked with VoiceOver (Safari) and NVDA or TalkBack: names, roles, live regions, headings
- [ ] Colour is never the only signal: module colours, budget warnings, unread notifications
      (NFR-A11Y-005)
- [ ] 200 % zoom and 320 px reflow without loss of content; reduced motion respected
- [ ] Every failure found has an issue, and the `priority:must` ones are fixed
- [ ] The results are recorded in `docs/accessibility.md` (an accessibility statement)

### Related requirement IDs

NFR-A11Y-001, NFR-A11Y-003, NFR-A11Y-005

### Notes

Use the `accessibility` label for every issue this audit opens.
MD
printf '\nBlocked by: —\n' >> "$BODY"
REL_A11Y=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "chore: manual accessibility audit of every screen (WCAG 2.2 AA)" \
  --label "type:chore,area:platform,accessibility,priority:must" \
  --body-file "$BODY") && echo "$REL_A11Y" && REL_A11Y=${REL_A11Y##*/}
```

## 3. ci: Lighthouse CI on every preview

```bash
cat > "$BODY" <<'MD'
### Kind of work

CI

### Description

`docs/architecture.md` §9.2 (row 6) plans Lighthouse CI on the preview URL of every pull request.
It proves the performance requirements before the release and keeps them afterwards.

### Done when

- [ ] Lighthouse CI runs on the Vercel preview of every pull request, on mobile settings, for Home,
      Shopping, Meals, Expenses, Planner and Sign in
- [ ] It fails below 90 in Performance, Accessibility, Best Practices or SEO (NFR-PERF-002)
- [ ] LCP ≤ 2.5 s, INP ≤ 200 ms (or TBT as its lab proxy) and CLS ≤ 0.1 are asserted (NFR-PERF-001)
- [ ] Pages behind sign-in are measured with a test account on staging, never production data
- [ ] Every page passes, or has an issue to fix it before Gate B

### Related requirement IDs

NFR-PERF-001, NFR-PERF-002

### Notes

Previews are protected by Vercel Authentication: the job needs a bypass token, stored as a GitHub
secret.
MD
printf '\nBlocked by: —\n' >> "$BODY"
REL_PERF=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "ci: Lighthouse CI on every preview, failing below 90" \
  --label "type:chore,area:platform,priority:must" \
  --body-file "$BODY") && echo "$REL_PERF" && REL_PERF=${REL_PERF##*/}
```

## 4. chore: security review against the OWASP Top 10

```bash
cat > "$BODY" <<'MD'
### Kind of work

Chore

### Description

NFR-SEC-006 asks for a checklist reviewed before each release. This issue writes that checklist
(OWASP Top 10, with the matching OWASP ASVS level 1 checks) and goes through it once for v1.0.0.

### Done when

- [ ] `docs/security-checklist.md` lists each OWASP Top 10 risk, how HØEM addresses it and how it is
      verified
- [ ] Security headers on every response: HSTS, Content-Security-Policy, X-Content-Type-Options,
      Referrer-Policy, Permissions-Policy; a headers scan passes (NFR-SEC-004)
- [ ] Cookies are HttpOnly, Secure and SameSite=Lax (NFR-SEC-004, ADR-016)
- [ ] Every REST write route is rate-limited (#99) and every route parses its input (NFR-SEC-002)
- [ ] No request uses the service-role key; RLS is enabled on every table (a pgTAP test lists them)
- [ ] Every finding has an issue, and the high ones are fixed

### Related requirement IDs

NFR-SEC-004, NFR-SEC-006

### Notes

Repeat the checklist before every later release (`docs/guides/release.md`).
MD
printf '\nBlocked by: —\n' >> "$BODY"
REL_SEC=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "chore: security review against the OWASP Top 10 and security headers" \
  --label "type:chore,area:platform,priority:must" \
  --body-file "$BODY") && echo "$REL_SEC" && REL_SEC=${REL_SEC##*/}
```

## 5. ci: secret scanning and dependency audit

```bash
cat > "$BODY" <<'MD'
### Kind of work

CI

### Description

`docs/architecture.md` §9.2 (row 7) plans a job that fails when a secret is committed or a
dependency has a high-severity vulnerability. GitHub's own secret scanning and Dependabot alerts
cover part of it; this issue turns them on and adds what is missing to CI.

### Done when

- [ ] GitHub secret scanning and push protection are on for the repository (NFR-SEC-005)
- [ ] Dependabot alerts are on, and CI runs `pnpm audit --audit-level high` on every pull request
- [ ] A known false positive can be ignored with a written reason
- [ ] `docs/guides/dependencies.md` says what to do when the audit fails

### Related requirement IDs

NFR-SEC-005, NFR-SEC-006

### Notes

Push protection blocks a push that contains a secret before it reaches GitHub, which is safer than
finding it afterwards.
MD
printf '\nBlocked by: —\n' >> "$BODY"
REL_SCAN=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "ci: secret scanning and dependency audit" \
  --label "type:chore,area:platform,priority:must" \
  --body-file "$BODY") && echo "$REL_SCAN" && REL_SCAN=${REL_SCAN##*/}
```

## 6. chore: error tracking, structured logs and analytics

```bash
cat > "$BODY" <<'MD'
### Kind of work

Chore

### Description

`docs/architecture.md` §9.3 plans Sentry, structured logs and Vercel Analytics; none is installed.
With real users after v1.0.0, errors must be visible without any personal data in them.

### Done when

- [ ] Errors from the browser and the server reach Sentry (or an alternative chosen in an ADR), with
      the request ID and no personal data: no e-mails, names, note text or amounts
- [ ] Server logs are structured JSON, one line per request, with user and household IDs only
- [ ] Vercel Analytics records Core Web Vitals from real visits
- [ ] The free tiers cover the expected use (zero running cost, `docs/architecture.md` §1.2)
- [ ] `docs/architecture.md` §9.3 describes what is installed, no longer what is planned

### Related requirement IDs

NFR-PERF-001

### Notes

The privacy policy (NFR-LEG-002) must name these services if they process personal data.
MD
printf '\nBlocked by: —\n' >> "$BODY"
REL_OBS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "chore: error tracking, structured logs and analytics" \
  --label "type:chore,area:platform,priority:must" \
  --body-file "$BODY") && echo "$REL_OBS" && REL_OBS=${REL_OBS##*/}
```

## 7. chore: every list has an empty state

```bash
cat > "$BODY" <<'MD'
### Kind of work

Test

### Description

NFR-UX-003 asks that every list explains what to do when it is empty. Each story added its own;
this issue checks them all together, with a fresh account.

### Done when

- [ ] With a new account and an empty household, every list and module shows an empty state with
      the next step: shopping, recipes, meal plan, expenses, budgets, balances, notes,
      notifications, members, activity feed
- [ ] Filters with no results say so and offer to clear them
- [ ] Each empty state has a component test, and one E2E walks through them

### Related requirement IDs

NFR-UX-003

### Notes

The empty states drawn in `docs/design-system/screens/` are the reference.
MD
printf '\nBlocked by: —\n' >> "$BODY"
REL_EMPTY=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "chore: check that every list has an empty state" \
  --label "type:chore,area:platform,priority:must" \
  --body-file "$BODY") && echo "$REL_EMPTY" && REL_EMPTY=${REL_EMPTY##*/}
```

## 8. chore: every Must story has an end-to-end test

```bash
cat > "$BODY" <<'MD'
### Kind of work

Test

### Description

NFR-MNT-004 asks for at least one E2E test per Must user story. A search for each requirement ID
in `tests/e2e/` shows the gaps.

### Done when

- [ ] A table in `docs/guides/testing.md` maps every Must requirement and user story of SRS §3 to
      the spec that proves it
- [ ] Every gap is closed with a test named with its ID
- [ ] The suite passes in Chromium, Chrome and Safari at 360, 768 and 1440 px

### Related requirement IDs

NFR-MNT-004

### Notes

A short script that lists the IDs of SRS §3 with no match in `tests/e2e/` keeps the table honest.
MD
printf '\nBlocked by: —\n' >> "$BODY"
REL_E2E=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "chore: check that every Must user story has an end-to-end test" \
  --label "type:chore,area:platform,priority:must" \
  --body-file "$BODY") && echo "$REL_E2E" && REL_E2E=${REL_E2E##*/}
```

## 9. NFR-LEG-002: privacy policy and terms

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

NFR-LEG-002, NFR-LEG-001

### User story

As someone deciding whether to use HØEM with my family or flatmates
I want a privacy policy in plain language
so that I know who can see each kind of data in each type of household.

### Acceptance criteria

```gherkin
Feature: Legal pages

  Scenario: Who sees what (NFR-LEG-002)
    When I open the privacy policy
    Then a table explains, for each household type, who can see shared and private expenses, lists, plans and notes

  Scenario: Always reachable
    Then the privacy policy and the terms are linked from sign-up, sign-in and settings, without signing in

  Scenario: Minors (NFR-LEG-001)
    Then the policy explains that under-14s join only through a family, with a parent's consent

  Scenario: Processors
    Then it names Supabase, Vercel, Resend and every analytics or error-tracking service, and where they store data
```

### Priority (MoSCoW)

Must

### Area

Platform

### Notes

- There is no screen design for these pages yet: ask for one before building (AGENTS.md).
- The texts live in `messages/en.json` like every other text. A legal review before launch is the
  verification method of NFR-LEG-002.
MD
printf '\nBlocked by: —\n' >> "$BODY"
REL_LEGAL=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "NFR-LEG-002: privacy policy and terms in plain language" \
  --label "type:feature,area:platform,priority:must" \
  --body-file "$BODY") && echo "$REL_LEGAL" && REL_LEGAL=${REL_LEGAL##*/}
````

## 10. NFR-LEG-003: download my data

````bash
cat > "$BODY" <<'MD'
### Requirement IDs

NFR-LEG-003

### User story

As a user
I want to download my personal data
so that I can keep it or take it elsewhere (GDPR art. 20).

### Acceptance criteria

```gherkin
Feature: Download my data

  Scenario: Export (NFR-LEG-003)
    Given I open Settings > Download my data
    When I choose "Download"
    Then I get a JSON file with my profile, my memberships, my private records and the shared records I created

  Scenario: Only what is mine (NFR-SEC-001)
    Then the file never contains another member's private records or personal data

  Scenario: Photos
    Then my avatar and recipe photos I uploaded are included or linked
```

### Priority (MoSCoW)

Must

### Area

Platform

### Notes

Replaces the "Coming soon" page at `/settings/download-data` (`docs/features/settings.md`). Account
deletion, the other half of NFR-LEG-003, exists (#23). The export runs with the user's own JWT,
so RLS decides what goes in.
MD
printf '\nBlocked by: —\n' >> "$BODY"
REL_EXPORT=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "NFR-LEG-003: download my personal data" \
  --label "type:feature,area:platform,priority:must" \
  --body-file "$BODY") && echo "$REL_EXPORT" && REL_EXPORT=${REL_EXPORT##*/}
````

## 11. docs: M7 documentation review

```bash
cat > "$BODY" <<'MD'
### Documents affected

README.md, docs/README.md, docs/srs.md, docs/architecture.md, docs/adr/README.md, docs/features/*.md, docs/guides/*.md, docs/roadmap.md, docs/planning.md

### Description

The last review before v1.0.0: the whole of `docs/` matches the code a recruiter or a new developer
will read, and the SRS and architecture leave "draft".

### Done when

- [ ] `docs/srs.md` and `docs/architecture.md` move from "Version 0.1 (draft)" to 1.0, with what
      changed since the draft
- [ ] Every feature has its page in `docs/features/`, and every guide matches the commands
- [ ] Every ADR is Accepted, Superseded or Deprecated: none stays Proposed
- [ ] `README.md` describes the released product, with the demo link
- [ ] `docs/roadmap.md`: Gate B criteria checked one by one; phase 2 milestones sketched
- [ ] Every link in `docs/` resolves

### Related requirement IDs

NFR-MNT-005

### Notes

The release issue goes after this one and checks Gate B, which includes it.
MD
printf '\nBlocked by: #%s, #%s, #%s, #%s, #%s, #%s, #%s, #%s, #%s, #%s\n' "$REL_PROCESS" "$REL_A11Y" "$REL_PERF" "$REL_SEC" "$REL_SCAN" "$REL_OBS" "$REL_EMPTY" "$REL_E2E" "$REL_LEGAL" "$REL_EXPORT" >> "$BODY"
REL_DOCS=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "docs: M7 documentation review" \
  --label "type:docs,area:platform,priority:must" \
  --body-file "$BODY") && echo "$REL_DOCS" && REL_DOCS=${REL_DOCS##*/}
```

## 12. chore: release v1.0.0

```bash
cat > "$BODY" <<'MD'
### Kind of work

Chore

### Description

Check Gate B (`docs/roadmap.md`) criterion by criterion, then tag `v1.0.0`. After this, HØEM is
portfolio-ready and phase 2 can start.

### Done when

- [ ] Every Gate B criterion in `docs/roadmap.md` is checked, with a link to its proof
- [ ] NFR-MNT-001 still holds: TypeScript strict, no `any` without a reason
- [ ] NFR-MNT-002 still holds: ESLint, Prettier and Conventional Commits enforced
- [ ] `Should` requirements left out are listed in the release notes
- [ ] `v1.0.0` is tagged and its GitHub Release published, with the changelog
- [ ] The tracking issue #40 and the M7 milestone are closed

### Related requirement IDs

NFR-MNT-001, NFR-MNT-002

### Notes

The only issue that goes after its milestone's documentation review, because it checks that review
too.
MD
printf '\nBlocked by: #%s, #54\n' "$REL_DOCS" >> "$BODY"
REL_GATE=$(gh issue create --repo "$REPO" --milestone "$MILESTONE" \
  --title "chore: release v1.0.0 (Gate B)" \
  --label "type:chore,area:platform,priority:must" \
  --body-file "$BODY") && echo "$REL_GATE" && REL_GATE=${REL_GATE##*/}
```

## Blocks

#54 already has its own `Blocks:` line; the comment below records that the release waits for it.

```bash
for n in "$REL_PROCESS" "$REL_A11Y" "$REL_PERF" "$REL_SEC" "$REL_SCAN" "$REL_OBS" "$REL_EMPTY" "$REL_E2E" "$REL_LEGAL" "$REL_EXPORT"; do
  add_blocks "$n" "#$REL_DOCS"
done
add_blocks "$REL_DOCS" "#$REL_GATE"
add_blocks "$REL_GATE" "—"
gh issue comment 54 --repo "$REPO" --body "The release issue #$REL_GATE waits for this one."
```

## Tracking issue

```bash
gh issue comment 40 --repo "$REPO" --body "Split into: #$REL_PROCESS, #$REL_A11Y, #$REL_PERF, #$REL_SEC, #$REL_SCAN, #$REL_OBS, #$REL_EMPTY, #$REL_E2E, #$REL_LEGAL, #$REL_EXPORT, #$REL_DOCS and #$REL_GATE (with #54)."
```

Then ask Claude Code: "add the M7 issues to the planning".
