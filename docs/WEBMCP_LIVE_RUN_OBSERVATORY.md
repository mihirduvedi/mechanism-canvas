# WebMCP Live Run Observatory

The Live Run Observatory is Mechanism Canvas's judge-visible WebMCP evidence surface. It connects three facts that previously lived in separate places: which capabilities page policy permits, which registration batch the host actually accepted, and whether a multi-tool agent journey produced the promised application effects.

It adds no new Site Tool and does not increase the 26-tool catalog. Its purpose is to make the existing WebMCP implementation inspectable without treating an inferred count, chat transcript, or model claim as execution proof.

## Product problem

The Collaboration Contract, Counterfactual Lab, and Intent-Bound Delegation already change the current WebMCP tool set. The page previously displayed the expected count, and the Agent Proof Ledger recorded callbacks, but a judge still had to connect those layers manually.

The Observatory makes that connection explicit:

1. **Contract** shows the permission-derived base surface.
2. **Page state** shows state-relevant additions such as an active Lab.
3. **Intent** shows the intersection with the learner's frozen delegation grant.
4. **Host** is attested only after every `registerTool` promise in that batch resolves.
5. **Journey eval** derives seven claims from actual, privacy-minimized callback receipts.

This follows Chrome's WebMCP guidance to register tools only when useful, test the complete tool list for an application state, verify information use across calls, update visible UI after completion, and evaluate full user journeys.

## Capability catalog and withdrawal reasons

`src/webmcp/tool-catalog.ts` is the ordered metadata catalog for the existing 26 tools. It groups them into state/proof, inspection/presentation, coaching/proposal, direct workspace, and Counterfactual Lab families. The catalog does not decide authority; `enabledToolNames` remains the registration policy source.

For each inactive capability, the visible catalog derives one concrete reason from current state:

- Lab closed or no longer active;
- Observe mode keeps work read-only;
- the hint ceiling is zero;
- direct editing is outside the current collaboration mode;
- commit remains learner-only;
- the capability is outside the frozen delegation purpose;
- the delegated scope drifted; or
- the action budget is spent.

The active/dormant state is textual and does not rely on color.

## Host surface flight recorder

`src/webmcp/capability-surface-recorder.ts` retains at most 12 tab-local registration events. A host event is appended only after the full batch resolves. It contains:

- a monotonic sequence and timestamp;
- the exact accepted tool names;
- exact added and withdrawn names relative to the prior accepted batch; and
- bounded contract, delegation, and Lab scope stamps.

Manual mode records only a projected policy surface and never creates a host event. A failed refresh preserves the last accepted event separately from the rejected projection.

Registration refreshes are coalesced across one browser task. This prevents the sixth Explore call from publishing a transient recommendation surface before delegation exhaustion finishes. The host receives the meaningful sequence **16 → 21 → 15 → 4**, rather than redundant or intermediate batches. If a scope stamp changes without changing the tool names, the current definitions remain because every callback reads the live managers and store at execution time.

## Receipt schema version 4

The Agent Proof Ledger export advances to schema version 4. Lab work receipts may add a closed-world `evidence` object containing only:

- fixed branch IDs;
- arrow count for a branch-set call;
- the validator's classification enum for a branch check;
- fixed compared branch IDs and shared/unique arrow counts; and
- whether a recommendation is waiting for learner approval.

Prompts, rationales, validation summaries, raw inputs, raw outputs, validation tokens, authored answers, and identity remain omitted. The new evidence is shown on receipt cards and powers the journey evaluator; it is not a second chemistry result.

## Seven-claim Explore evaluator

`buildLatestExploreRunReport` groups the latest retained Explore receipts by delegation session ID and evaluates:

1. every work call stayed on one frozen problem/state scope;
2. two distinct branches were built;
3. a non-valid check was followed by a valid check;
4. the checked branches were compared in a separate call;
5. a valid branch was staged for learner approval;
6. every metered call left the main draft and mechanism revision unchanged; and
7. action ordinals 1 through the finite budget are all accounted for.

All seven must pass for **Journey proof complete**. A partial run remains **Run in progress**. A closed budget with missing claims, or any rejected/failed/canceled work call, becomes **Run needs review**. This is a deterministic page-effects evaluation, not a score for agent prose or chemistry reasoning outside the recorded calls.

## Judge path

In the clean Coach demo:

1. The Observatory starts as 16-policy-tool preview or a 16-tool host-attested surface.
2. Opening the Lab produces 21 and records five additions.
3. Starting Explore produces 15 and records six withdrawals.
4. The six work callbacks advance the report from pending to 7 / 7 proved.
5. Recommendation plus budget exhaustion produces four controls and records eleven withdrawals.
6. The report shows lab revision 0 → 6, main revision 0 → 0, and actions 6 / 6.
7. Ending the session and Lab restores 17 then 16, with corresponding accepted surface events.

## Verification boundary

Automated integration tests use a faithful `registerTool` context and verify the accepted count sequence, exact surface diffs, structured receipt evidence, and complete seven-claim report. Rendered local QA may install a temporary page-only adapter to execute those callbacks and inspect UI behavior; this proves application registration and rendering but not availability for a deployed account.

Only a compatible deployed host that exposes `document.modelContext` is live WebMCP proof. Manual mode, source inspection, unit tests, and the local adapter remain explicitly separate evidence layers.

## Source map

- Tool metadata and withdrawal copy: `src/webmcp/tool-catalog.ts`
- Accepted-surface recorder: `src/webmcp/capability-surface-recorder.ts`
- Registration integration and coalescing: `src/webmcp/register-tools.ts`
- Receipt schema and closed-world Lab evidence: `src/webmcp/tool-receipt-ledger.ts`
- Explore journey evaluator: `src/webmcp/webmcp-run-report.ts`
- Visible Observatory: `src/components/WebMcpObservatory.tsx`
- Responsive/forced-color styling: `src/index.css`
- Contract tests: `src/webmcp/capability-surface-recorder.test.ts`, `src/webmcp/webmcp-run-report.test.ts`, `src/webmcp/tool-receipt-ledger.test.ts`, and `src/webmcp/register-tools.test.ts`

## References

- [WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Evals for WebMCP](https://developer.chrome.com/docs/ai/webmcp/evals)
- [Build user workflows with WebMCP](https://developer.chrome.com/docs/ai/webmcp/build-tools)
