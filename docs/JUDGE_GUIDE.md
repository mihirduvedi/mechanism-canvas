# Judge guide

Mechanism Canvas is a proof-carrying visual tutor. Its Counterfactual Mechanism Lab makes WebMCP collaboration visible: a learner opens an isolated sandbox, the agent tests competing chemistry through a dynamically registered multi-tool workflow, the deterministic validator supplies evidence, and only the learner can adopt the result.

## Fastest live path

1. Open <https://mihirduvedi.github.io/mechanism-canvas/?demo=1> in ChatGPT's built-in browser. The clean demo is memory-only and does not touch saved practice.
2. Confirm Coach starts at **16 / 26 tools** and no lab tools are discoverable.
3. In **Counterfactual Mechanism Lab**, keep **2 paths** selected and choose **Open isolated lab**. Confirm five tools appear dynamically and the page reports **21 / 26**.
4. In **Delegate one bounded job**, choose **Compare hypotheses**, select **6 metered actions**, and start. Confirm the surface contracts to **15 / 26** and is bound to `sn2_01`, `sn2_reactants`, main revision 0.
5. Paste the prompt below. Keep the Lab, Delegation Session, Live Run Observatory, Agent Proof Ledger, and Agent Proposal visible as the agent works.
6. The six metered calls are: set A, check A, set B, check B, compare, and recommend. Lab/session/contract/receipt reads are unmetered evidence controls.
7. Confirm Path A is **Incomplete path**, Path B is **Validator approved**, the comparison is visible, and the recommendation appears outside the main draft.
8. After recommendation, confirm **Action budget spent** and **4 / 26 tools**. Only the contract, session, lab, and receipt controls remain.
9. Confirm the Live Run Observatory reports **Journey proof complete**, **7 / 7**, Lab **0 → 6**, Main **0 → 0**, and Actions **6 / 6**. Its accepted-surface history should show **16 → 21 → 15 → 4**.
10. Compare `get_agent_action_receipts` with the visible ledger. The six work receipts must carry **Compare hypotheses session · action 1/6** through **action 6/6**, record incomplete then valid closed-world check evidence, and keep main revision 0.
11. Select **End session · restore contract surface**. The recommendation remains visible, and no Site Tool could end or widen the grant.
12. Select **Add to my draft**, ask the agent to check the complete main draft, then select **Commit checked step** yourself. End the lab when finished.

## First agent prompt

> Use this page's Site Tools and keep every change visible. Read the active delegation session and Counterfactual Lab. Confirm that the job has six metered actions, is bound to sn2_01 at main revision 0, and cannot change my draft. Use exactly six work calls: set Path A to only lp_o_1 → c_electrophile and check it; set Path B to lp_o_1 → c_electrophile plus bond_c_br → br_leaving and check it; compare A with B; then recommend only the validator-approved path with a short rationale. Read the proof receipts after the budget closes, distinguish lab revisions from the unchanged main revision, and stop for my decision.

After the learner ends the session and selects **Add to my draft**, ask:

> Read the current mechanism state and check the complete main draft. Confirm it is valid, that your lab recommendation did not commit chemistry, and stop for me to commit it.

Select **Commit checked step**, then optionally finish with:

> Compare and replay the reached sn2_reactants → sn2_products step. Summarize only the exact graph delta and explain why neither evidence action applies chemistry again.

## What the sequence proves

| Moment | Evidence on screen | WebMCP point |
|---|---|---|
| Lab closed | 16 of 26; no lab tools. | Tools are state-relevant, not permanently exposed. |
| Lab opened | 21 of 26; two empty paths and a sealed main revision. | One human action dynamically publishes a coherent tool family. |
| Explore grant | 15 of 26 bound to one purpose, problem, state, revision, and six actions. | Capability discovery encodes the learner's immediate intent. |
| Path A check | One arrow is incomplete. | The agent observes deterministic failure evidence instead of inventing correctness. |
| Path B check | The concerted two-arrow bundle is valid. | The agent can revise and test an alternative without contaminating the draft. |
| Comparison | Shared and branch-only arrows appear. | A multi-tool workflow carries structured evidence between calls. |
| Recommendation | Checked Path B enters Agent Proposal; main revision and draft remain unchanged. | Agent synthesis and human adoption are different application states. |
| Automatic expiry | The sixth action leaves four evidence controls. | The page enforces stop through discovery and callback guards. |
| Live Run Observatory | Seven claims pass; host batches show 16 → 21 → 15 → 4. | Registration and journey success are evidenced separately from model narration. |
| Proof receipts | Action 1/6 through 6/6 show lab 0 → 6 and main 0 unchanged. | Actual page execution—not model narration—proves effects. |
| Learner adoption | Only a visible learner action adds proposed arrows. | The Site Tool family has no accept, start-lab, end-lab, or commit shortcut. |

## Core invariants worth inspecting

- The complete catalog has 26 tools; the normal contract exposes 11–21, and an active lab exposes 12–26 depending on mode and commit choice.
- Lab branch writes never change the main draft, `mechanismRevision`, history, activity, or saved workspace.
- A recommendation requires a recorded `valid` deterministic check and still stages only a proposal.
- Active lab work drifts immediately if a human changes the problem, committed state, or main revision.
- The Explore grant is frozen at start. Later contract expansion cannot widen it.
- Every non-control call that begins execution spends one action, including a structured guard. Pre-canceled work spends nothing.
- Cached definitions outside the current surface are rejected before domain execution.
- Receipt schema version 4 adds only closed-world branch IDs, arrow counts, validator classifications, comparison counts, and learner-approval state beyond the existing lab stamps; prompts, rationales, raw inputs/outputs, validation tokens, and identity remain omitted.
- Surface history is recorded only after the host resolves the full registration batch. Manual projections and rejected refreshes are never presented as accepted WebMCP proof.
- `?demo=1` keeps chemistry, contract, lab, delegation, and receipts in memory and never touches saved practice.

## Manual fallback and honest boundary

In an ordinary browser, the same Lab, Collaboration Contract, Delegation Session, chemistry workspace, proposal gate, validator, and proof ledger render normally. A person can inspect those interfaces, but that does **not** prove WebMCP discovery or invocation.

The deployed path must show Site Tools in a compatible host exposing `document.modelContext`. If it reports **Manual mode**, do not substitute local simulated registration for live-host proof.

## Architecture in one sentence

Reviewed chemistry fixtures, one shared `MechanismStore`, tab-local Lab/delegation managers, a dynamically republished 3–26-tool WebMCP surface, a host-accepted surface recorder, deterministic validation, closed-world proof receipts, a seven-claim journey evaluator, and the same visible React workspace form one source of truth.

For the detailed contracts, see [COUNTERFACTUAL_MECHANISM_LAB.md](COUNTERFACTUAL_MECHANISM_LAB.md) and [WEBMCP_LIVE_RUN_OBSERVATORY.md](WEBMCP_LIVE_RUN_OBSERVATORY.md).
