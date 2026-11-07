---
description: Implement tasks incrementally — build, test, verify, commit. Add "auto" to run the whole plan in one approved pass.
disable-model-invocation: true
---

Invoke the incremental-implementation skill alongside test-driven-development.

## Modes

- **`/as-build`** — implement the *next* pending task, then stop (careful, one slice at a time).
- **`/as-build auto`** — generate the plan if needed, get a single approval, then implement *every* task without stopping between them.

`$ARGUMENTS` selects the mode. Treat `auto` (canonical) or `all` as autonomous mode; anything else (or empty) is the default single-task mode. Note: autonomous mode is not faster *per task* — it runs the same test-driven loop — it only removes the human stepping *between* tasks.

## Default: one task

Pick the first open ticket in the open `plan` issue's Task List whose blockers are closed. Then:

1. Create a branch from `main` named `<N>-<short-slug>`, where N is the ticket number
2. Read the ticket's acceptance criteria
3. Load relevant context (existing code, patterns, types)
4. Write a failing test for the expected behavior (RED)
5. Implement the minimum code to pass the test (GREEN)
6. Run the full test suite to check for regressions
7. Run the build to verify compilation
8. Commit with a descriptive message
9. Spawn the `code-reviewer` agent on the diff against `main`, naming the ticket. Fix every Critical and Required finding, re-run tests and build, commit, and spawn it once more. If it still returns REQUEST CHANGES, stop and report the findings without opening a PR
10. Push the branch and open a PR to `main`, using the PR body below
11. Stop. Leave the ticket open, because merging the PR closes it

## PR body

```markdown
Closes #N

## Merge Danger

**Door:** one-way or two-way

**Blast Radius:** one word
```

A two-way door is cheap to reverse. A one-way door is destructive or hard to reverse. When unsure, call it one-way. Blast radius is what the change could affect if it is wrong.

## Autonomous: the whole plan (`/as-build auto`)

Use this once a spec exists and you want to collapse plan + build into one run. It removes the manual stepping between tasks — **not** the verification. Every task still earns a passing test and its own commit.

1. **Require a spec.** Look only for an open issue labeled `prd`. A README or arbitrary doc does **not** count. If none exists, stop and tell the user to run `/as-spec` first — do not invent requirements.
2. **Establish a clean baseline.** Run `git status --porcelain`. If there are any uncommitted changes, stop and ask the user to commit, stash, or confirm how to handle them. Autonomous per-task commits must not absorb unrelated local work, or the clean-rollback guarantee breaks.
3. **Plan if needed.** If there is no open issue labeled `plan`, invoke planning-and-task-breakdown to generate one.
4. **Single checkpoint.** Present the full plan and wait for an unambiguous affirmative (e.g. "approve", "go", "yes"). Treat hedged responses ("looks reasonable", "I guess") as **not** approved. This is the only human gate — after approval, run autonomously.
5. **Execute every task in dependency order.** Use each task's declared dependencies; if they aren't explicit, execute in the order the plan lists them. Work on one branch named `plan-<N>`, where N is the plan issue number. For each task, run the default loop above from RED through commit. Stage only the files that task touched — never `git add -A` blindly — and make one commit per task so any point is a clean rollback.
6. **Stop and ask the user** (do not push through) when:
   - a test can't be made to pass or the build breaks without an obvious fix → follow debugging-and-error-recovery
   - the spec is ambiguous, or a task needs a decision the spec doesn't cover
   - a task is high-risk or irreversible — auth/permission changes, destructive data migrations, payments, deletions, deploys, anything touching secrets, **or anything you can't undo with `git revert`** → follow doubt-driven-development and get explicit sign-off before continuing

   After the user resolves a blocker, they re-invoke `/as-build auto` — it resumes from the next ticket not yet on the branch.
7. **Open one PR.** Run the review step above once on the whole branch, naming every ticket. Then push the branch and open a PR to `main`, using the PR body above with one `Closes #N` line per ticket. Leave the tickets open.
8. **Summarize at the end:** tasks completed, tests added, commits made, and anything skipped, flagged, or left for the user.

If any step fails, follow the debugging-and-error-recovery skill.
