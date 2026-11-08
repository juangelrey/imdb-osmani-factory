---
name: doubt-driven-development
description: Subjects a high-risk decision to a fresh-context adversarial review before it stands. Use when /as-build flags a ticket as high-risk, or when the user asks to stress-test a decision, plan or piece of code.
---

# Doubt-Driven Development

Run it from the main session, since step 3 spawns a subagent.

## The Process

1. **CLAIM.** Name the decision in two or three lines: what stands, and why it matters if it's wrong. If you can't write it that compactly, you have a vibe, not a decision.
2. **EXTRACT.** Isolate the smallest reviewable unit: the **artifact** (the diff or function, or the proposal in 3–5 sentences) and the **contract** (the acceptance criteria or constraints it must satisfy). Strip your reasoning but keep the evidence: include any caller, guard or test that contradicts the claim. If the unit is too big to hold in one read, decompose it first.
3. **DOUBT.** Spawn a fresh subagent with exactly this prompt:

   ```
   Adversarial review. Find what is wrong with this artifact.
   Assume the author is overconfident. Look for:
   - Unstated assumptions
   - Edge cases not handled
   - Hidden coupling or shared state
   - Ways the contract could be violated
   - Existing conventions this might break
   - Failure modes under unexpected input

   Do NOT validate. Do NOT summarize. Find issues, or state
   explicitly that you cannot find any after thorough examination.

   ARTIFACT: <paste artifact>
   CONTRACT: <paste contract>
   ```

   Pass ARTIFACT + CONTRACT only, never the CLAIM: handing the reviewer your conclusion biases it toward agreement.
4. **RECONCILE.** The findings are data, not a verdict. Re-read the artifact against each one and classify it, first match wins:
   1. **Contract misread** — the contract you gave was unclear or incomplete. Fix the contract, re-classify next cycle.
   2. **Valid + actionable** — a real issue. Change the artifact, loop again.
   3. **Valid trade-off** — real, but fixing costs more than accepting. Record the trade-off so the user sees it.
   4. **Noise** — correct under context the reviewer lacked. Note it, and add that context to the contract if it would have prevented the flag.
5. **STOP.** Stop when the next cycle returns only trivial or already-considered findings, when the user says "ship it", or after 3 cycles. If substantive issues remain after 3 cycles, escalate to the user: the artifact may not be ready. If 3 cycles feels too few because the artifact is large, go back to step 2 and decompose it instead of adding cycles.
