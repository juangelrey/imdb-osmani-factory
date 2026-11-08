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

Start from a clean working tree: if it has uncommitted changes, stop and ask the user how to handle them, so ticket commits never absorb unrelated work. Pick the first ready ticket in the open `plan` issue's Task List. Then:

1. Create the branch per `.claude/skills/git-workflow-and-versioning/references/branch-naming.md`
2. Install dependencies as the project's CI does
3. Build the ticket's acceptance criteria with the as-test skill
4. Run the checks the project's CI runs; all pass
5. Commit with a message per the git-workflow-and-versioning skill
6. Spawn the `code-reviewer` agent on the diff against `main`, naming the ticket. If it returns REQUEST CHANGES, fix every Critical and Required finding, re-run step 4, commit, and spawn it once more. If it still returns REQUEST CHANGES, push the branch unless it already has an open PR, then stop and report the findings without opening a PR
7. Push the branch and open a PR to `main`, using the PR body below
8. Stop. Leave the ticket open, because merging the PR closes it

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
