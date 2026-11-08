# Reelbase

## Agent skills

`.claude/` holds our own skills, adapted from agent-skills. Use them over any `agent-skills:` plugin
skill with the same name.

## Cloud sessions

`gh issue` and `gh pr` fail in cloud sessions because the GitHub proxy blocks GraphQL. Use the
built-in GitHub tools, or REST through `gh api repos/juangelrey/reelbase/...`.
