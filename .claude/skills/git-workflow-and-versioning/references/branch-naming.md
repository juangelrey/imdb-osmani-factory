# Branch naming

The one rule for every branch an agent creates.

1. If the session already has an assigned branch, for example one set by the environment, use it and create none.
2. Otherwise create it from `main`:
   - one ticket: `<N>-<short-slug>`, where N is the ticket number
   - a whole plan: `plan-<N>`, where N is the plan issue number
3. When resuming work, reuse the branch that already exists.
