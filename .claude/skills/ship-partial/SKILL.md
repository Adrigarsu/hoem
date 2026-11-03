---
name: ship-partial
description: Finish one pull request of an issue split across several - verify it, commit it and mark it ready without closing the issue. Use when the developer says a part of an issue is ready to ship.
disable-model-invocation: true
allowed-tools: Bash(pnpm check) Bash(pnpm db:reset) Bash(pnpm db:test) Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git fetch origin) Bash(git merge origin/main) Bash(gh pr view *) Bash(gh pr list *) Bash(gh issue view *)
---

## Branch

!`git status --short --branch`

## Commits not yet in main

!`git log --oneline main..HEAD`

## Pull request

!`gh pr view --json number,title,body,isDraft,url`

## Steps

For the last part of an issue, the one that completes it, use `/ship` instead: it closes the issue.

1. If the current branch is `main`, or it has no pull request, or the body has no `Part of #<issue>`
   line, stop and tell me: the part starts with `/start-partial`.
2. Run `git fetch origin` and `git merge origin/main` (never rebase). If there are conflicts, stop
   and show them to me.
3. Run `pnpm check`. If this part touches `supabase/`, also run `pnpm db:reset` (local database only)
   and `pnpm db:test`. If anything fails, fix the cause and run it again. Do not continue until it
   all passes.
4. Check that this part can reach production alone, because Vercel deploys it as soon as it merges:
   - A migration is backward compatible and merges before the code that uses it (ADR-014).
   - Users never see half a feature.
   - It contains nothing from the other parts.

   If one of these fails, stop and ask.

5. Go through the Definition of done in `AGENTS.md` for what this part touches: tests, `pnpm check`,
   its docs and ADRs, and instruction files. The issue's acceptance criteria as a whole wait for
   `/ship`. List what is left for the later parts. If the part touches the UI, the collages from
   `pnpm app:capture` are required: take them if they are missing or out of date, and compare them
   with the screen in `docs/design-system/screens/`. **Keep the issue's row in `docs/planning.md`.**
6. Commit this part's changes with Conventional Commits that include the requirement ID, staging
   files by name. If there is a change that does not belong to this part, stop and ask. Never use
   `--no-verify`. No AI attribution in commits or the pull request (no `Co-Authored-By: Claude`, no
   "Generated with Claude Code"): the developer is the only author.
7. Push the branch. Update the pull request with `gh pr edit`, writing the body to a scratchpad file
   and passing it with `--body-file`, and mark it ready with `gh pr ready`. Follow
   `.github/pull_request_template.md`, with `Part of #<issue>` in place of `Closes #`. Never write
   `Closes`, `Fixes` or `Resolves` next to the issue number. Say what this part leaves out.
8. Reply with:
   - The pull request link, the collage files for me to drag in if any, and a reminder to read the
     diff before squash-merging. **Never merge the pull request yourself.**
   - Every part of the issue with its state, from
     `gh pr list --state all --search '"Part of #<issue>" in:body'`, and what is still to do.
   - What to run after merging, to carry on from the issue's branch:
     `git switch <branch>`, `git fetch origin`, `git merge origin/main`.
   - Anything to check once it is deployed, such as a migration on staging.

   Do not recommend the next issue: this one is still open. If I may clear the session, name the plan
   file that holds the remaining work.
