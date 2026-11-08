# Dependency Audit

Run the package manager's audit against the committed lockfile when adding or upgrading a dependency. Triage each finding:

```
critical / high
├── reachable in runtime, build or deploy paths? → fix now (update, patch or replace)
├── not reachable (confirmed) → fix soon, not a blocker
└── no fix available → workaround, replace, or defer with a reason and review date
moderate → reachable in production: next change; dev-only: when convenient
low      → during regular dependency updates
```

Ask: is the vulnerable function actually called? Runtime or dev-only? Exploitable here (a server-side flaw in client-only code is not)? Preview the audit's automatic fix and read the changelog; force a fix only by hand after testing, since it can cross major versions. Audits match known advisories only: for a new package, also check ownership, maintenance, release age, and the name (`crossenv` vs `cross-env`). Upgrade workflow: `.claude/skills/as-review/dependency-review.md`.
