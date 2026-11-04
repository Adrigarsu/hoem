# Guides

Step-by-step instructions for doing things in this repository: setting it up, deploying, writing a
migration, testing. They say _how_; the reasons live in `docs/architecture.md` and `docs/adr/`.

> **Proposed structure.** Nothing has been moved here yet: the table below is the plan being
> agreed with the developer.

| Guide             | Status   | Comes from                                                                                                |
| ----------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `local-setup.md`  | Proposed | `README.md` "Getting started" (the README keeps a five-line quick start and links here)                   |
| `deployment.md`   | Proposed | `README.md` "Deployment" and the "Domain and e-mail" paragraph of `architecture.md` §9.1                  |
| `migrations.md`   | Proposed | `.claude/rules/database.md` (how to regenerate a migration when `main` has a newer one) and ADR-014 steps |
| `testing.md`      | Proposed | `AGENTS.md` "Testing" gotchas (route announcer, `<Activity>`, `getByLabel`, Safari) and E2E how-to        |
| `screenshots.md`  | Proposed | `AGENTS.md` "Screenshots for every UI change" (`pnpm app:capture`, `pnpm screens:capture`)                |
| `workflow.md`     | Proposed | New: the life of an issue for a human (start, partial pull requests, ship), which the skills automate     |
| `dependencies.md` | Proposed | New: how to handle Dependabot pull requests and security alerts                                           |
| `release.md`      | Proposed | New, for M7: changelog, version tags, what to check after a deploy                                        |
