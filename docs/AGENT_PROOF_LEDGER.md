# Agent Proof Ledger

The Agent Proof Ledger is Mechanism Canvas's page-side evidence layer for WebMCP execution. It makes the difference between a tool being described and a tool actually being invoked, guarded, and applied visible to both the learner and the agent.

## Product problem

A Site Tool schema can explain what a tool is intended to do, but a description alone cannot prove how a particular invocation behaved. The current WebMCP specification names this trust gap directly: tool descriptions are not behavioral proof, semantic ambiguity remains possible, and the protocol does not itself supply a verification mechanism. OpenAI's Site Tools guidance consequently recommends returning enough information for an agent to verify a result and keeping existing application validation in the execution path.

Mechanism Canvas already made permission and chemistry correctness executable through the Collaboration Contract and deterministic validator. The missing evidence was one continuous, user-visible answer to four questions:

1. Which Site Tool did the agent invoke?
2. Under which learner-owned contract did it run?
3. Did the page execute, reject, fail, or cancel it?
4. Which shared state changed, if any?

The ledger answers those questions without treating the agent's prose as evidence.

## Why this is WebMCP-native

The ledger wraps the actual `execute` callback of every registered Site Tool. It does not infer activity from button clicks, the chat transcript, or later store events. This gives it three properties a generic chat log cannot provide:

- it observes reads and presentations that correctly leave the domain store unchanged;
- it records page guard rejections even when no activity event is added; and
- it pairs the invocation with state stamps taken immediately before and after the page executes it.

The same retained receipts power the visible React surface, JSON export, and the read-only `get_agent_action_receipts` Site Tool. There is no separate agent-only evidence store.

## Receipt contract

Each receipt contains:

- a tab-session ID and monotonic sequence number;
- the exact registered tool name and one closed-world kind: `read`, `present`, `propose`, or `write`;
- one of four outcomes: `succeeded`, `rejected`, `failed`, or `canceled`;
- a bounded semantic intent summary and stable entity IDs when applicable;
- a structured error code only when the page returned one;
- start time, completion time, and measured duration;
- before and after stamps for problem, reached state, mechanism revision, activity sequence, draft count, collaboration mode, and contract revision; and
- derived booleans for problem, chemistry, draft, activity, and contract changes.

The outcome language is deliberately evidence-specific:

- **Verified** means the page returned a successful result. A read can be verified while correctly leaving every state stamp unchanged.
- **Guarded** means the page returned a structured `ok: false` result, such as a stale revision or learner-owned boundary.
- **Failed** means execution threw before returning a structured result.
- **Canceled** means the supplied abort signal was already canceled before the page began execution.

These labels do not claim that ChatGPT's reasoning was correct or that a successful tool produced pedagogically ideal work. They prove only the page execution facts represented by the receipt.

## Privacy and retention boundary

The ledger is memory-only and scoped to the current tab. It is not written to local saved practice, sent to a backend, or restored on refresh. At most 60 receipts are retained; older receipts are evicted in sequence order.

Receipt creation deliberately omits:

- chat prompts and assistant messages;
- raw tool inputs and outputs;
- proposal rationales and learner reflections;
- accepted-answer definitions, unreached graphs, and validation tokens;
- learner identity; and
- state from other tabs or devices.

Intent summaries are generated from a closed-world tool map. Strings and ID lists are normalized, length-bounded, deduplicated, and capped. The export repeats this boundary in its metadata. A learner must explicitly choose **Download proof JSON** or **Copy proof JSON**; the page never uploads the record.

## Execution lifecycle

`registerMechanismCanvasTools` constructs the current adaptive catalog, then applies one central instrumentation wrapper to every definition before registration. The wrapper:

1. captures a state stamp and start time;
2. checks a supplied abort signal before execution;
3. invokes the original tool callback unchanged;
4. classifies structured `ok: false` results as guarded and thrown errors as failed;
5. captures the final state and appends exactly one bounded receipt; and
6. preserves the original successful result, structured rejection, or thrown error for the host.

The current WebMCP host can also cancel work without entering the page callback. The ledger cannot claim a receipt for code the page never received. It proves pre-execution cancellation only when the callback is invoked with an already-aborted signal.

`get_agent_action_receipts({ afterSequence?, limit? })` is available in every Collaboration Contract mode. It returns the next page of up to 30 retained receipts, `returnedThroughSequence` for forward pagination, a current aggregate summary, the latest prior sequence, the session ID, and the privacy and retention statements. Its own receipt is appended after its response is assembled, so that response does not recursively contain itself; the next incremental read can observe it.

## Learner interface

The Agent Proof Ledger is a full-width evidence surface immediately after the Collaboration Contract. Its empty state tells the learner how to produce the first receipt. Once tools run, it shows:

- verified and guarded totals;
- read/present and propose/write totals;
- the eight newest receipts with intent, result, outcome, contract, timing, and state proof;
- **Focus touched items** when a receipt's semantic IDs still belong to the visible state;
- explicit JSON download and copy actions; and
- a confirmation-protected clear action that cannot change chemistry, progress, or the shared activity trail.

The visible surface and agent-readable tool intentionally describe the same retained evidence. This lets a judge compare what the agent reports with what the learner can inspect on the page.

## Judge proof

1. Open `?demo=1`. The ledger starts empty because demo state and receipt state are both session-only.
2. Call `get_collaboration_contract` and `get_mechanism_state`. Two verified read receipts appear with unchanged chemistry revision.
3. In Collaborate mode with learner-only commits, switch exercises and add one arrow. The corresponding write receipts show the problem and revision transitions.
4. Check the incomplete bundle and stage a proposal. The ledger distinguishes deterministic checking from proposal staging and shows the proposal left chemistry revision unchanged.
5. Call `get_agent_action_receipts` with `afterSequence: 0`. Compare the returned structured evidence with the visible cards; then observe that the receipt read itself appears as the next card.
6. Optionally attempt a stale write in a controlled test. The page returns a structured guard and the ledger shows **Guarded**, with state remaining authoritative.
7. Download the privacy-minimized JSON and inspect its explicit schema, retention statement, state stamps, and omission boundary.

## Verification boundary

Automated tests cover privacy omission, bounded semantic summaries, before/after state evidence, outcome aggregation, the 60-receipt cap, clear and export behavior, successful and rejected real tools, incremental receipt reads, and pre-canceled execution. The full registration suite locks the adaptive 10–20-tool catalog.

Rendered browser QA separately covers the empty and populated ledgers, verified and guarded visual states, live receipt growth, JSON actions, confirmation-protected clearing, semantic focus, responsive stacking, keyboard operation, and horizontal overflow. These checks prove current implementation behavior; they do not claim host-level auditing outside the page callback.

## Source map

- Receipt schema, privacy minimization, store stamps, retention, and export: `src/webmcp/tool-receipt-ledger.ts`
- Central tool instrumentation and agent-readable receipt tool: `src/webmcp/register-tools.ts`
- Visible learner evidence surface: `src/components/AgentProofLedger.tsx`
- Responsive, forced-color, and interaction styling: `src/index.css`
- Ledger unit contracts: `src/webmcp/tool-receipt-ledger.test.ts`
- End-to-end tool-wrapper contracts: `src/webmcp/register-tools.test.ts`

## References

- [WebMCP specification: security and privacy considerations](https://webmachinelearning.github.io/webmcp/#security-privacy)
- [OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp)
