# Demo script: under three minutes

**Target runtime:** 2:50–2:59
**Format:** public YouTube screen recording with live audio
**Primary frame:** deployed `?demo=1` page in ChatGPT's built-in browser

## 0:00–0:20 — The real problem

**On screen:** Open the clean demo. Keep the Collaboration Contract and the first molecular canvas in view.

**Narration:**

> AI tutors can explain a picture or finish a problem, but they struggle to share control of exact visual work. In chemistry, every dot, bond, arrow, charge, and coupled move has semantic meaning. Coordinates are not enough—and asking a model not to give away the answer is not an enforceable boundary.

## 0:20–0:45 — Make learner agency executable

**On screen:** Show Coach mode at **14 / 19 tools** and briefly open the Site Tools menu. Ask the agent to call `get_collaboration_contract`. Select **Collaborate** while leaving **Only I can commit checked steps** enabled; show the receipt and menu update to **18 / 19**.

**Narration:**

> This learner-owned contract changes what the browser agent can discover. Coach exposes bounded checks and proposals. Collaborate adds direct revision-bound editing, but I am keeping final commits for myself. The Site Tool surface updates live, and there is no tool that can expand its own permissions.

## 0:45–1:04 — Discover semantic chemistry

**On screen:** Paste the first judge prompt. Let the agent read state and switch to `ammonia_alkylation_01`. Show the two-step capstone and locked future states.

**Narration:**

> The agent reads stable atoms, bonds, lone pairs, revisions, and six reviewed exercises from the same page state I see. It selects a two-step capstone without guessing from pixels. Future states remain locked until the chemistry reaches them.

## 1:04–1:27 — Fail honestly, then stage a handoff

**On screen:** Agent adds only `lp_n_attack_1 → c_methyl`, calls `check_draft_step`, then stages `bond_c_br → br_leaving` through `propose_draft_arrows`. Keep the incomplete feedback and proposal visible.

**Narration:**

> One bond-forming arrow is incomplete because the carbon–bromine pair is unaccounted for. The deterministic validator catches that without revealing a hidden answer. The agent then stages the companion arrow outside my draft; the exact revision and chemistry stay unchanged while I decide.

## 1:27–1:48 — Separate agent work, learner consent, and correctness

**On screen:** Select **Add to my draft**. Ask the agent to check the complete step. Show that `commit_checked_step` is unavailable, then select **Commit checked step** yourself.

**Narration:**

> I accept the structured proposal, preserving agent authorship and learner consent as separate events. The agent can check the result, but my contract removed its commit tool. My visible commit consumes the current validation token and advances to the real charged intermediate.

## 1:48–2:08 — Inspect proof, not prose

**On screen:** Call `compare_reached_step`, open **Step evidence**, then call `replay_reached_step`. Show the C–Br break, C–N formation, charge changes, and performed arrows.

**Narration:**

> The page and agent read the same graph delta and replay only the arrows that were actually committed. This is reached evidence, not a model explanation and not a physical transition-state claim. Comparison and replay do not apply the chemistry again.

## 2:08–2:31 — Complete a second guarded step

**On screen:** Return to the intermediate. Agent adds `lp_n_base_1 → h_transfer` and `bond_n_attack_h_transfer → n_attacker`, checks, then stops. Select **Commit checked step** yourself.

**Narration:**

> A second separately checked move transfers the mapped proton to excess ammonia. Again, the agent can operate semantically and the validator can authorize the step, but the learner owns the final transition.

## 2:31–2:43 — Provenance and reversibility

**On screen:** Agent reads the activity trail, then calls `undo_last_commit`. Show the exact intermediate return while step one remains reached.

**Narration:**

> The shared trail records contract changes, human choices, agent actions, checks, and commits. Undo reverses only the last step while preserving the earlier evidence.

## 2:43–2:59 — Carry evidence forward

**On screen:** Agent calls `get_learning_profile` and stages a plan with `propose_practice_plan`. End on Practice Compass and the learner-only **Start this plan** action.

**Narration:**

> Finally, exact local evidence becomes a next-practice plan without claiming mastery or uploading identity. The agent can prepare the plan; only the learner can start it. Mechanism Canvas is chemistry today, and a reusable contract for trustworthy visual STEM collaboration next.

## First agent prompt

> Use this page's Site Tools and keep every change visible. Read the collaboration contract and clean demo state, confirm that direct editing is enabled but commits are learner-only, then switch to ammonia_alkylation_01. Add only lp_n_attack_1 → c_methyl and check the incomplete first step; explain the validator's result briefly. Use propose_draft_arrows to stage only bond_c_br → br_leaving with a short rationale. Confirm that staging did not change the draft or mechanism revision, then stop for my decision.

## Recording checklist

- Use the deployed HTTPS `?demo=1` URL, not localhost or saved practice.
- Show **14 / 19**, switch modes, then show **18 / 19** in both the page and Site Tools menu.
- Call `get_collaboration_contract` and state that no Site Tool can change it.
- Keep **Only I can commit checked steps** enabled for the entire recording.
- Show one intentionally incomplete deterministic check.
- Show that proposal staging leaves the draft and chemistry revision unchanged.
- Select **Add to my draft** and both **Commit checked step** actions yourself.
- Show **Chemistry reviewed**, reached-state evidence, one replay, and one undo.
- End on the Practice Compass learner-only plan gate.
- Record at 1440 × 900 or a similar desktop size with browser zoom at 100%.
- Confirm the public video has audible narration and runs under three minutes before submitting.
