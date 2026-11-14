# Software factory plan

Status on 2026-11-14. This is the plan to make Reelbase's build pipeline run unattended: a PRD goes
in, and tested, deployed, monitored software comes out.

## Goal and limit

**Goal:** build, verify, ship and repair run with no person involved.

**What stays with a person, on purpose:**

- writing the intent (the PRD) and approving it with a label
- merging one-way-door changes (auth, secrets, dependencies, CI, `.claude/`, removed routes)
- answering tickets parked with `needs-human`

## Where we are

| Stage | Today | Target |
|---|---|---|
| Intake | You run `/as-spec` in a session | Issue in, draft PRD out, questions as comments |
| Start | You press **Run now** on a cloud task | `approved` label on the `prd` issue starts it |
| Build | Unattended (`/as-build dark` in the cloud) | Same |
| Review | Unattended, per ticket and whole branch | Same |
| Verify | Unit tests in CI; manual checks by you on the preview | E2E on preview, verifier agent, holdout scenarios |
| Merge | Two-way: `/as-merge`. One-way: you | Same, with the door decided by a script |
| After merge | Nothing | Smoke test, rollback, flag-off, Sentry errors become tickets |

**Proven on 2026-11-14 (PR #89):** a cloud task ran `/as-build dark` from PRD to PR with no input:
plan, 3 tickets in parallel, 4 reviews, CI green, in about 26 minutes. Your part was the PRD, three
manual checks on the preview and the merge.

## How it fits together

```text
issue ──> /as-spec ──> PRD ──[you: approved label]──> cloud task: /as-build dark
                                                            │
                          plan ─> tickets ─> build ─> review ─> one PR
                                                            │
      GitHub Actions: lint, types, unit, build, e2e on preview, test-integrity, door script
      Cloud tasks:    verifier (manual checks via ui-sdk bridge), holdout judge
                                                            │
                 two-way door ──> /as-merge          one-way door ──> you
                                                            │
                                   Vercel production (features behind flags, off)
                                                            │
        smoke test ──fail──> rollback      Sentry spike ──> flag off      Sentry sweep ──> bug issue
                                                            │
                                              bug issue ──> back to the queue
```

**Where each piece runs**

| Piece | Runs in | Why there |
|---|---|---|
| Build, review, merge, verifier, judge, Sentry sweep | Claude cloud tasks, on the Max subscription | Needs a model; triggers on schedule, API call or GitHub issue/PR events |
| Lint, types, tests, e2e, door script, smoke, rollback | GitHub Actions | Deterministic, no model; cloud tasks have no check-run or deployment trigger |
| Handoff from Actions to cloud | The task's `/fire` endpoint | Lets a finished check start `/as-merge` or a fix |

## Decisions made

| # | Decision | Choice |
|---|---|---|
| 1 | Order | Foundation, cloud spike, verification, then triggers |
| 2 | Plan approval | Approving the PRD covers the plan; no second approval |
| 3 | Feature flags | Only for user-visible features |
| 4 | Holdout scenarios | `scenario`-labeled GitHub issues to start; move to a private repo on the signals below |
| 5 | Production authority | The factory may roll back and turn flags off without asking; both are reversible |
| 6 | Build-guard hook (#70, #71) | Dropped; required checks on `main` and the door script cover it |
| | Hosting | Vercel Hobby |
| | Model access | Claude cloud tasks on the Max subscription |
| | Errors | Sentry |
| | Flags | LaunchDarkly |

**Signals to move holdouts to a private repo:** scenarios pass but the feature is broken in
production; diffs contain values copied from a scenario; autonomy is widened to one-way doors.

## Tasks

Owner: **You** = by hand. **F** = the factory builds it; you merge when it touches CI or `.claude/`.
**GA** = GitHub Action. **CT** = cloud task.

### Phase 0: foundation — done

| # | Task | Status |
|---|---|---|
| 0.1 | Commit ui-sdk, Sentry and config; remove the Sentry example routes | Done (#83, #89) |
| 0.2 | LaunchDarkly server SDK and `src/lib/flags` | Done (#83). Flag override for Playwright still to add, in 3.1 |
| 0.3 | Sentry tags environment and release | Done (#89), checked on the preview |
| 0.4 | `main` requires the CI check, admins included | Done |
| 0.5 | Spike: can a cloud task run `/as-build dark` | Done: yes |

### Phase 1: verification — next

This replaces the manual checks you did on PR #89.

| # | Task | Owner | Why it is useful |
|---|---|---|---|
| 1.1 | Run Playwright against each Vercel preview, on `deployment_status`, with the protection bypass secret | F, then GA | E2E specs exist but CI never runs them; the merge gate is unit-level |
| 1.2 | Test-integrity gate: fail on skipped or deleted tests, `@ts-ignore`, `eslint-disable`, lowered thresholds | F, then GA | Stops a build going green by weakening the bar |
| 1.3 | Door check as a path-rules script | F, then GA | The one-way or two-way call is model judgment today |
| 1.4 | Fix the flaky hover-delay test in `title-preview.test.tsx` | F | A flake will trigger false auto-fixes once 2.6 is on |
| 1.5 | Migrate interactive controls to ui-sdk, with an agent test per interface | F | Makes every control findable and usable by name; the test fails on any that is not |
| 1.6 | Verifier: run each PR's `## Manual check` on the preview through the ui-sdk bridge, and post a check run | F, then CT | Removes the manual check; `dark` currently merges with those checks not run |
| 1.7 | Holdout scenarios: `scenario` issues the implementers are told not to read, judged on the preview | You and F | Tests an implementer can see can be gamed |

Split into two PRDs: 1.1–1.4 first (small CI gates), then 1.5–1.7.

**You first:** create the bypass secret in Vercel (Project → Settings → Deployment Protection →
Protection Bypass for Automation) and add it to GitHub as `VERCEL_AUTOMATION_BYPASS_SECRET`.

### Phase 2: triggers

This removes you starting and resuming runs.

| # | Task | Owner | Why it is useful |
|---|---|---|---|
| 2.1 | Kill switch and budgets: task toggle, daily run cap, share of the Max limit | You | Must exist before anything starts by itself |
| 2.2 | Start the build task from the `approved` label on a `prd` issue | CT | Removes **Run now** |
| 2.3 | Move the two unattended rules into the skill: PRD approval covers the plan; park instead of asking | F | The task prompt shrinks to one line, and every run behaves the same |
| 2.4 | Resume when `needs-human` is removed, plus an hourly sweep for ready tickets | CT | Parked work restarts without you |
| 2.5 | When checks finish, an Action calls `/fire` to run `/as-merge` | GA, then CT | Cloud tasks cannot trigger on check runs |
| 2.6 | Turn on auto-fix for factory PRs | Built in | A red PR or a review comment gets fixed without you |

### Phase 3: after merge

This closes the loop from production back to the queue.

| # | Task | Owner | Why it is useful |
|---|---|---|---|
| 3.1 | Flag-per-feature rule in `/as-plan` and `/as-build`; a change behind an off flag is a two-way door; e2e covers both flag states | F | Far fewer PRs land on you; turning off is a flag flip, not a revert |
| 3.2 | Production smoke test after each deploy; on failure `vercel rollback`, open an issue, and `vercel promote` once fixed | F, then GA | Nothing watches production today |
| 3.3 | Hourly Sentry sweep: new errors become deduplicated `bug` issues | CT | Production problems enter the queue |
| 3.4 | Bug lane in `/as-build`: reproduce with a failing test first, no PRD | F | A fix should not need a spec cycle |
| 3.5 | Error spike after a flag is turned on: turn it off | CT | Faster and narrower than a rollback |

### Phase 4: intake and operations

| # | Task | Owner | Why it is useful |
|---|---|---|---|
| 4.1 | Unattended `/as-spec`: an issue becomes a draft PRD, with questions as comments | CT | Your input becomes a few async minutes |
| 4.2 | Weekly stale-flag cleanup | CT | Flags left on forever become dead code paths |
| 4.3 | Metrics: park rate, review rejections, retries, cost per ticket, reverts, holdout pass against later bugs | F | Evidence for 4.4 and for the holdout decision |
| 4.4 | Widen the two-way policy from the metrics, such as patch dependency updates | You | Maintenance without you |

## Constraints to design around

**Claude cloud**

- Runs push and comment as you. A required review cannot gate them; required status checks do.
- Triggers are schedule, API and GitHub issue, PR and release events. Nothing fires on check runs or
  deployments, hence 2.5.
- Label filters are documented for PR triggers only. For issue triggers, the prompt checks the label.
- `/fire` text reaches the task marked as untrusted; the task prompt must say to act on it.
- `gh issue` and `gh pr` fail there; use REST, as `AGENTS.md` says.
- Local MCP servers are not visible. Sentry and LaunchDarkly must be claude.ai connectors.
- Parallel runs draw down the Max limit quickly. Scheduled tasks are a research preview.

**Vercel Hobby**

- Rollback only reaches the immediately previous deployment, so the smoke test must run right after
  each deploy.
- After a rollback, new pushes to `main` do not go live until `vercel promote`.
- No rolling releases; LaunchDarkly rollouts take that role.

**ui-sdk**

- Pinned at `0.1.0-beta.1`; expect API changes.
- The bridge only sees ui-sdk components, so 1.6 depends on 1.5.

**Skills**

- `/as-build` treats any argument other than exactly `auto` or `dark` as single-ticket mode. Extra
  instructions go in the prompt text, not after the command.

## The cloud task prompt in use

```text
Run the as-build skill in dark mode (`/as-build dark`).

This run is unattended: my approval of the open `prd` issue covers the plan,
and where the skill says to stop and ask, park the ticket instead.

End with a comment on the `prd` issue summarizing the run.
```

Form: repository `reelbase`, Default environment, no connectors. After 2.3 the second paragraph goes
away.

## Risks

| Risk | What limits it |
|---|---|
| Code grows faster than anyone understands it | One-way doors stay with you; PR summaries; metrics in 4.3 |
| Agents pass their own tests without the feature working | Holdouts (1.7), test-integrity gate (1.2), verifier (1.6) |
| A bad change reaches production | Flags off by default (3.1), smoke and rollback (3.2), flag-off on spike (3.5) |
| Runaway cost or loops | Kill switch and caps (2.1); auto-fix is bounded |
| A fix loop on a flaky test | Fix flakes first (1.4) |
| The door is called two-way wrongly | Script (1.3) plus the independent `/as-merge` check; when unsure, one-way |

## Sources

- [Software Factories, Light and Dark](https://addyosmani.com/blog/software-factories/) (Addy Osmani)
- [StrongDM's software factory](https://simonwillison.net/2026/Feb/7/software-factory) (Simon Willison) and [factory.strongdm.ai](https://factory.strongdm.ai/)
- [Built by Agents, Tested by Agents, Trusted by Whom?](https://law.stanford.edu/2026/02/08/built-by-agents-tested-by-agents-trusted-by-whom/) (Stanford Law)
- [Cloud scheduled tasks](https://code.claude.com/docs/en/routines.md), [Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web.md), [GitHub Actions](https://code.claude.com/docs/en/github-actions.md)
- [Vercel: e2e after a preview deployment](https://examples.vercel.com/guides/how-can-i-run-end-to-end-tests-after-my-vercel-preview-deployment), [protection bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation), [instant rollback](https://vercel.com/docs/instant-rollback)
- [Sentry: agents need production context](https://blog.sentry.io/agents-need-production-context/)
- [LaunchDarkly hosted MCP server](https://launchdarkly.com/docs/home/getting-started/mcp-hosted)
