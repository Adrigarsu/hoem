# Dependencies

How to add a dependency and how to handle Dependabot's pull requests.

## Adding one

- Only when the task needs it, with pnpm (`pnpm add`, `pnpm add -D`); never edit `pnpm-lock.yaml`
  by hand.
- Prefer a version published at least a week ago: a release that was just published is more likely
  to be withdrawn or compromised.
- Say in the pull request why it was added.

## Dependabot

`.github/dependabot.yml` opens two kinds of pull requests every week:

| Kind                         | What it is                                                       | What to do                                                                                        |
| ---------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `minor-and-patch` group      | All minor and patch updates of npm packages, in one pull request | Wait for CI, skim the changelogs of runtime packages, squash-merge                                |
| A major update               | One package, one pull request                                    | Read its migration guide; if it needs code changes, close it and open an issue                    |
| Security update              | A vulnerable package, often a transitive one                     | Merge it first, the same week. If CI is old, comment `@dependabot rebase` and wait for it to pass |
| GitHub Actions (`chore(ci)`) | New versions of the actions in `.github/workflows/`              | Wait for CI and squash-merge                                                                      |

- **Never edit a Dependabot branch:** it stops rebasing it. Comment `@dependabot rebase` (or
  `recreate`) instead.
- **Close instead of merging** only when an update breaks something that needs work: comment
  `@dependabot ignore this minor version` (or major) and open an issue for the upgrade.
- Before merging an update whose CI ran days ago, bring it up to date with `@dependabot rebase`,
  because `main` may have changed under it.
