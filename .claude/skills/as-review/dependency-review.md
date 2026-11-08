# Dependency Review

**Before adding a dependency:** the existing stack can't already do it; bundle impact is acceptable; it is actively maintained; the package audit is clean (triage per `.claude/skills/security-and-hardening/dependency-audit.md`); the license is compatible. Prefer existing utilities: every dependency is a liability.

**Upgrading a dependency** is a behaviour change you didn't write:

1. Read the changelog, and the migration notes for a major bump. Semver is a promise, not a guarantee.
2. One dependency per change, so a break names its cause and the revert is clean.
3. A green suite before and after verifies it. Thin coverage around the dependency is itself a finding.
4. Review the lockfile diff, not just the manifest. Commit the lockfile; let the package manager write it.
