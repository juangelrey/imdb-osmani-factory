# Capability Map

**Propose a capability map before writing the spec.** A module table plus a build order:

```markdown
## Capability Map

| Module id | Responsibility | Depends on |
|---|---|---|
| search | Query the API, show results | — |
| favorites | Add, remove, persist items | — |
| recommendations | Suggest items from favorites | search, favorites |

Build order: search, favorites → recommendations
```

Module ids are kebab-case and stable. Dependencies point one way; two modules that need each other are one module. The human approves the map before the rest of the spec is written. The map lives in the one `prd` issue. Each module becomes a phase of the plan.
