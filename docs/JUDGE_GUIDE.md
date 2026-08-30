# Judge guide

Mechanism Canvas is a proof-carrying visual tutor. The learner controls what an agent can discover and do; WebMCP publishes that exact capability surface; the deterministic app retains authority over chemistry.

## Fastest live path

1. Open <https://mihirduvedi.github.io/mechanism-canvas/?demo=1> in ChatGPT's built-in browser. The demo uses memory only, so it starts clean without erasing saved practice.
2. The page starts in **Coach** mode. Confirm the contract shows **14 / 19 tools**, open the Site Tools menu, and ask the agent to call `get_collaboration_contract`.
3. Select **Collaborate** but leave **Only I can commit checked steps** enabled. Confirm the page and Site Tools menu update to **18 / 19 tools**. This proves live capability discovery; no Site Tool can widen the contract.
4. Paste the first prompt below.
5. When the proposal appears, select **Add to my draft**. Ask the agent to check the complete draft, then select **Commit checked step** yourself because the commit tool remains absent.
6. Keep the contract receipt, molecular canvas, proposal gate, and activity trail visible during the flow.

> Use this page's Site Tools and keep every change visible. Read the collaboration contract and clean demo state, confirm that direct editing is enabled but commits are learner-only, then switch to ammonia_alkylation_01. Add only lp_n_attack_1 → c_methyl and check the incomplete first step; explain the validator's result briefly. Use propose_draft_arrows to stage only bond_c_br → br_leaving with a short rationale. Confirm that staging did not change the draft or mechanism revision, then stop for my decision.

After selecting **Add to my draft**, ask:

> Read the current state again and check the complete draft. Confirm that it is valid, that you cannot call commit_checked_step under my contract, and stop for me to commit it.

Select **Commit checked step**, then continue:

> Call compare_reached_step for amine_reactants → methylammonium_intermediate, summarize the exact bond and charge changes, then call replay_reached_step for the same pair. Return to the current intermediate if needed. Add lp_n_base_1 → h_transfer and bond_n_attack_h_transfer → n_attacker, check the complete proton-transfer step, and stop for my commit.

Select **Commit checked step** again. Then ask the agent to read the shared activity trail and undo only the last commit.

Finish with the new cross-exercise loop:

> Call get_learning_profile and summarize only the evidence it returns, without calling it mastery. Then call propose_practice_plan with the current profile revision and up to three recommended exercise IDs. Explain that the plan did not switch exercises or change chemistry, then stop for my decision.

The learner—not the agent—can now select **Start this plan** in the visible Practice Compass.

Current ChatGPT documentation says Site tools work in the desktop app's built-in browser with supported models and may depend on account rollout. The full interface remains usable when `document.modelContext` is unavailable.

## What the sequence proves

| Moment | Evidence on screen | WebMCP point |
|---|---|---|
| Coach contract | The page and Site Tools menu show 14 of 19 tools; direct editing and commits are absent. | The learner's page controls capability discovery instead of relying on a prompt instruction. |
| Collaborate contract | Selecting one native radio changes the live surface to 18 tools while commit remains absent. | Abortable registrations publish a new WebMCP surface; the store repeats the same authorization checks. |
| Contract read | `get_collaboration_contract` returns the mode, hint ceiling, commit boundary, revision, and exact enabled names. | The agent can reason about its permissions, but no Site Tool can expand them. |
| State read | The agent discovers six exercises, including a two-step capstone, and the current revision. | The page exposes domain state rather than forcing screenshot inference. |
| Problem switch | The visible exercise changes to **Build methylamine in two steps**. | A tool reuses the same store and persistence path as the native selector. |
| Partial first step | One N → C arrow appears and the validator reports an incomplete concerted substitution. | The agent can test a partial hypothesis without receiving a hidden solution. |
| Reviewable proposal | The agent stages the missing C–Br → Br arrow in a separate panel; the draft and revision do not change until the learner accepts it. | `propose_draft_arrows` creates a real human-agent handoff. There is intentionally no site tool that can approve the proposal. |
| Learner approval | The learner selects **Add to my draft** and the proposed arrow appears with agent provenance. | Human consent, agent authorship, and deterministic validation remain distinct events in the same store. |
| First commit | The learner selects **Commit checked step** and the canvas advances to charged methylammonium bromide plus ammonia. | The agent can check, but the contract omits commit; deterministic app logic consumes the valid token after a visible learner action. |
| Reaction Diff | The learner opens a side-by-side structure comparison while the agent reads the same bond, charge, and lone-pair deltas. | `compare_reached_step` reuses one pure comparison engine and rejects any pair not listed as active reached evidence. |
| Electron Flow Replay | The same performed curved arrows replay over the reached before-state without applying chemistry again. | `replay_reached_step` presents only the exact active commit requested and leaves revision, activity, and persistence unchanged. |
| History comparison | The agent shows reactants, returns to the current intermediate, and never unlocks products early. | `view_mechanism_history_state` changes only the visible review state, not chemistry or revision. |
| Second commit | Two proton-transfer arrows advance the same mapped atoms to methylamine plus ammonium bromide after a second learner commit. | Each elementary step has separate agent assistance, deterministic validation, and learner authority. |
| Activity read | Human, agent, validator, history-view, and commit events match the visible trail. | The collaboration record is structured and inspectable. |
| Undo | Only the second commit reverses; the exact charged intermediate returns. | Multi-step agent writes remain controlled and recoverable in LIFO order. |
| Practice Compass read | Exact checks, hints, and completed steps become a local evidence map and ranked next-practice list. | `get_learning_profile` turns prior interaction into useful cross-exercise context without identities, cloud data, or authored answers. |
| Practice-plan handoff | An ordered plan appears without switching the exercise or changing chemistry. | `propose_practice_plan` is bound to an evidence revision; there is intentionally no Site Tool that can start it. |
| Learner starts plan | The first planned exercise opens only after the visible **Start this plan** action. | Agent recommendation and learner authority remain separate, inspectable events. |

