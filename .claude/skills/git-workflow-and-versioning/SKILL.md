---
name: git-workflow-and-versioning
description: Commit message and branch rules for this project. Use when writing a commit message, staging a commit, or naming or creating a branch.
---

# Git workflow

## Commit messages

Match the existing history:

- Subject: imperative, sentence case, no `<type>:` prefix, no trailing period. For example `Add the filter panel to the search page`.
- Body: explain why when the diff does not make it obvious, plus behaviour a reviewer would miss. Wrap at about 72 characters.

## Staging

Stage only the files the change touched, by path: `git add <path>...`. Check `git status` first so unrelated files stay out.

## Branches

Name and create branches per `references/branch-naming.md`.
