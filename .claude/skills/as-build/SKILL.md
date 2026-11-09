---
name: as-build
description: 'Build tickets test-first and open a PR. No argument: next ticket. "auto": whole plan, you merge. "dark": whole plan in parallel, merged if two-way.'
disable-model-invocation: true
---

## Modes

| Mode | Builds | User approves | Ends with |
|---|---|---|---|
| `/as-build` | the next ready ticket | nothing up front | one PR for that ticket, which the user merges |
| `/as-build auto` | the whole plan, written first if none exists, each ticket in a fresh subagent | the plan once, plus any blocker or high-risk ticket | one PR for the plan, which the user merges |
| `/as-build dark` | same as `auto`, but ready tickets run in parallel, each in its own worktree | the plan once; parked tickets wait for the user | the same PR, merged by a fresh subagent if its door is two-way, otherwise left for the user |

`$ARGUMENTS` selects the mode: `auto` and `dark` follow `autonomous.md` in this folder, and empty or anything else runs Default.

## Default: one task

Fetch the remote first: `main` in this skill means the remote's latest `main`.

A ticket is ready when it is open, has no `needs-human` label and no open PR whose body closes it, and every ticket in its `Blocked by` is closed. In `auto` and `dark`, a ticket is on the work branch when a commit on the work branch, and not on `main`, has its `Implements #N` line; it then counts as closed for its dependents and is no longer ready itself.

Start from a clean working tree: if it has uncommitted changes, stop and ask the user how to handle them, so ticket commits never absorb unrelated work. Pick the first ready ticket in the open `plan` issue's Task List. If none is ready, stop and say so; no marker exists yet, so there is nothing to delete. Then:

1. Create the branch per `.claude/skills/git-workflow-and-versioning/references/branch-naming.md`, then create the build marker naming it (see Build marker below). Change no repository file before the marker exists
2. Install dependencies as the project's CI does
3. Build the ticket's acceptance criteria with the as-test skill
4. Run the checks the project's CI runs; all pass
5. Commit with a message per the git-workflow-and-versioning skill
6. Spawn the `code-reviewer` agent on the diff against `main`, naming the ticket. If it returns REQUEST CHANGES, fix every Critical and Required finding, re-run step 4, commit, and spawn it once more. If it still returns REQUEST CHANGES, push the branch unless it already has an open PR, then delete the build marker, stop and report the findings without opening a PR
7. Push the branch and open a PR to `main`, using the PR body below
8. Delete the build marker and stop. Leave the ticket open, because merging the PR closes it

If the run stops anywhere else once the marker exists (checks that won't pass, a question for the user), delete the marker before stopping. Every way a Default run ends after step 1 deletes it: PR opened, stopped on review findings, or stopped for the user.

## Build marker

While `/as-build` runs, in any mode, the file `.claude/state/build-active` in the **main checkout** marks a build as active; the build guard allows repository edits only while it exists. The main checkout is the parent of the directory `git rev-parse --git-common-dir` names, so from a worktree the path still lands in the main checkout, and implementers in worktrees are covered by their coordinator's marker. `.claude/state/` is gitignored, so the marker never shows in `git status` or a commit.

The marker holds exactly two lines: the work branch, and the run's start time in ISO 8601 UTC.

```text
branch=<work branch>
started=<YYYY-MM-DDTHH:MM:SSZ>
```

Create it, replacing any marker already there, with:

```sh
marker="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")/.claude/state/build-active"
mkdir -p "$(dirname "$marker")"
printf 'branch=%s\nstarted=%s\n' "<work branch>" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$marker"
```

Delete it with the same `marker=` line, then `rm -f "$marker"`.

Only the session that runs `/as-build` creates and deletes the marker. The subagents it spawns (implementers, fix subagents, reviewers, the merge subagent) neither create nor delete it; an implementer following the Default loop from installing dependencies through the commit starts after step 1 and stops before step 6, so it never reaches either step.

## PR body

```markdown
Closes #N

## Merge Danger

**Door:** one-way or two-way

**Blast Radius:** one word

## Manual check

- [what to verify by hand in the preview deployment]
```

The PR closes each ticket it implements with its own `Closes #N` line. When every other ticket in the plan's Task List is closed, or closed by an open PR's body, it also closes the `plan` issue and its `prd` the same way.

A change is high-risk when it touches auth or permissions, destructive data migrations, deleting user data, payments, deploys, secrets, or anything `git revert` can't undo. A one-way door is a high-risk change, or one that touches persisted data shapes (including a key or format change, since a revert does not repair data already written), dependencies, CI, deploy or framework config, environment variables, or the agent instructions (`.claude/`, `CLAUDE.md`, `AGENTS.md`), or that removes or renames a public route. Any other change is a two-way door: cheap to reverse. When unsure, call it one-way. Blast radius is what the change could affect if it is wrong. Manual check is what a person should verify in the preview deployment before merging, drawn from the acceptance criteria, for what tests cannot cover.
