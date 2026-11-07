---
description: Merge a two-way-door PR from /as-build auto or dark after an independent check. Runs as a fresh subagent from /as-build dark, or by hand in a fresh session.
disable-model-invocation: true
argument-hint: <PR number>
---

You are the second pair of eyes on PR `$ARGUMENTS`. Its author already called it a two-way door; your job is to doubt that call from the diff alone. Merging is the exception. **Any doubt means human review**: that outcome is always correct and costs nothing.

Use REST through `gh api repos/juangelrey/reelbase/...` for every PR operation.

## Steps

1. **Check your independence.** If your context holds the writing, building or reviewing of this branch, you are biased: give the human-review verdict with that reason.
2. **Check eligibility.** All must hold, or give the human-review verdict:
   - the PR is open and its base is `main`
   - the PR body says `**Door:** two-way`
   - every check run on the head commit concluded `success`, and its combined status is `success`. If any is still pending, stop and report that

   Record the head SHA. That pinned SHA is the only version you judge and the only one you merge.
3. **Re-judge the door from the diff.** Read the full diff of the pinned SHA against `main`. Ignore the PR's own reasoning. Classify every changed file as two-way or one-way, with a one-line reason. A file is one-way when it touches anything on the high-risk list in step 6 of `/as-build`'s autonomous mode (`.claude/commands/as-build.md`), or any of these:
   - persisted data shapes, such as localStorage keys or stored formats. A revert does not repair data already written in users' browsers
   - dependencies (`package.json`, the lockfile)
   - CI, deploy or framework config (`.github/`, `next.config.*`, any Vercel config)
   - environment variables or anything near secrets or API keys
   - the factory itself (`.claude/`, `CLAUDE.md`, `AGENTS.md`), since it changes the rules future agents follow
   - a public route removed or renamed

   Done when every file has a class and a reason. One one-way file, or one file you cannot classify with confidence, means human review.
4. **Deliver the verdict as a PR comment**, listing the pinned SHA, every file with its class and reason, and the PR's `## Manual check` items as not run. For now a successful Vercel preview deployment stands in for the manual check.
   - Two-way: merge with `PUT .../pulls/<N>/merge`, `merge_method=merge` and `sha=<pinned SHA>`. Confirm the response says `merged: true`. If the merge is refused because the head moved, give the human-review verdict.
   - Otherwise: start the comment with **Human review, sorry.** and name the reasons. Leave the PR open.

Report the verdict in two lines.
