---
name: ship
description: Finish the current task - verify it, commit and open a pull request. Use when the developer says the work is ready to ship.
disable-model-invocation: true
allowed-tools: Bash(pnpm check) Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git fetch origin) Bash(git merge origin/main) Bash(gh pr view *) Bash(gh pr list *)
---

## Branch

!`git status --short --branch`

## Commits not yet in main

!`git log --oneline main..HEAD`

## Steps

For an earlier part of an issue split across pull requests, use `/ship-partial` instead: this skill
closes the issue. The whole process is in `docs/guides/workflow.md`.

1. If the current branch is `main`, stop: work must happen on a branch.
2. Run `git fetch origin` and `git merge origin/main` (never rebase). If there are conflicts,
   stop and show them to me.
3. Run the `code-review` skill on the branch and fix what it finds (`CLAUDE.md`). If a finding is
   a judgement call, ask me.
4. Run `pnpm check`. If the branch touches `supabase/`, also run `pnpm db:reset` (local database
   only) and `pnpm db:test`. If anything fails, fix the cause and run it again. Do not continue
   until it all passes.
5. Go through the Definition of done in `AGENTS.md` and list anything that is not met.
   If something important is missing, stop and ask. If the issue touched the UI, the collages
   from `pnpm app:capture` are required (`docs/guides/screenshots.md`): take them if they are
   missing or out of date, and compare them with the screen in `docs/design-system/screens/`.
6. Update the documentation (Definition of done, items 4 and 6), keeping additions short and
   removing what is now outdated:
   - `docs/features/<feature>.md` for every feature the issue touched, and the guides in
     `docs/guides/` whose commands or steps changed.
   - `docs/architecture.md`, and an ADR (`/adr`) if a decision changed. A new ADR stays Proposed;
     I change it to Accepted when the pull request merges.
   - `docs/milestones/` if the issue changes an issue still to create in a later milestone.
   - `AGENTS.md` or a skill for anything the next cleared session needs.
   - Remove the shipped issue's row from `docs/planning.md`.
7. Commit any remaining changes with Conventional Commits that include the requirement ID,
   staging files by name. Never use `--no-verify`. No AI attribution in commits or the PR (no
   `Co-Authored-By: Claude`, no "Generated with Claude Code"): the developer is the only author.
8. Push the branch. If `gh pr view` finds a draft pull request for it, update its title and body
   with `gh pr edit`, writing the body to a scratchpad file and passing it with `--body-file`, and
   mark it ready with `gh pr ready`; otherwise open one with `gh pr create`. Follow
   `.github/pull_request_template.md`, with `Closes #<issue>`. If the issue was split, also list
   its earlier parts, from `gh pr list --state all --search '"Part of #<issue>" in:body'`.
9. Reply with the PR link, list the collage files in `screenshots/` so I can drag them into the
   PR, and remind me to read the diff before squash-merging.
   **Never merge the pull request yourself.** Recommend the next issue from `docs/planning.md` and
   why, or give options if no single one is clearly best. If the milestone is close to done, remind
   me to create the next one's issues from `docs/milestones/`. Then tell me the session can be
   cleared (`/clear`).
