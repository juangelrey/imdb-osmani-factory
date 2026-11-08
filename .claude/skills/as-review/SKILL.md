---
name: as-review
description: Conducts multi-axis code review. Use before merging any change. Use when reviewing code written by yourself, another agent, or a human. Use when you need to assess code quality across multiple dimensions before it enters the main branch. Use when asked to review a diff or a pull request, even when the diff is pasted inline.
argument-hint: "[PR number | base ref]"
---

# Code Review and Quality

## Process

1. **Pick the diff.** `$ARGUMENTS` is a PR number, a base ref, or empty. A PR: its head against its base, checked out for step 4 without changing the current branch or working tree. A ref: the current branch against it. Empty: the current branch against the remote's latest `main`, plus any uncommitted changes. Ticket numbers you are given inform step 2 only.
2. **Understand the intent.** Read the ticket(s) the change implements and the open `prd` issue.
3. **Review the tests first** against the as-test skill's Writing Good Tests and Test Anti-Patterns to Avoid. A change the as-test skill exempts from RED and GREEN needs no new test; skip step 4 for it.
4. **Prove the tests bite.** Invert one condition the change adds, run its test file, then restore the source exactly. A mutation that stays green is a finding: name the missing test case.
5. **Review the implementation** file by file against the five axes below.
6. **Confirm each finding.** Check it against the callers, guards and tests that reach the changed code, and drop it if they rule it out. List defects that already exist on `main` under Pre-existing, unlabeled; they stay out of the verdict. Zero findings is a valid result.
7. **Run the checks.** For a PR, read its CI result; otherwise run the checks the project's CI runs on the reviewed code. A failure is Critical.

## The Five Axes

### 1. Correctness

- Matches the ticket's acceptance criteria and stays inside the `prd` boundaries.
- Edge cases handled: null, empty, boundary values, upstream failures and empty results.
- Error paths handled, not just the happy path.
- No off-by-one errors, race conditions, or state inconsistencies.

### 2. Readability and simplicity

- Names are descriptive and match project conventions (`data`, `temp`, `result` need context).
- Control flow is straightforward: no nested ternaries or deep callbacks.
- Simplicity per the as-test skill's Simplicity First.
- No dead code: unused variables, compat shims, `// removed` comments, now-unreferenced helpers. List any as findings.
- **A new conditional bolted onto an unrelated flow** is a design smell, not a nit. Repeated conditionals on the same shape signal a missing model or dispatcher.

### 3. Architecture

- Follows existing patterns; a new pattern is justified.
- Module boundaries hold: feature logic stays in its owning module, server-only code stays on the server, and the canonical helper is reused instead of a near-duplicate.
- **The refactor reduces complexity rather than relocating it.** Count the concepts a reader must hold; prefer the version where branches, modes or layers disappear.
- **Type boundaries are explicit.** Question gratuitous `any`, casts and optionals; fallbacks per the security-and-hardening skill.
- File size per the as-test skill's Scope Discipline.

### 4. Security

Check the changed code against the rules in the security-and-hardening skill.

### 5. Performance

Check the changed code against the fixes in the performance-optimization skill. Measuring belongs to the author; ask for numbers only when the change claims a speed-up. Confirm the client bundle grows only for a stated reason, and that no hot path runs an unbounded loop or allocates large objects.

## Structural Remedies

When you flag a structural problem, propose the move:

- Replace a chain of conditionals with a typed model or an explicit dispatcher.
- Collapse duplicate branches into a single flow.
- Separate orchestration from business logic.
- Make a type boundary explicit so downstream branching disappears.
- Delete a pass-through wrapper; extract a helper or split a large file.

Prefer the remedy that removes moving pieces. Label a structural finding Required when the change makes structure worse.

## Change Size

A change over about 1000 changed lines, or one mixing a refactor of existing code with new behaviour, gets an Optional finding proposing the split. A whole plan's branch, whole-file deletions and mechanical refactors are exempt.

## Dependency Review

Adding or upgrading a dependency: review it against `.claude/skills/security-and-hardening/dependencies.md`; thin test coverage around it is a finding.

## Severity Labels

Every finding this change introduces carries exactly one label:

| Label | Meaning |
|---|---|
| **Critical** | Security vulnerability, data loss, broken functionality, failing check |
| **Required** | Missing test, surviving mutation, wrong abstraction, poor error handling, structure made worse |
| **Optional** | A simpler design or useful refactor; the author's choice |
| **Nit** | Formatting, naming, style preference |
| **FYI** | Context for later |

Critical and Required findings are the must-fix set; each includes a specific fix. The verdict is **REQUEST CHANGES** while any remain, otherwise **APPROVE**.

**Lead with what matters.** Order by leverage: correctness and security, then structural regressions and missed simplifications, then the rest. If you have one structural problem and ten nits, the structural problem is the review.

## Honesty

- Name a bug as a bug; quantify impact where you can.
- Say when you are uncertain and suggest how to check, rather than guessing.

## Output Template

Return exactly this:

```markdown
## Review Summary

**Verdict:** APPROVE | REQUEST CHANGES

**Overview:** [1-2 sentences: what the change does and the overall assessment]

### Critical
- [file:line] [problem and fix]

### Required
- [file:line] [problem and fix]

### Optional
- [file:line] [suggestion]

### Nit
- [file:line] [note]

### FYI
- [file:line] [context]

### Pre-existing (on `main`, not introduced here)
- [file:line] [problem]

### Done Well
- [at least one specific observation]

### Verification Story
- Tests reviewed: [observations, including the mutation result]
- Checks run: [each CI check and its result]
- Security: [observations]
```

Omit empty sections except Verdict, Overview and Verification Story.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It works, that's good enough" | Unreadable, insecure or misplaced code is debt that compounds. |
| "AI-generated code is probably fine" | It is confident and plausible even when wrong; it needs more scrutiny. |
| "We'll clean it up later" | Cleanup lands in this change or is named for a follow-up ticket. |
