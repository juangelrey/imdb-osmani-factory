# Reelbase

Specs, plans and tasks live in GitHub Issues, not files. In the skills, the spec is the open `prd`
issue, the plan is the open `plan` issue, and a task is an issue labeled `ticket`. Follow the spec's boundaries.

## Issue tracker

GitHub Issues on `juangelrey/reelbase` is the tracker. Do not create `SPEC.md`,
`tasks/plan.md` or `tasks/todo.md`.

- One issue labeled `ticket` per task. Acceptance criteria and verification steps go in the body, and links go in
  as "Part of #N" and "Blocked by #N".
- The plan issue's task list is an ordered index of ticket numbers.
- A task is done when its issue is closed. PRs use `Closes #N`.

## Agent skills

`.claude/` holds a copy of the `agent-skills` skills so they work in cloud sessions, where plugins
do not load. Commands: `/as-spec`, `/as-plan`, `/as-build`, `/as-test`, `/as-review`.

## Cloud sessions

`gh issue` and `gh pr` fail in cloud sessions because the GitHub proxy blocks GraphQL. Use the
built-in GitHub tools, or REST through `gh api repos/juangelrey/reelbase/...`.
