# Dependencies

**Adding a dependency:** the existing stack can't already do it; its bundle impact is acceptable; it is actively maintained; its license is compatible. Audits match known advisories only, so also check its ownership, its release age, and that its name isn't a lookalike of a popular package.

**Upgrading a dependency** is a behaviour change you didn't write:

1. Read the changelog, and the migration notes for a major bump.
2. One dependency per change, so a break names its cause and the revert is clean.
3. The test suite passes before and after the upgrade.
4. Commit the lockfile with the manifest, and review its diff.

## Audit

Run the package manager's audit on the lockfile the change produces. Triage each finding:

```
critical / high
├── reachable in runtime, build or deploy paths? → fix now (update, patch or replace)
├── not reachable (confirmed) → fix soon, not a blocker
└── no fix available → workaround, replace, or defer with a reason and review date
moderate → reachable in production: next change; dev-only: when convenient
low      → with the next upgrade of that package
```

Ask: is the vulnerable function actually called? Runtime or dev-only? Exploitable here (a server-side flaw in client-only code is not)? Preview the audit's automatic fix before applying it; a fix that crosses a major version is an upgrade.

The change lands only when the audit has no fix-now finding.
