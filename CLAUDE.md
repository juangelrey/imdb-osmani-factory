# Reelbase

## Agent skills

`.claude/` holds our own skills and agents, adapted from agent-skills. Use them over any
`agent-skills:` plugin skill or agent that does the same job, whatever its name.

## Cloud sessions

`gh issue` and `gh pr` fail in cloud sessions because the GitHub proxy blocks GraphQL. Use the
built-in GitHub tools, or REST through `gh api repos/juangelrey/reelbase/...`.
