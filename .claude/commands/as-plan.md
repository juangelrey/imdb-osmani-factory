---
description: Break work into small verifiable tasks with acceptance criteria and dependency ordering
disable-model-invocation: true
---

Invoke the planning-and-task-breakdown skill.

Read the open `prd` issue and the relevant codebase sections. Then:

1. Enter plan mode — read only, no code changes
2. Identify the dependency graph between components
3. Slice work vertically (one complete path per task, not horizontal layers)
4. Write tasks with acceptance criteria
5. Add checkpoints between phases
6. Present the plan for human review

Save the plan as an open issue labeled `plan`, then create one issue labeled `ticket` per task. Create either label first if it does not exist. Do not create tasks/plan.md or tasks/todo.md.

If an open `plan` issue already exists with open tickets for different work, stop and ask before writing — never silently overwrite an incomplete plan.
