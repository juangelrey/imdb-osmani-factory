## Autonomous: the whole plan (`/as-build auto` and `dark`)

1. **Require a spec.** Look only for an open issue labeled `prd`. A README or arbitrary doc does **not** count. If none exists, stop and tell the user to run `/as-spec` first — do not invent requirements.
2. **Establish a clean baseline.** Run `git status --porcelain`. If there are any uncommitted changes, stop and ask the user to commit, stash, or confirm how to handle them. Autonomous per-task commits must not absorb unrelated local work, or the clean-rollback guarantee breaks.
3. **Plan if needed.** If there is no open issue labeled `plan`, invoke the as-plan skill to generate one.
4. **Single checkpoint.** Present the full plan and wait for an unambiguous affirmative (e.g. "approve", "go", "yes"). Treat hedged responses ("looks reasonable", "I guess") as **not** approved.
5. **Execute every task in dependency order.** A ticket is ready as defined in `SKILL.md`; phases and Task List order never gate it. Create the work branch per `.claude/skills/git-workflow-and-versioning/references/branch-naming.md`. You coordinate; do not write code yourself. Each ticket gets one implementer subagent, so it starts with a fresh context and its work stays out of this session.
   - `auto`: one ready ticket at a time, in the foreground, on the work branch.
   - `dark`: up to 3 ready tickets at once. Spawn them in one message, each with `isolation: "worktree"`, which gives it its own branch. When one reports DONE with its branch name, merge that branch into the work branch with `--no-ff`, then remove its worktree and branch (`git worktree remove <path>`, `git branch -d <branch>`) and spawn the next ready ticket while fewer than 3 are running. If a merge conflicts, abort it and park the ticket (step 6).

   Keep the brief short and use pointers, not copied text:
   - the ticket number, the `prd` issue and the `plan` issue
   - its branch, plus the commits made so far on the work branch
   - "Run steps 2–6 of the default loop in `.claude/skills/as-build/SKILL.md`. Stay on this branch. Do not push or open a PR. Stage only the files this ticket touched, never `git add -A`. Make exactly one commit, its body ending with `Part of #N`."
   - "If a stop condition in step 6 of `.claude/skills/as-build/autonomous.md` applies, do not push through or guess. Report BLOCKED with the reason and leave the blocked work uncommitted."

   It must report, in at most 5 lines, DONE or BLOCKED, its branch, the commit hash, and any decision later tickets need.

   After each report (in `dark`, after each merge), check it yourself: the commit exists and the working tree is clean, and in `dark` the project's test script passes on the work branch after each merge. Keep only pass or fail and any failing test names, not full logs. Then pass any decisions on in the next brief.

   When no ticket is ready and none is running, go to step 7.

6. **Park or stop.** In `dark`, park a ticket when its implementer reports BLOCKED, its merge conflicts, or it meets a condition below. To park: add the `needs-human` label (create it if missing), comment the reason or question on the ticket, remove its worktree and branch, and continue with the rest. Tickets that depend on it never become ready; leave them unlabeled.

   Stop and ask the user when your check fails, and in `auto` also when an implementer reports BLOCKED or a condition below applies:
   - a test can't be made to pass or the build breaks without an obvious fix
   - the spec is ambiguous, or a task needs a decision the spec doesn't cover
   - a task is high-risk or irreversible — auth/permission changes, destructive data migrations, payments, deletions, deploys, anything touching secrets, **or anything you can't undo with `git revert`** → follow doubt-driven-development and get explicit sign-off before continuing. Check this before spawning the implementer, not after

   After the user resolves a blocker or removes a `needs-human` label, they re-invoke the same mode — it resumes from the tickets not yet on `main` or the work branch.

7. **Open one PR.** Run the review step (Default step 7 in `SKILL.md`) once on the whole branch, naming every ticket, with one fix subagent making the fixes. Then push and open the PR as in Default step 8 of `SKILL.md` with one `Closes #N` line per ticket. Leave the tickets open.
8. **Hand off the merge (`dark` only).** Choosing `dark` is the user's sign-off to deploy two-way-door PRs to production. If the PR body says `**Door:** two-way`, wait for the PR's checks to finish, then spawn one fresh subagent with only this brief: "Follow `.claude/skills/as-merge/SKILL.md` for PR #<number>." Pass no other context, so it judges the diff unanchored by this run. A one-way door skips this step.
9. **Summarize at the end:** tasks completed, tests added, commits made, the merge verdict, each parked ticket with its question, and the tickets waiting on it.