## Manual fallback

In an ordinary browser, open the clean demo and select **03 · SN2 + proton transfer**. For step 1, click N1's lone pair then C1, and the C–Br bond then Br1. Check and commit to reach methylammonium bromide. Open **Step evidence**, confirm the C–Br break, C–N formation, and N1/Br1 charge and lone-pair changes, then select **Replay electron flow**. Close it, use the timeline to view **Reactants**, return to the current intermediate, then complete step 2 with N2's lone pair → H1 and the N1–H1 bond → N1. Check and commit. Compare step 2, then **Undo commit**; products must relock and only step 1 may remain comparable. Refreshing the demo starts it clean again; the normal saved workspace is separate.

This fallback proves the human experience and shared command layer. It does not count as live WebMCP verification.

## Architecture in one sentence

Reviewed fixtures, the React interface, a learner-owned 9–19-tool WebMCP surface, v6 local persistence, deterministic validation, cross-exercise evidence, provenance, comparison and replay, history navigation, and the 3D inspector all converge on one `MechanismStore`.

The most important guardrails are visible in code and behavior:

- Every mutating tool uses the current `mechanismRevision`.
- The Collaboration Contract is editable only in the learner-facing page; changing it republishes the permitted tool surface and does not change chemistry revision.
- Store commands independently reject forbidden agent calls with `LEARNER_CONTROLLED`, including calls retained from an older surface.
- Agent hint requests cannot exceed the learner's ceiling, and human hint controls remain available.
- `commit_checked_step` is absent unless Collaborate mode and explicit shared-commit permission are both active.
- A staged proposal is bound to the current problem, state, and revision; it cannot change the draft or be approved through WebMCP.
- A staged practice plan is bound to the current evidence revision; it cannot switch exercises, change chemistry, count progress, or be approved through WebMCP.
- Learner acceptance adds the proposal as agent-authored draft arrows, increments the revision once, and still grants no validation or commit authority.
- Editing a draft invalidates its previous check.
- A commit requires a valid check token bound to the exact revision and arrow signature.
- Reset is destructive and requires both explicit confirmation and a current revision.
- Tool actions appear in the same activity trail as learner actions.
- History navigation permits only reached states, leaves chemistry and revision unchanged, and makes the canvas read-only until the current step is restored.
- Reached-step comparison and `compare_reached_step` accept only active committed transitions, return the same deterministic graph delta, and never add activity or change revision.
- Electron Flow Replay and `replay_reached_step` present only the performed arrows from an active commit. Replay is transient UI state, not a chemistry transition, and reduced-motion users receive the complete static bundle.
- Refresh restores work but never restores validation authority.
- `?demo=1` uses an in-memory store, advertises that session mode through `get_mechanism_state`, and never touches the saved workspace.

## Honest boundary

All six fixtures are chemistry reviewed and enter the production catalog. They also pass automated structural checks, charge-conservation checks, authored-transition checks, negative-case checks, store tests, and tool-journey tests. Review status and automated verification remain separate metadata and evidence layers.

The 3D view is explanatory. It does not claim quantum chemistry, molecular dynamics, conformer prediction, kinetics, or reaction energetics.
