---
name: as-spec
description: Write a spec as an open `prd` issue, then stop for approval.
disable-model-invocation: true
---

# Spec-Driven Development

## Phase 0: Scope Check

When one request bundles several independently testable capabilities (distinct capabilities with their own data, or acceptance criteria that cluster into groups that could ship separately), follow `capability-map.md` in this folder before Specify.

## Phase 1: Specify

Ask the human clarifying questions until every template section below can be filled concretely.

**Before writing spec content, list every assumption you fill in for an ambiguous requirement, numbered, ending with "→ Correct me now or I'll proceed with these."**

**Spec template:**

```markdown
## Objective
[What we're building, why, and for whom.]

## Capability Map
[Only when capability-map.md applied: the approved map.]

## Testing Strategy
[Which behaviour gets tests, at which level]

## Boundaries
- Always: [...]
- Ask first: [...]
- Never: [...]

## Success Criteria
[Specific, testable conditions; turn vague asks into measured targets]

## Open Questions
[Anything unresolved that needs human input]
```

**Spec storage:** Save the spec as the one open issue labeled `prd`, titled `PRD: [Project/Feature Name]`, with the template above as its body. If an open `prd` exists for this work, edit it; if one exists for other work, stop and ask the user to finish or close it first. Create the `prd` label first if it does not exist.

**Stop after writing the spec (CRITICAL).** Once the spec is saved:

1. Summarize it and list any Open Questions.
2. Ask the human to approve it or request changes.
3. **End your turn.** Planning starts only after the human approves the spec in a later turn.
