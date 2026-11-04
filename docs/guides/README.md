# Guides

Step-by-step instructions for doing things in this repository: setting it up, deploying, writing a
migration, testing. They say _how_; the reasons live in `docs/architecture.md` and `docs/adr/`.

| Guide                                | How to…                                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| [`local-setup.md`](local-setup.md)   | Run the app and its Supabase locally, and the end-to-end tests |
| [`workflow.md`](workflow.md)         | Take an issue from the queue to production                     |
| [`migrations.md`](migrations.md)     | Change the database without breaking the deployed app          |
| [`testing.md`](testing.md)           | Write tests that pass in jsdom and in every browser            |
| [`screenshots.md`](screenshots.md)   | Capture pages and reference screens for a pull request         |
| [`deployment.md`](deployment.md)     | Understand where the app runs and how a change reaches it      |
| [`dependencies.md`](dependencies.md) | Add a dependency and handle Dependabot pull requests           |

A guide changes in the same pull request as the commands or steps it describes (Definition of
done, item 4). `release.md` comes with the release process (`docs/roadmap.md`).
