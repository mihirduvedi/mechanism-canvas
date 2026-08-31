# Intent-Bound Delegation Sessions

Intent-Bound Delegation Sessions turn a broad Collaboration Contract into one temporary WebMCP job with a fixed purpose, exact mechanism scope, frozen tool grant, and finite action budget.

The learner—not the agent—starts and ends a session in the visible page. No Site Tool can create, widen, renew, or end it.

## Product problem

A permission such as “the agent may edit” is necessary but incomplete. It does not say what the learner wants done now, where the work may occur, or how much agent activity is reasonable before control should return.

This matters because WebMCP tools run with the page's live state and user context. The WebMCP specification's security discussion identifies misrepresentation of intent as a current trust gap: a tool description alone cannot prove that an invocation matches the user's actual purpose. Mechanism Canvas already records page execution in the Agent Proof Ledger; delegation sessions add the missing intent boundary in front of that execution.

The result is one inspectable chain:

1. **Intent:** the learner chooses a fixed job and action budget.
2. **Capability:** the page republishes only the intersection of that job and the existing Collaboration Contract.
3. **Execution:** each real work call spends one action and carries the session ID, preset, scope, and action ordinal into its proof receipt.

## Learner flow

1. Choose a Collaboration Contract. It remains the maximum permission boundary.
2. Choose one delegation purpose:
   - **Inspect this step:** state, entity, history, comparison, replay, activity, and focus tools.
   - **Diagnose my draft:** Inspect plus deterministic checking and contract-capped hints.
   - **Coauthor this step:** Diagnose plus reviewable arrow proposals and direct add/remove only when the Collaboration Contract already permits those tools.
3. Choose a four-, six-, or eight-action budget.
4. Start the session. The grant freezes against the active problem, committed state, mechanism revision, and current contract surface.
5. Watch the remaining budget, exact discoverable tools, and session-bound proof receipts.
6. End the session to restore the broader Collaboration Contract surface.

The session is memory-only in the current tab and resets on refresh. It never enters saved practice, the learning record, or the v6 workspace schema.

## Exact capability model

The normal catalog contains 21 top-level imperative Site Tools:

- Observe: 11;
- Coach: 16 by default, or 15 with agent hints disabled;
- Collaborate: 20 with learner-only commits, or 21 when the learner explicitly shares commit authority.

Starting a session applies a second intersection. Under Collaborate with learner-only commits, the exact active surfaces are:

| Purpose | Discoverable tools | What is deliberately absent |
|---|---:|---|
| Inspect | 10 | learning profile, plans, drafting, checks, hints, switching, commit, undo, reset |
| Diagnose | 12 | learning profile, plans, proposals, direct editing, switching, commit, undo, reset |
| Coauthor | 15 | learning profile, practice plans, switching, commit, undo, reset |
| Exhausted or drifted | 3 | every work tool; only contract, session, and proof-receipt reads remain |

The three evidence controls are always unmetered:

- `get_collaboration_contract`;
- `get_delegation_session`; and
- `get_agent_action_receipts`.

Every other invocation that enters page execution spends one action, including a deterministic guard or invalid input. An already-canceled callback spends nothing because the page does not begin the requested work.

## Freeze, shrink, and drift invariants

- The grant is computed once from `delegation preset ∩ Collaboration Contract` and frozen at session start.
- A later contract restriction can shrink the active intersection.
- A later contract expansion cannot add tools to the frozen session. The learner must end it and start a new grant.
- A cached tool callback outside the frozen session is rejected centrally with `DELEGATION_TOOL_BLOCKED`, even if a host still holds the old JavaScript definition.
- Spending the final action changes the session to `exhausted` and republishes the three-control evidence surface.
- A human change to problem, committed state, or mechanism revision changes the session to `drifted` immediately and republishes the same three-control surface.
- A permitted agent edit does not invalidate its own session. The wrapper marks the call in flight, lets the shared store execute, and advances the session's expected revision after the call finishes.
- Commit, problem switching, reset, undo, learning-profile reads, and practice-plan staging are excluded from every preset. A bounded step job cannot silently become a cross-exercise or destructive workflow.

