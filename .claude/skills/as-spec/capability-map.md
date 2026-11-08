# Capability Map

**Propose a capability map before writing the spec:**

```markdown
## Capability Map

| Module id | Responsibility | Depends on |
|---|---|---|
| notes | Create, edit and store notes | — |
| tags | Tag notes and filter by tag | notes |
| sharing | Share a note by link | notes |
```

Dependencies point one way; two modules that need each other are one module. The human approves the map before the rest of the spec is written.
