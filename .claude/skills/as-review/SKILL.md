---
name: as-review
description: Conducts multi-axis code review. Use before merging any change. Use when reviewing code written by yourself, another agent, or a human. Use when you need to assess code quality across multiple dimensions before it enters the main branch. Use when asked to review a diff or a pull request, even when the diff is pasted inline.
argument-hint: "[PR number | base ref]"
---

# Code Review and Quality

The single source for how this project reviews a change: five axes, a test-quality check, dependency review, severity labels, and one output template.

**The approval standard:** approve a change when it clearly improves overall code health, even if it isn't how you would have written it. If it improves the codebase and follows the project's conventions, approve it.

## Process

1. **Pick the diff.** A PR number in $ARGUMENTS: the PR's diff against its base. A ref: the current branch against that ref. Nothing: the current branch against `main`, plus any uncommitted changes.
2. **Understand the intent.** Read the ticket(s) the change implements and the open `prd` issue. Know what behaviour should change before reading code.
3. **Review the tests first.** They reveal intent and coverage: do they exist, test behaviour rather than implementation, cover edge cases, and carry descriptive names?
4. **Prove the tests bite.** Invert one condition the change adds (drop a negation, swap `&&` for `||`), run that test file, then restore the source from a copy. A mutation that stays green is a finding: name the missing test case.
5. **Review the implementation** file by file against the five axes below.
6. **Confirm each finding.** Check it against the callers, guards and tests that reach the changed code, and drop it if they rule it out. Label defects that already exist on `main` separately from regressions this change introduces. Zero findings is a valid result.
7. **Check the verification story:** the project's test, typecheck, lint and build scripts ran on this change and passed.

## The Five Axes

### 1. Correctness

- Matches the ticket's acceptance criteria and stays inside the `prd` boundaries.
- Edge cases handled: null, empty, boundary values, upstream API errors and empty results.
- Error paths handled, not just the happy path.
- No off-by-one errors, race conditions, or state inconsistencies.

### 2. Readability and simplicity

- Names are descriptive and match project conventions (`data`, `temp`, `result` need context).
- Control flow is straightforward: no nested ternaries or deep callbacks.
- **Could this be done in fewer lines?** Abstractions earn their place at the third use case.
- No dead code: unused variables, compat shims, `// removed` comments, now-unreferenced helpers. List any as findings.
- **A new conditional bolted onto an unrelated flow** is a design smell, not a nit. Repeated conditionals on the same shape signal a missing model or dispatcher.

### 3. Architecture

- Follows existing patterns; a new pattern is justified.
- Module boundaries hold: external API access stays in its client module, server code stays on the server, client components stay lean.
- **The refactor reduces complexity rather than relocating it.** Count the concepts a reader must hold; prefer the version where branches, modes or layers disappear.
- Feature logic stays in its owning module; reuse the canonical helper instead of a near-duplicate.
- **Type boundaries are explicit.** Question gratuitous `any`, casts, optionals, and silent fallbacks that paper over an unclear invariant.
- Files stay a healthy size (about 1000 total lines is the inspection signal). When a change grows a large file, decompose first, then add.

### 4. Security

Apply the `security-and-hardening` skill. In review, confirm:

- Secrets are read only in server-side code and never reach the client.
- Untrusted input (URL params, API responses, stored JSON) is validated before use.
- Rendered output relies on the framework's escaping; raw-HTML injection never sees untrusted data.
- No secrets in code, logs, or version control.

### 5. Performance

Apply the `performance-optimization` skill. In review, confirm:

- No unnecessary re-renders: no new object or function props created in render for memoized children, no state held higher than needed.
- No heavy client-only code in the initial bundle that a dynamic import could defer.
- Images go through the framework's image component with explicit size and sized source URLs.
- Animations touch only `transform` and `opacity`.
- No unbounded loops or large objects created in hot paths.

## Structural Remedies

When you flag a structural problem, propose the move:

- Replace a chain of conditionals with a typed model or an explicit dispatcher.
- Collapse duplicate branches into a single flow.
- Separate orchestration from business logic.
- Move feature-specific logic out of a shared module into the one that owns it.
- Reuse the canonical helper instead of a bespoke near-duplicate.
- Make a type boundary explicit so downstream branching disappears.
- Delete a pass-through wrapper; extract a helper or split a large file.

Prefer the remedy that removes moving pieces.

**Presumptive blockers:** surface each with the simpler design, and label it Required when the change actively makes structure worse: a refactor that relocates complexity; a file pushed past the size boundary with no decomposition; feature logic in a shared module; a near-duplicate of a canonical helper; a silent fallback hiding an unclear invariant.

## Change Size

About 100 changed lines reviews in one sitting; about 300 is fine for one logical change; about 1000 should be split. Refactoring and new behaviour are two changes. Whole-file deletions and mechanical refactors are fine large.

## Dependency Review

Adding or upgrading a dependency: follow `dependency-review.md` in this folder.

## Severity Labels

Every finding carries exactly one label:

| Label | Meaning | Author action |
|---|---|---|
| **Critical** | Security vulnerability, data loss, broken functionality | Must fix before merge |
| **Required** | Missing test, surviving mutation, wrong abstraction, poor error handling, presumptive blocker | Must fix before merge |
| **Optional** | A simpler design or useful refactor | Author's choice |
| **Nit** | Formatting, naming, style preference | Author may ignore |
| **FYI** | Context for later | None |

Critical and Required findings are the must-fix set; each includes a specific fix. The verdict is **REQUEST CHANGES** while any remain, otherwise **APPROVE**.

**Lead with what matters.** Order by leverage: correctness and security, then structural regressions and missed simplifications, then the rest. A few high-conviction findings beat a long list. If you have one structural problem and ten nits, the structural problem is the review.

## Honesty

- Approve with evidence of review, not a bare "LGTM".
- Name a bug as a bug; quantify impact where you can.
- Push back on approaches with clear problems and propose the alternative.
- Say when you are uncertain and suggest how to check, rather than guessing.
- Comment on code, not people.

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
- Checks run: [which checks ran, and their result]
- Security: [observations]
```

Omit empty sections except Verdict, Overview and Verification Story. The verdict feeds the merge decision; a person or `/as-merge` makes that call.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "It works, that's good enough" | Unreadable, insecure or misplaced code is debt that compounds. |
| "AI-generated code is probably fine" | It is confident and plausible even when wrong; it needs more scrutiny. |
| "The tests pass, so it's good" | Tests miss architecture, security and readability problems, and may not bite: run the mutation. |
| "We'll clean it up later" | Cleanup lands in this change or in a filed ticket. |
