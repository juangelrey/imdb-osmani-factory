# Reelbase

The spec is `SPEC.md`. Follow its boundaries.

## Issue tracker

GitHub Issues on `juangelrey/imdb-osmani-factory` is the task list target. Do not create
`tasks/todo.md`.

- One issue per task. Acceptance criteria and verification steps go in the body, and dependencies
  go in as "Blocked by #N".
- `tasks/plan.md` stays a file. Its task list is an ordered index of issue links, not a checklist.
- A task is done when its issue is closed. PRs use `Closes #N`.

## Agent skills

`.claude/` holds a copy of the `agent-skills` skills so they work in cloud sessions, where plugins
do not load. Commands: `/as-spec`, `/as-plan`, `/as-build`, `/as-test`, `/as-review`.

## Cloud sessions

`gh issue` and `gh pr` fail in cloud sessions because the GitHub proxy blocks GraphQL. Use the
built-in GitHub tools, or REST through `gh api repos/juangelrey/imdb-osmani-factory/...`.
