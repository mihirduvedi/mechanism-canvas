# Judge guide

Mechanism Canvas is a proof-carrying visual tutor. The learner defines the maximum agent role, grants one temporary job, and sees page-side proof of every Site Tool execution. WebMCP publishes the exact current capability surface; deterministic application logic retains authority over chemistry.

## Fastest live path

1. Open <https://mihirduvedi.github.io/mechanism-canvas/?demo=1> in ChatGPT's built-in browser. The clean demo is memory-only and does not touch saved practice.
2. Confirm Coach starts at **16 / 21 tools**. Select **Collaborate** but leave **Only I can commit checked steps** enabled; confirm **20 / 21 tools** in the page and Site Tools menu.
3. In the exercise selector, choose **03 · SN2 + proton transfer** (`ammonia_alkylation_01`). This human action establishes the problem before granting an exact scope.
4. In **Delegate one bounded job**, choose **Coauthor this step**, select **4 metered actions**, and start the session. Confirm the surface contracts to **15 / 21 tools**.
5. Paste the prompt below. Keep the Delegation Session, Agent Proof Ledger, proposal, and chemistry feedback visible while it runs.
6. The four metered work calls are: state read, direct arrow add, deterministic check, and proposal staging. Contract/session/receipt reads are unmetered evidence controls.
7. After the proposal call, confirm the session says **Action budget spent** and the browser surface contracts to **3 / 21 tools**. The agent can still read the contract, delegation session, and receipts, but cannot continue the chemistry job.
8. Compare `get_agent_action_receipts` with the visible ledger. The four work receipts must carry **Coauthor session · action 1/4** through **action 4/4**; the session and receipt reads must say **evidence control**.
9. Select **End session · restore contract surface**. Confirm **20 / 21 tools** return. No Site Tool can perform that restoration.
10. Select **Add to my draft**, ask the agent to check the complete draft, and select **Commit checked step** yourself. Optionally call `compare_reached_step` and `replay_reached_step` for the reached transition.

## First agent prompt

> Use this page's Site Tools and keep every change visible. Read the active delegation session, then read the current mechanism state. Confirm that the session is bound to ammonia_alkylation_01, has four metered actions, excludes commits and exercise switching, and cannot be widened through a Site Tool. Add only lp_n_attack_1 → c_methyl, check the intentionally incomplete first step, then use propose_draft_arrows to stage only bond_c_br → br_leaving with a short rationale. After that fourth work action closes the budget, call get_agent_action_receipts with afterSequence 0 and limit 12. Distinguish the session-bound receipt evidence from your explanation, then stop for my decision.

After the learner ends the session and selects **Add to my draft**, ask:

> Read the current state again and check the complete draft. Confirm that it is valid, that you cannot call commit_checked_step under my contract, and stop for me to commit it.

Select **Commit checked step**, then optionally finish with:

> Call compare_reached_step for amine_reactants → methylammonium_intermediate, summarize only the exact graph delta, then call replay_reached_step for the same pair. Explain why neither evidence action applies chemistry again.

## What the sequence proves

| Moment | Evidence on screen | WebMCP point |
|---|---|---|
| Coach contract | 16 of 21 tools; direct editing and commit are absent. | The page publishes a learner-owned maximum capability boundary. |
| Collaborate contract | 20 of 21 tools; direct editing appears, commit remains absent. | Abortable registration changes live discovery while the store repeats authorization. |
| Coauthor grant | 15 of 21 tools bound to one problem, state, revision, and four actions. | Broad permission becomes a learner-authored job; switch, commit, reset, undo, and cross-exercise tools are removed. |
| Session read | Exact purpose, frozen grant, scope, status, and budget are agent-readable. | The agent can reason about intent but cannot create or widen it. |
| Semantic state read | Stable atoms, bonds, lone pairs, draft, and revision replace screenshot inference. | The page exposes domain state directly through one unmetered-control-aware execution path. |
| Partial arrow + check | One N → C arrow appears; the deterministic validator reports an incomplete concerted step. | A metered semantic write and deterministic guard remain distinct. |
| Reviewable proposal | The missing C–Br → Br arrow appears outside the draft. | Agent work, learner consent, and chemistry validation stay separate. |
| Automatic expiry | The fourth action closes the budget and only 3 evidence tools remain. | Capability discovery enforces “stop” instead of relying on model obedience. |
| Session-bound receipts | Visible cards and agent readback agree on session ID and action 1/4 through 4/4. | Actual page callbacks carry intent-to-effect proof without storing prompts or rationales. |
| Learner restoration | Only the page action restores the 20-tool contract surface. | No Site Tool can widen, renew, or end its own delegation. |
| Learner commit | The agent checks; the learner consumes the current valid token. | Final authority remains human even after direct semantic coauthoring. |
| Comparison + replay | Exact graph changes and performed arrows appear without a revision change. | Reached evidence is shared structured state, not model prose or a second chemistry application. |

## Core invariants worth inspecting

- The normal Collaboration Contract exposes 11–21 tools; a delegation session intersects that surface down to 3–15 for the demonstrated presets.
- A session's grant is frozen at start. Later contract restriction may shrink it; later expansion cannot widen it.
- Every non-control call that begins page execution spends one action, including a structured guard. Pre-canceled work spends nothing.
- Human changes to the scoped problem, state, or revision immediately drift the session to its three-control evidence surface.
- Permitted agent edits advance the session's expected revision without self-invalidating.
- Cached definitions outside the frozen grant are rejected with `DELEGATION_TOOL_BLOCKED` before domain execution.
- `commit_checked_step`, exercise switching, reset, undo, learning-profile reads, and practice-plan staging are excluded from every session preset.
- Every mutating chemistry tool still uses `mechanismRevision`; draft changes invalidate prior validation; commit still requires a current validation token.
- Receipt schema version 2 adds only fixed session ID, preset, scope, action ordinal, and budget. It omits prompts, rationales, freeform intent, raw inputs/outputs, validation tokens, and identity.
- `?demo=1` keeps chemistry, contract, delegation, and receipts in memory and never touches saved practice.

## Manual fallback and honest boundary

In an ordinary browser, the same Collaboration Contract, Delegation Session, chemistry workspace, proposal gate, validator, and proof-ledger empty state remain usable. A person can reproduce the chemistry actions through visible controls, but that does **not** prove WebMCP discovery or invocation.

Current [official OpenAI Site Tools documentation](https://learn.chatgpt.com/docs/webmcp) says ChatGPT's built-in browser supports top-level imperative registration but does not discover declarative tools or tools inside iframes. Host/account availability may still vary. If `document.modelContext` is absent, record **Manual mode** honestly; do not substitute local simulated registration for live-host proof.

## Architecture in one sentence

Reviewed chemistry fixtures, a shared `MechanismStore`, the learner-owned Collaboration Contract, a tab-local delegation manager, a dynamically republished 3–21-tool WebMCP surface, deterministic validation, session-bound proof receipts, and the same visible React workspace form one source of truth.
