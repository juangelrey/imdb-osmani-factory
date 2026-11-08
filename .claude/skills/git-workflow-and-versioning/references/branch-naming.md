# Branch naming

The one rule for every branch an agent creates.

1. When resuming work, reuse the branch that holds it, while its PR is open or it has none.
2. Otherwise, if your instructions assign this session a branch, use it and create none.
3. Otherwise create it from the remote's latest `main`, replacing any same-named branch whose PR has merged or closed:
   - one ticket: `<N>-<short-slug>`, where N is the ticket number
   - a whole plan: `plan-<N>`, where N is the plan issue number
   - anything else: `<short-slug>`
