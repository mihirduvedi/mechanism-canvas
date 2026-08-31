# Counterfactual Mechanism Lab

The Counterfactual Mechanism Lab is Mechanism Canvas's WebMCP-native hypothesis workspace. A learner opens a temporary two- or three-path sandbox. An agent can then build competing electron-flow branches, check each with the production validator, compare their evidence, and recommend only a valid branch through the existing learner-review proposal gate.

The lab is deliberately not a second draft. Its branches are tab-local, revisioned, and isolated from saved practice, chemistry history, the activity trail, and the main `mechanismRevision`.

## Why this needs WebMCP

A useful agent must do more than produce one guessed answer. It must inspect exact molecular entities, construct alternatives, observe validator feedback, revise its hypothesis, compare evidence, and make a bounded handoff. Screenshots cannot provide stable lone-pair and bond IDs or distinguish a temporary branch from the learner's authoritative draft.

WebMCP lets the page publish exactly the tools relevant to the current lab state:

1. The learner opens a lab in the visible interface.
2. Five lab tools appear in live discovery.
3. The agent reads the exact scope and branch revision.
4. Branch writes and checks advance only `labRevision`.
5. A recommendation withdraws the four work tools and leaves the read control.
6. The learner—not a Site Tool—accepts or declines the staged proposal and closes the lab.

This is dynamic capability discovery tied to application state, not a fixed catalog with prompt-only instructions.

## Tools

| Tool | Effect | Main mechanism effect |
|---|---|---|
| `get_hypothesis_lab` | Reads scope, branches, checks, comparison, recommendation, and lab revision. | None |
| `set_hypothesis_branch` | Atomically replaces 1–4 arrows and the bounded rationale on one branch. | None |
| `check_hypothesis_branch` | Runs `validateDraftStep` on the sealed base draft plus one branch. | None |
| `compare_hypothesis_branches` | Requires two checked branches and records shared and unique arrows. | None |
| `recommend_hypothesis_branch` | Requires a checked `valid` branch and stages its arrows in Agent Proposal. | Proposal only; draft and revision unchanged |

All inputs use closed schemas with `additionalProperties: false`. Branch writes require the current `expectedLabRevision`; recommendation additionally requires the sealed `expectedMechanismRevision`.

## Isolation and drift invariants

- Only the visible page can start or end a lab.
- A lab seals the exact problem, committed state, main mechanism revision, and existing main-draft arrows.
- Branches may use only entity IDs present in that scoped molecule.
- One electron source cannot move twice in the same branch or conflict with a sealed base-draft arrow.
- Branch checks call the same deterministic validator used by the main workspace.
- A branch must have a recorded `valid` classification before it can be recommended.
- Recommendation stages a proposal; it does not add draft arrows, validate the main draft, or commit chemistry.
- Any human change to problem, state, or main revision while a lab is active marks it `drifted` and withdraws its work tools.
- A recommended or drifted lab retains only `get_hypothesis_lab` until the learner closes it.
- Lab state never enters saved workspace schema v6, the learning record, or local storage.

## Dynamic capability sequence

In the clean demo's default Coach contract:

| State | Discoverable tools |
|---|---:|
| No lab | 16 of 26 |
| Active lab | 21 of 26 |
| Active six-action Explore delegation | 15 of 26 |
| Recommendation + exhausted delegation | 4 of 26 |
| Delegation ended; recommendation still visible | 17 of 26 |
| Lab ended | 16 of 26 |

The Explore grant contains four evidence controls, seven inspection/presentation tools, and four lab work tools. Its intended six metered actions are set A, check A, set B, check B, compare, and recommend. Reading the lab, contract, delegation session, or proof receipts is unmetered.

## Proof receipts

Agent Proof Ledger schema version 4 retains the three lab state stamps and derived change flag, then adds only closed-world branch IDs, arrow counts, validator classifications, comparison counts, and learner-approval state. Receipt intent summaries still omit raw inputs, outputs, prompts, and rationales.

The Live Run Observatory groups the six metered receipts by delegation session and requires seven page-side claims before it reports Journey proof complete: fixed scope, two branches, non-valid then valid checks, separate comparison, validated recommendation, sealed main work, and complete action ordinals.

The judge path visibly proves that six agent actions can advance lab revision 0 → 6 while main mechanism revision and draft-arrow count stay unchanged. Recommendation may add an activity event and proposal, but it still cannot cross the learner's draft or commit boundary.

## Failure and recovery

The lab returns structured errors for inactive, drifted, stale, empty, unchecked, invalid, blocked, and malformed operations. The tool remains within the page's normal proof instrumentation, so rejected calls are visible and count against an active work budget when execution began. An agent can read current lab state, correct its arguments or hypothesis, and retry while budget remains.

## Judge path

1. Open the clean demo and show Coach at 16 / 26.
2. Open a two-path lab and show the surface expand to 21 / 26.
3. Start **Compare hypotheses** with six actions; show 15 / 26.
4. Set and check an intentionally incomplete one-arrow Path A.
5. Set and check the valid two-arrow Path B.
6. Compare the checked evidence, then recommend Path B.
7. Show the automatic 4 / 26 evidence-only surface and six lab-stamped receipts.
8. End the session, review the proposal, and let the learner adopt it.

## Verification boundary

Unit tests cover lifecycle, isolated writes, valid/incomplete checks, comparison, guarded recommendation, stale revisions, invalid entities, duplicate electron sources, and human drift. Registration integration covers the full 16 → 21 → 15 → 4 → 17 → 16 surface sequence, six action ordinals, proposal staging, and unchanged main chemistry. Browser QA separately proves rendered branches, responsive layout, visible state transitions, keyboard controls, and console health.

Local registration tests do not prove that a particular WebMCP host or account exposes `document.modelContext`; the deployed demo must still be verified in a compatible host.

## Source map

- Lab state and invariants: `src/webmcp/hypothesis-lab.ts`
- Active tab-local manager: `src/webmcp/active-hypothesis-lab.ts`
- Dynamic registration and tool schemas: `src/webmcp/register-tools.ts`
- Learner interface and molecular branch previews: `src/components/HypothesisLab.tsx`
- Explore preset: `src/webmcp/delegation-session.ts`
- Receipt schema version 4: `src/webmcp/tool-receipt-ledger.ts`
- Host registration and journey proof: `docs/WEBMCP_LIVE_RUN_OBSERVATORY.md`
- Domain and integration coverage: `src/webmcp/hypothesis-lab.test.ts`, `src/webmcp/register-tools.test.ts`

## References

- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP tool design guidance](https://developer.chrome.com/docs/ai/webmcp/build-tools)
- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Chrome WebMCP evaluation guidance](https://developer.chrome.com/docs/ai/webmcp/evals)
