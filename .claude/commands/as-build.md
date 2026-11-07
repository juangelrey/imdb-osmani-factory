---
description: Implement tasks incrementally — build, test, verify, commit. Add "auto" to run the whole plan in one approved pass, or "dark" to also merge two-way-door PRs.
disable-model-invocation: true
---

## Modes

- **`/as-build`** — implement the *next* pending task, then stop (careful, one slice at a time).
- **`/as-build auto`** — generate the plan if needed, get a single approval, then implement *every* task without stopping between them.
- **`/as-build dark`** — `auto`, plus an independent merge of the PR when its door is two-way.

`$ARGUMENTS` selects the mode. Treat `auto` as autonomous mode and `dark` as autonomous mode with step 8; anything else (or empty) is the default single-task mode.

## Default: one task

Pick the first open ticket in the open `plan` issue's Task List whose blockers are closed. Then:

1. Create a branch from `main` named `<N>-<short-slug>`, where N is the ticket number
2. Invoke the incremental-implementation skill alongside test-driven-development, then read the ticket's acceptance criteria
3. Write a failing test for the expected behavior (RED)
4. Implement the minimum code to pass the test (GREEN)
5. Run the full test suite to check for regressions
6. Run the build to verify compilation
7. Commit with a descriptive message
8. Spawn the `code-reviewer` agent on the diff against `main`, naming the ticket. Fix every Critical and Required finding, re-run tests and build, commit, and spawn it once more. If it still returns REQUEST CHANGES, stop and report the findings without opening a PR
9. Push the branch and open a PR to `main`, using the PR body below
10. Stop. Leave the ticket open, because merging the PR closes it

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

## Autonomous: the whole plan (`/as-build auto`)

1. **Require a spec.** Look only for an open issue labeled `prd`. A README or arbitrary doc does **not** count. If none exists, stop and tell the user to run `/as-spec` first — do not invent requirements.
2. **Establish a clean baseline.** Run `git status --porcelain`. If there are any uncommitted changes, stop and ask the user to commit, stash, or confirm how to handle them. Autonomous per-task commits must not absorb unrelated local work, or the clean-rollback guarantee breaks.
3. **Plan if needed.** If there is no open issue labeled `plan`, invoke planning-and-task-breakdown to generate one.
4. **Single checkpoint.** Present the full plan and wait for an unambiguous affirmative (e.g. "approve", "go", "yes"). Treat hedged responses ("looks reasonable", "I guess") as **not** approved.
5. **Execute every task in dependency order, one at a time.** Use each task's declared dependencies; if they aren't explicit, execute in the order the plan lists them. Create one branch named `plan-<N>`, where N is the plan issue number, or reuse it when resuming. You coordinate; do not write code yourself. For each ticket, spawn one foreground implementer subagent, so every ticket starts with a fresh context and its work stays out of this session.

   Keep the brief short and use pointers, not copied text:
   - the ticket number, the `prd` issue and the `plan` issue
   - the branch, plus the commits made so far on it
   - "Run steps 2–7 of the default loop in `.claude/commands/as-build.md`. Stay on this branch. Do not push or open a PR. Stage only the files this ticket touched, never `git add -A`. Make exactly one commit."
   - "If an Autonomous step 6 stop condition applies, do not push through or guess. Report BLOCKED with the reason and leave the blocked work uncommitted."

   It must report, in at most 5 lines, DONE or BLOCKED, the commit hash, and any decision later tickets need.

   After each report, check it yourself: the commit exists, the working tree is clean, and tests and build pass. Keep only pass or fail and any failing test names, not full logs. Then pass any decisions on in the next brief.

6. **Stop and ask the user** when an implementer reports BLOCKED, your check fails, or:
   - a test can't be made to pass or the build breaks without an obvious fix
   - the spec is ambiguous, or a task needs a decision the spec doesn't cover
   - a task is high-risk or irreversible — auth/permission changes, destructive data migrations, payments, deletions, deploys, anything touching secrets, **or anything you can't undo with `git revert`** → follow doubt-driven-development and get explicit sign-off before continuing. Check this before spawning the implementer, not after

   After the user resolves a blocker, they re-invoke `/as-build auto` — it resumes from the next ticket not yet on the branch.

7. **Open one PR.** Run the review step above once on the whole branch, naming every ticket, with one fix subagent making the fixes. Then push the branch and open a PR to `main`, using the PR body above with one `Closes #N` line per ticket. Leave the tickets open.
8. **Hand off the merge (`dark` only).** Choosing `dark` is the user's sign-off to deploy two-way-door PRs to production. If the PR body says `**Door:** two-way`, wait for the PR's checks to finish, then spawn one fresh subagent with only this brief: "Follow `.claude/commands/as-merge.md` for PR #<number>." Pass no other context, so it judges the diff unanchored by this run. A one-way door skips this step.
9. **Summarize at the end:** tasks completed, tests added, commits made, the merge verdict, and anything skipped, flagged, or left for the user.

If any step fails, follow the debugging-and-error-recovery skill.
