# Demo script: under three minutes

**Target runtime:** 2:50–2:59

**Format:** public YouTube screen recording with live audio
**Primary frame:** deployed `?demo=1` page in ChatGPT's built-in browser

## 0:00–0:20 — The missing layer is intent

**On screen:** Open the clean demo. Keep the Collaboration Contract and Delegation Session mastheads visible.

**Narration:**

> Browser agents are gaining precise tools, but permission alone does not say what I want done now, where the work may happen, or when the agent must stop. In chemistry, that gap can turn help into answer-taking—or let stale actions touch the wrong mechanism state.

## 0:20–0:42 — Make maximum permission executable

**On screen:** Show Coach at **16 / 21**. Select Collaborate while keeping learner-only commits; show **20 / 21** in the page and Site Tools menu.

**Narration:**

> My Collaboration Contract sets the maximum role. Collaborate exposes revision-bound editing, but I keep final commits for myself. The browser's WebMCP surface changes live, and there is no Site Tool that can change this contract.

## 0:42–1:02 — Grant one bounded job

**On screen:** Select **03 · SN2 + proton transfer**. Choose **Coauthor this step**, four actions, then start. Show **15 / 21**, exact scope, and zero of four spent.

**Narration:**

> Now I grant one job: coauthor only this step, on this exact problem, state, and revision, for four actions. The page freezes the allowed subset. Later permission changes cannot silently widen it, and the agent cannot start, renew, or end the session.

## 1:02–1:28 — Act semantically, fail honestly

**On screen:** Paste the prompt. Agent calls `get_delegation_session`, `get_mechanism_state`, adds `lp_n_attack_1 → c_methyl`, and calls `check_draft_step`.

**Narration:**

> Session and proof reads are unmetered evidence controls. The first work action reads stable atoms, bonds, lone pairs, and revision directly from the page. The second adds one semantic arrow. The third asks the deterministic validator, which correctly reports that this concerted substitution is incomplete.

## 1:28–1:51 — Prepare a handoff, then close capability

**On screen:** Agent calls `propose_draft_arrows` for `bond_c_br → br_leaving`. Show the proposal and session change to **Action budget spent · 3 / 21 tools**.

**Narration:**

> The fourth action stages the missing bond-breaking arrow outside my draft. That automatically spends the budget. WebMCP discovery collapses to three evidence controls, so “stop” is enforced by the page instead of left to model obedience.

## 1:51–2:13 — Prove intent against execution

**On screen:** Agent calls `get_agent_action_receipts`. Show action 1/4 through 4/4 in the ledger; briefly open exact session surface if useful.

**Narration:**

> The same page-side receipts are visible to me and readable by the agent. They bind actual callback execution to the fixed session, action ordinal, contract, semantic IDs, and before-and-after state—without retaining prompts, rationales, raw payloads, or identity.

## 2:13–2:36 — Return control to the learner

**On screen:** Select **End session · restore contract surface**; show **20 / 21**. Select **Add to my draft**. Ask the agent to check the complete step, then select **Commit checked step** yourself.

**Narration:**

> Only my visible action can restore the broader contract. I accept the structured proposal, preserving agent authorship and learner consent as different events. The agent checks the complete bundle, but my learner-only commit consumes the current validation token and advances the chemistry.

## 2:36–2:55 — Inspect proof, not prose

**On screen:** Call `compare_reached_step`, then `replay_reached_step`. Show the bond break, bond formation, charges, and performed arrows.

**Narration:**

> The reached graph delta and electron-flow replay come from the same committed state, not the model's explanation, and neither applies chemistry again. Mechanism Canvas is chemistry today—and a reusable intent, capability, and execution contract for trustworthy visual collaboration.

## First agent prompt

> Use this page's Site Tools and keep every change visible. Read the active delegation session, then read the current mechanism state. Confirm that the session is bound to ammonia_alkylation_01, has four metered actions, excludes commits and exercise switching, and cannot be widened through a Site Tool. Add only lp_n_attack_1 → c_methyl, check the intentionally incomplete first step, then use propose_draft_arrows to stage only bond_c_br → br_leaving with a short rationale. After that fourth work action closes the budget, call get_agent_action_receipts with afterSequence 0 and limit 12. Distinguish the session-bound receipt evidence from your explanation, then stop for my decision.

## Recording checklist

- Use the deployed HTTPS `?demo=1` URL, not localhost or saved practice.
- Show the exact capability sequence in both page and Site Tools menu: **16 → 20 → 15 → 3 → 20** of 21.
- Keep learner-only commits enabled throughout.
- Select the ammonia capstone before starting the problem-bound session.
- Use a four-action Coauthor session.
- Show `get_delegation_session` does not spend an action.
- Show one intentionally incomplete deterministic check.
- Show proposal staging does not mutate the draft or mechanism revision.
- Show the fourth work call closes the session surface automatically.
- Show session-bound receipt ordinals 1/4 through 4/4 and an unmetered receipt read.
- End the session only through the visible learner action.
- Select **Add to my draft** and **Commit checked step** yourself.
- End on reached comparison and replay.
- Record at 1440 × 900 or a similar desktop size, browser zoom 100%, with audible narration.
- Confirm the public video is under three minutes before submitting.
