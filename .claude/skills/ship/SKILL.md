---
name: ship
description: Finish the current task - verify it, commit and open a pull request. Use when the developer says the work is ready to ship.
disable-model-invocation: true
allowed-tools: Bash(pnpm check) Bash(git status *) Bash(git diff *) Bash(git log *) Bash(git fetch origin) Bash(git merge origin/main) Bash(gh pr view *)
---

## Branch

!`git status --short --branch`

## Commits not yet in main

!`git log --oneline main..HEAD`

## Steps

1. If the current branch is `main`, stop: work must happen on a branch.
2. Run `git fetch origin` and `git merge origin/main` (never rebase). If there are conflicts,
   stop and show them to me.
3. Run `pnpm check`. If it fails, fix the cause and run it again. Do not continue until it passes.
4. Go through the Definition of done in `AGENTS.md` and list anything that is not met.
   If something important is missing, stop and ask.
5. Update the instruction files (Definition of done, item 6): add to `AGENTS.md`, `docs/` or a
   skill whatever this issue taught that the next cleared session needs, and remove what is now
   outdated. Keep the additions short.
6. Commit any remaining changes with Conventional Commits that include the requirement ID.
   Never use `--no-verify`.
7. Push the branch. If `gh pr view` finds a draft pull request for it, update its title and body
   with `gh pr edit` and mark it ready with `gh pr ready`; otherwise open one with `gh pr create`. Follow
   `.github/pull_request_template.md` if it exists; otherwise include: summary, requirement IDs,
   `Closes #<issue>`, how it was tested, screenshots needed for UI changes, and what is out of scope.
8. Reply with the PR link and remind me to read the diff before squash-merging.
   **Never merge the pull request yourself.** Then tell me the session can be cleared (`/clear`).