## WebMCP integration

`registerMechanismCanvasTools` now derives its registration signature from both the Collaboration Contract and delegation surface. It aborts the prior registrations and republishes the exact new set whenever either boundary changes.

The central instrumentation wrapper runs in this order:

1. capture the mechanism and contract state stamp;
2. honor pre-execution cancellation;
3. ask the delegation manager whether the named tool may begin;
4. reject stale, exhausted, or out-of-purpose cached calls before domain execution;
5. execute the original tool through the existing shared store;
6. append the privacy-minimized receipt with delegation evidence; and
7. advance the session revision and budget state.

`get_delegation_session` returns the fixed purpose, status, exact scope, budget, actions used and remaining, frozen grant, current effective tools, persistence boundary, and learner-control statement. The same summary is included in `get_mechanism_state`.

## Receipt and privacy contract

Agent Proof Ledger schema version 2 adds one optional fixed-structure `delegation` object:

```ts
interface DelegationReceiptEvidence {
  sessionId: string;
  presetId: "inspect" | "diagnose" | "coauthor";
  presetLabel: string;
  statusAtStart: "active" | "exhausted" | "drifted";
  problemId: string;
  stateId: string;
  actionNumber: number | null;
  actionBudget: number;
}
```

No freeform learner intent, prompt, rationale, raw input, raw output, validation token, or identity is added. Control reads use `actionNumber: null`; metered calls record the exact one-based action ordinal.

## Judge proof

1. Open the clean demo: Coach shows 16 of 21 tools.
2. Select Collaborate while keeping learner-only commits: 20 of 21 tools.
3. Open the two-step ammonia exercise, select **Coauthor this step**, choose four actions, and start the session: 15 of 21 tools.
4. Call `get_delegation_session`; confirm it is unmetered and no Site Tool can widen the grant.
5. Use exactly four work calls: read state, add one N → C arrow, check the incomplete step, and stage the missing C–Br → Br arrow.
6. The fourth call closes the budget and the browser surface contracts to 3 of 21 tools.
7. Call `get_agent_action_receipts`; it remains available and returns matching session IDs and action ordinals without spending an action.
8. End the session in the page. The 20-tool learner-only Collaborate surface returns; no agent call can perform this restoration.

This sequence makes WebMCP itself visible: one learner action changes capability discovery, every permitted call carries intent evidence, and the page closes the work surface without trusting the model to stop itself.

## Verification boundary

Automated coverage verifies preset intersection and non-widening, agent-authored revision following, immediate human drift, unmetered controls, exhaustion, restoration, adaptive registration, cached-tool rejection, pre-canceled non-consumption, exact action ordinals, and receipt readback.

Rendered QA must separately verify the no-session, active, exhausted, and drifted UI states; exact tool counts; keyboard operation; narrow reflow; enlarged text; forced colors; and the running browser's console. Local registration tests do not prove that a particular ChatGPT account or host exposes `document.modelContext`.

## Source map

- Session domain and invariants: `src/webmcp/delegation-session.ts`
- Active tab-local manager: `src/webmcp/active-delegation-session.ts`
- Registration, guards, and `get_delegation_session`: `src/webmcp/register-tools.ts`
- Receipt schema version 2: `src/webmcp/tool-receipt-ledger.ts`
- Learner interface: `src/components/DelegationSession.tsx`
- Receipt display: `src/components/AgentProofLedger.tsx`
- Domain and integration tests: `src/webmcp/delegation-session.test.ts`, `src/webmcp/register-tools.test.ts`

## References

- [WebMCP specification: security and privacy considerations](https://webmachinelearning.github.io/webmcp/#security-privacy)
- [Official OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
