## Autonomous: the whole plan (`/as-build auto` and `dark`)

1. **Require a spec:** an open issue labeled `prd`. If none exists, stop and tell the user to run `/as-spec` first.
2. **Start from a clean working tree,** as Default does.
3. **Plan if needed.** If there is no open issue labeled `plan`, invoke the as-plan skill to generate one.
4. **Single checkpoint.** Skip this when resuming the plan: any of its tickets is closed, parked or on a work branch. Present the full plan and wait for an unambiguous affirmative (e.g. "approve", "go", "yes"). Treat hedged responses ("looks reasonable", "I guess") as **not** approved.
5. **Execute every task in dependency order.** A ticket is ready as defined in `SKILL.md`. Create the work branch per `.claude/skills/git-workflow-and-versioning/references/branch-naming.md` (on resume, check out the existing one), then create the build marker naming it, as Build marker in `SKILL.md` describes, before spawning any implementer or making any other change to the repository. On resume, this rewrites the marker with a fresh start time. Steps 1 to 4 change no repository file, so they run before the marker exists. You coordinate; do not write code yourself. Each ticket gets one implementer subagent, so it starts with a fresh context and its work stays out of this session.
   - `auto`: one ready ticket at a time, on the work branch.
   - `dark`: up to 3 ready tickets at once, each in a subagent with `isolation: "worktree"`, which gives it its own branch starting from the work branch. When one reports DONE, merge its branch into the work branch, delete its worktree and branch, and run your check. Only after the check passes, or the ticket is parked, start the next ready ticket that is not already running, keeping at most 3 running. If a merge conflicts, abort it, delete the ticket's worktree and branch, and re-run the ticket once in the same slot with a fresh implementer, whose worktree starts from the latest work branch.

   Keep the brief short and use pointers, not copied text:
   - the ticket number, the `prd` issue and the `plan` issue
   - its branch (in `dark`, its worktree's own branch, which must contain the work branch's latest commit, else it reports BLOCKED), plus the commits made so far on the work branch
   - whether the user signed off its high risk
   - "Follow the Default loop in `.claude/skills/as-build/SKILL.md` from installing dependencies through the commit. Stay on this branch; pushing and the PR are mine."
   - "If a condition under Park or stop in `.claude/skills/as-build/autonomous.md` applies, do not push through or guess. Report BLOCKED with the reason, commit nothing, and leave the working tree as you found it."

   It must report, in at most 5 lines, DONE or BLOCKED, its branch, the commit hash, any decision later tickets need, and anything noticed but not touched.

   After each report (in `dark`, after each merge), check it yourself: the commit exists and the working tree is clean, and in `dark`, after installing dependencies as the project's CI does, the checks the project's CI runs pass on the work branch. Keep only pass or fail and any failing test names, not full logs. Then pass any decisions on in the next brief.

   In `dark`, review each ticket once its merge into the work branch passes your check: spawn the `code-reviewer` agent in the background with `isolation: "worktree"`, naming the ticket, that merge commit and, as base ref, its first parent. Reviewers take none of the 3 slots. If one returns REQUEST CHANGES, run one fix subagent in a slot, briefed like that ticket's implementer plus the findings, to fix every Critical and Required one, and merge and check its work as you do a ticket's. Until the fix is on the work branch, the ticket's dependents that have not started stay unready.

   When no ticket is ready and no subagent is running, go to step 7.

6. **Park or stop.** An implementer reports BLOCKED when:
   - a test can't be made to pass or the build breaks without an obvious fix
   - the spec is ambiguous, or a task needs a decision the spec doesn't cover
   - the ticket turns out high-risk and its brief carries no sign-off

   Before spawning each implementer, check whether its ticket is high-risk (defined under PR body in `SKILL.md`).

   - `auto`: delete the build marker, then stop and ask the user when your check fails or an implementer reports BLOCKED. For a high-risk ticket, follow the doubt-driven-development skill and get explicit sign-off before spawning it.
   - `dark`: park a ticket when it is high-risk without the user's sign-off, its implementer reports BLOCKED, its merge fails your check, or its re-run's merge conflicts too. To park: undo its merge so none of its commits remain on the work branch, add the `needs-human` label (create it if missing), comment the reason or question on the ticket, delete its worktree and branch, discarding their changes, and continue with the rest. Its dependents stay unready; leave them unlabeled. Removing `needs-human` from a ticket parked as high-risk is the user's sign-off. Drop a fix that reports BLOCKED, or whose merge conflicts or fails your check: abort or undo its merge, delete its worktree and branch, and carry its findings to step 7.

   Before any stop, let running implementers finish, then merge or park each, then delete the build marker. Parking a ticket in `dark` does not end the run; the marker stays until step 9, or until a stop. After the user resolves a blocker or removes a `needs-human` label, they re-invoke the same mode. On resume, read the comments on each ticket that lost its `needs-human` label, and put any answer that settles a spec question into the `prd` body before briefing it.

7. **Open one PR.** If no ticket is on the work branch, skip to step 9. Otherwise run Default's review step once on the whole branch, naming every ticket on it, with one fix subagent making the fixes. In `dark`, each ticket already had its own review in step 5: brief the reviewer to cover how the tickets fit together and the fix merges, and add the findings carried from step 6. Then push, and open the PR as Default does or, if the work branch already has an open PR, rewrite its body. Either way the body follows the PR body section of `SKILL.md` for the tickets on the work branch. Leave the tickets open.
8. **Hand off the merge (`dark` only).** Choosing `dark` is the user's sign-off to deploy two-way-door PRs to production without their manual check. If the PR body says `**Door:** two-way`, wait until every check run and commit status on the PR's head commit has finished, then spawn one fresh subagent with only this brief: "Follow `.claude/skills/as-merge/SKILL.md` for PR #<number>." Pass no other context, so it judges the diff unanchored by this run.
9. **End the run.** Delete the build marker, as Build marker in `SKILL.md` describes. Every way a run ends after step 5 reaches this step or a stop in step 6, and each deletes the marker: PR opened (and, in `dark`, the merge handed off), every remaining ticket parked, or nothing ready (step 7 skips here). Then **summarize:** tasks completed, tests added, commits made, the merge verdict, each parked ticket with its question and the tickets waiting on it, and anything implementers noticed but did not touch.
