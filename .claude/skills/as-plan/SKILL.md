---
name: as-plan
description: Breaks the open `prd` issue into a `plan` issue and `ticket` issues linked by "Blocked by". Use when the user asks for a plan from an approved spec, or when /as-build auto or dark finds no open plan.
---

# Planning and Task Breakdown

## The Planning Process

### Step 1: Read

Read the open `prd` issue and the relevant code; note existing patterns, dependencies, risks and unknowns. Planning writes only issues; code comes in `/as-build`.

### Step 2: Identify the Dependency Graph

Map what depends on what.

A ticket gets a `Blocked by` only when it cannot start without the other ticket's work, or when both edit the same file (from "Files likely touched"). Every extra edge keeps a ticket from running in parallel; every missing shared-file edge becomes a merge conflict.

When the spec has a Capability Map, make each module a phase, and give each ticket a `Blocked by` on the tickets it needs from the modules in its Depends on column.

### Step 3: Slice Vertically

Build one complete user-facing path per task, not one layer per task ("all storage", then "all screens"):

```
Task 1: User can create a note (form + storage)
Task 2: User can list their notes
Task 3: User can search notes by title
Task 4: User can delete a note
```

Each vertical slice delivers working, testable functionality.

### Step 4: Write Tasks

Each task becomes one ticket issue with this body:

```markdown
**Description:** One paragraph explaining what this task accomplishes.

**Acceptance criteria:**
- [Specific, testable condition]
- [Specific, testable condition]

**Dependencies:** ["Blocked by #N" for each blocking ticket, or "None"]

**Files likely touched:**
- `path/to/file`
- `path/to/file.test`
```

### Step 5: Order

Put the tasks most likely to fail early; each task leaves the system in a working state.

## Task Sizing

Split a task that touches more than ~5 files, needs more than one session or more than 3 acceptance bullets, spans independent areas, or has "and" in its title.

## Output Issues

Create the `plan` and `ticket` labels first if they do not exist.

- **Plan issue:** An open issue labeled `plan`, titled `Plan: [Feature/Project Name]`, with `Part of #N` pointing at the `prd` issue, and the Plan Issue Template as its body.
- **Tickets:** One issue per task, labeled `ticket`, with the Step 4 body and `Part of #N` pointing at the plan issue. Create the plan issue first, then tickets in dependency order so each `Blocked by #N` points at an existing issue. Then fill the plan issue's Task List with the ticket numbers.

**Never overwrite an incomplete plan.** Before creating a plan issue, list open issues labeled `plan`:

- Same work being replanned (the user asked to revise or extend this plan) → edit the existing issues in place.
- Different work → **stop and ask** the user to finish or close the old plan first; its open tickets may be mid-build in another session, so leave them untouched.

## Plan Issue Template

```markdown
## Overview
[One paragraph summary of what we're building]

## Architecture Decisions
- [Key decision 1 and rationale]
- [Key decision 2 and rationale]

## Task List

### Phase 1: [Name]
- #N

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [High/Med/Low] | [Strategy] |

## Open Questions
- [Question needing human input]
```

The Task List indexes ticket numbers by phase, with no checkboxes: a ticket's status is its issue state. Phases are for reading; put every ordering need in `Blocked by`.
