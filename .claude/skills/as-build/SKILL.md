---
name: as-build
description: Build tickets test-first and open a PR. No argument: next ticket. "auto": whole plan, you merge. "dark": whole plan in parallel, merged if two-way.
disable-model-invocation: true
---

## Modes

| Mode | Builds | User approves | Ends with |
|---|---|---|---|
| `/as-build` | the next ready ticket | nothing up front | one PR for that ticket, which the user merges |
| `/as-build auto` | the whole plan, written first if none exists, each ticket in a fresh subagent | the plan once, plus any blocker or high-risk ticket | one PR for the plan, which the user merges |
| `/as-build dark` | same as `auto`, but ready tickets run in parallel, each in its own worktree | same as `auto` | the same PR, merged by a fresh subagent if its door is two-way, otherwise left for the user |

`$ARGUMENTS` selects the mode: `auto` and `dark` follow `autonomous.md` in this folder, and empty or anything else runs Default.

## Default: one task

A ticket is ready when it is open, has no `needs-human` label and no open PR, and every ticket in its `Blocked by` is closed. In `auto` and `dark`, a ticket is on the work branch when a commit there ends its body with `Part of #N`; it then counts as closed for its dependents and is no longer ready itself.

Pick the first ready ticket in the open `plan` issue's Task List. Then:

1. Create the branch per `.claude/skills/git-workflow-and-versioning/references/branch-naming.md`
2. Invoke the as-test skill, then read the ticket's acceptance criteria
3. Write a failing test for the expected behavior (RED)
4. Implement the minimum code to pass the test (GREEN)
5. Run the project's test, typecheck and lint scripts; all pass
6. Commit with a message per the git-workflow-and-versioning skill
7. Spawn the `code-reviewer` agent on the diff against `main`, naming the ticket. Fix every Critical and Required finding, re-run step 5, commit, and spawn it once more. If it still returns REQUEST CHANGES, stop and report the findings without opening a PR
8. Run the project's build script; it passes. Then push the branch and open a PR to `main`, using the PR body below
9. Stop. Leave the ticket open, because merging the PR closes it

## PR body

```markdown
Closes #N

## Merge Danger

**Door:** one-way or two-way

**Blast Radius:** one word

## Manual check

- [what to verify by hand in the preview deployment]
```

A two-way door is cheap to reverse. A one-way door is destructive or hard to reverse. When unsure, call it one-way. Blast radius is what the change could affect if it is wrong. Manual check is what a person should verify in the preview deployment before merging, drawn from the acceptance criteria, for what tests cannot cover.

If any step fails, follow the debugging-and-error-recovery skill.
