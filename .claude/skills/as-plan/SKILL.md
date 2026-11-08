---
name: as-plan
description: Breaks a spec into a plan issue and ticket issues linked by "Blocked by". Use when you have a spec or clear requirements and need to break work into implementable tasks. Use when a task feels too large to start, when you need to estimate scope, or when parallel work is possible.
---

# Planning and Task Breakdown

## The Planning Process

### Step 1: Enter Plan Mode

Work read-only: read the open `prd` issue and the relevant code, note existing patterns, dependencies, risks and unknowns. The output is a plan issue and one ticket issue per task (see Output Issues); code comes later, in `/as-build`.

### Step 2: Identify the Dependency Graph

Map what depends on what, and build foundations first. In a web app that is usually: types and the external API client → server code or route handlers → client UI.

A ticket gets a `Blocked by` only when it cannot start without the other ticket's work, or when both edit the same file (from "Files likely touched"). Every extra edge keeps a ticket from running in parallel; every missing shared-file edge becomes a merge conflict.

### Step 3: Slice Vertically

Build one complete user-facing path per task, not one layer per task ("all API calls", then "all pages"):

```
Task 1: User can search items by name (API call + results list)
Task 2: User can add an item to favorites (storage + button)
Task 3: User can view the favorites page
Task 4: User can open an item's detail page
```

Each vertical slice delivers working, testable functionality.

### Step 4: Write Tasks

Each task becomes one ticket issue with this body:

```markdown
## Task [N]: [Short descriptive title]

**Description:** One paragraph explaining what this task accomplishes.

**Acceptance criteria:**
- [Specific, testable condition]
- [Specific, testable condition]

**Dependencies:** ["Blocked by #N" for each blocking ticket, or "None"]

**Files likely touched:**
- `path/to/file.ts`
- `path/to/file.test.ts`

**Estimated scope:** [XS | S | M — see Task Sizing]
```

### Step 5: Order and Present

Put high-risk tasks early (fail fast); each task leaves the system in a working state. Present the plan to the human for review before anything is built.

## Task Sizing

| Size | Files | Scope | Example |
|------|-------|-------|---------|
| **XS** | 1 | Single function or config change | Add a validation rule |
| **S** | 1-2 | One component or route | Add a route handler |
| **M** | 3-5 | One feature slice | Add-to-favorites flow |
| **L** | 5-8 | Multi-component feature — **split it** | Search with filtering and pagination |
| **XL** | 8+ | **Split it** | — |

Keep every task at M or smaller (~5 files). Also split a task that needs more than one session or more than 3 acceptance bullets, spans independent areas, or has "and" in its title.

## Output Issues

All planning output lives in GitHub Issues. Create the `plan` and `ticket` labels first if they do not exist.

- **Plan issue:** An open issue labeled `plan`, titled `Plan: [Feature/Project Name]`, with `Part of #N` pointing at the `prd` issue. Its body follows the template below and holds design decisions, risks, open questions and the ticket list.
- **Tickets:** One issue per task, labeled `ticket`, with the Step 4 body and `Part of #N` pointing at the plan issue. Create the plan issue first, then tickets in dependency order so each `Blocked by #N` points at an existing issue. Then fill the plan issue's Task List with the ticket numbers.

**Never overwrite an incomplete plan.** Before creating a plan issue, list open issues labeled `plan`:

- Same work being replanned (the user asked to revise or extend this plan) → edit the existing issues in place.
- Different work → **stop and ask.** Its open tickets may be mid-build in another session. Leave them untouched; present the conflict and let the user decide (finish the old plan first, explicitly discard it, or tell you how the new plan should relate).

## Plan Issue Template

```markdown
# Implementation Plan: [Feature/Project Name]

## Overview
[One paragraph summary of what we're building]

## Architecture Decisions
- [Key decision 1 and rationale]
- [Key decision 2 and rationale]

## Task List

### Phase 1: [Name]
- #N: ...

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [High/Med/Low] | [Strategy] |

## Open Questions
- [Question needing human input]
```

The Task List is an index of ticket numbers grouped by phase, with no checkboxes. Phases group tickets for reading; only `Blocked by` gates work, so a ticket is ready as soon as its blockers are done, whatever its phase. A ticket's status is its issue state, which GitHub shows as a badge on the `#N` reference. Task details live in the tickets.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I can hold it all in my head" | Context windows are finite. Written plans survive session boundaries and compaction. |
