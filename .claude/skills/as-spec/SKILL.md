---
name: as-spec
description: Creates specs before coding. Use when starting a new project, feature, or significant change and no specification exists yet. Use when drafting a PRD or requirements document with objectives and scope, or when requirements are unclear, ambiguous, or only exist as a vague idea. Use when a single requirement spans several independently testable capabilities and needs a capability map of modules before specifying.
disable-model-invocation: true
---

# Spec-Driven Development

## Overview

The spec is the shared source of truth between you and the human engineer — it defines what we're building, why, and how we'll know it's done. After approval, `/as-plan` breaks it into tickets.

Skip it for small fixes whose requirements are unambiguous and self-contained.

## Phase 0: Scope Check

Most requests describe one capability; for those, go straight to Specify.

One request bundles several independently testable capabilities (distinct capabilities with their own data, or acceptance criteria that cluster into groups that could ship separately): follow `capability-map.md` in this folder before Specify.

## Phase 1: Specify

Ask the human clarifying questions until requirements are concrete: the objective and target users, core features and acceptance criteria, and known boundaries.

**Surface assumptions before writing spec content:**

```
ASSUMPTIONS I'M MAKING:
1. Data comes from an external API through server-side calls; the API token stays on the server
2. Favorites persist in browser storage, per browser (no accounts)
3. Both mobile and desktop layouts are in scope
4. We're targeting modern evergreen browsers
→ Correct me now or I'll proceed with these.
```

State every assumption you fill in for an ambiguous requirement — the spec exists to surface misunderstandings before code gets written.

**Cover three core areas.** Commands, project structure and code style come from the repo itself (the manifest, the existing layout and code), so the spec leaves them out.

1. **Objective** — What are we building and why? Who is the user? What does success look like?
2. **Testing Strategy** — Which behaviour gets tests, at which level.
3. **Boundaries** — Three tiers:
   - **Always do:** Keep secrets server-side, follow existing naming conventions, validate inputs
   - **Ask first:** Adding dependencies, changing CI config, changing a stored data shape
   - **Never do:** Commit secrets, remove failing tests without approval

**Spec template:**

```markdown
# PRD: [Project/Feature Name]

## Objective
[What we're building and why. User stories or acceptance criteria.]

## Capability Map
[Only when Phase 0 applied: module table + build order, then one section per module.]

## Testing Strategy
[Which behaviour gets tests, at which level]

## Boundaries
- Always: [...]
- Ask first: [...]
- Never: [...]

## Success Criteria
[How we'll know this is done — specific, testable conditions]

## Open Questions
[Anything unresolved that needs human input]
```

**Spec storage:** Save the spec as an open issue labeled `prd`, titled `PRD: [Project/Feature Name]`, with the template above as its body. If an open `prd` issue for this work exists, edit it. Create the `prd` label first if it does not exist.

**Reframe instructions as success criteria.** Translate vague requirements into concrete conditions:

```
REQUIREMENT: "Make the search page faster"

REFRAMED SUCCESS CRITERIA:
- Search page LCP < 2.5s on 4G
- No layout shift while images load (CLS < 0.1)
→ Are these the right targets?
```

**Stop after writing the spec (CRITICAL).** Once the spec is saved:

1. Summarize it and list any Open Questions.
2. Ask the human to approve it or request changes.
3. **End your turn.** Planning starts only after the human approves the spec in a later turn.

## Keeping the Spec Alive

- **Update when decisions or scope change** — edit the `prd` issue body first, then implement. GitHub keeps its edit history.
- **Reference the spec in PRs** — link the spec section each PR implements.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This is simple, I don't need a spec" | Simple tasks need short specs, but they still need acceptance criteria. |
| "I'll write the spec after I code it" | That's documentation, not specification. The value is clarity *before* code. |
| "It's one big feature; mapping it is overhead" | If acceptance criteria cluster into independently testable groups, a ten-line capability map fixes boundaries and build order before planning. |

## Red Flags

- Implementing features not in the spec or a ticket
