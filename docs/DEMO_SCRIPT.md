# Demo script: under three minutes

**Target runtime:** 2:50–2:59
**Format:** screen recording with live narration
**Primary frame:** deployed app in ChatGPT's built-in browser, with the Site tools menu shown once near the start

## 0:00–0:18 — The problem

**On screen:** Open `?demo=1` to show the clean-session notice, then briefly focus an atom and a lone pair.

**Narration:**

> Organic chemistry mechanisms look like drawings, but every arrow carries exact meaning: which electron pair moved, where it went, and which bonds changed with it. A browser agent can see pixels. It cannot safely infer all of that structure from coordinates.

## 0:18–0:36 — The WebMCP idea

**On screen:** Open the Site tools menu and show the 18 available tools. Return to the page.

**Narration:**

> Mechanism Canvas gives the open page eighteen narrow site tools. The learner and the agent share one chemistry store, one canvas, one reaction timeline, and one local evidence map. The model never grades the chemistry.

## 0:36–0:58 — Discover the capstone

**On screen:** Ask the agent to read state and switch to `ammonia_alkylation_01`. Keep the two-step prompt and locked future states visible.

**Narration:**

> The agent discovers six authored exercises and selects a two-step capstone. Stable IDs describe two ammonia molecules, bromomethane, and one mapped hydrogen. The timeline exposes only states the learner has actually reached.

## 0:58–1:20 — Let an incomplete idea fail honestly

**On screen:** Agent adds `lp_n_attack_1 → c_methyl`, then calls `check_draft_step`. Keep the amber incomplete feedback visible.

**Narration:**

> First it adds only the bond-forming arrow. The deterministic check rejects that as incomplete because the carbon–bromine pair is still unaccounted for. Checking diagnoses the draft. It does not change the molecule.

## 1:20–1:42 — Hand the decision back to the learner

**On screen:** Agent calls `propose_draft_arrows` with `bond_c_br → br_leaving`. Show that the draft still contains one arrow and revision is unchanged. The learner selects **Add to my draft**.

**Narration:**

> Instead of silently completing the answer, the agent stages the companion move for review. The learner sees the exact electron source, target, and rationale, then decides whether it enters the draft. WebMCP cannot press this approval gate, and approval still does not grade the chemistry.

## 1:42–1:58 — Commit a real intermediate

**On screen:** Ask the agent to read the approved draft, check it, and commit with the returned validation ID.

**Narration:**

> The accepted proposal keeps agent authorship and learner consent visible as separate events. Only the deterministic check can issue the revision-bound token that advances the canvas to charged methylammonium bromide plus ammonia.

## 1:58–2:20 — Compare reached states

**On screen:** Agent calls `compare_reached_step` for the first transition while the learner opens **Step evidence**. Show the highlighted C–Br break and C–N formation, then call `replay_reached_step` and let the two performed arrows finish. Close the dialog, view `amine_reactants`, and return to the intermediate. Keep products locked.

**Narration:**

> The app and agent read the same exact bond, charge, and lone-pair delta, then replay the arrows the learner actually committed. The trace explains electron bookkeeping; it does not apply the chemistry again or claim to show a physical transition state. Comparison, replay, and history leave revision untouched and refuse future states.

## 2:20–2:39 — Finish and inspect the proof

**On screen:** Agent adds `lp_n_base_1 → h_transfer` and `bond_n_attack_h_transfer → n_attacker`, checks, commits, and reads the activity trail.

**Narration:**

> A second, separately checked step transfers the mapped proton to excess ammonia. Methylamine and ammonium bromide appear, while every agent, validator, history, and commit event remains visible in one structured trail.

## 2:39–2:49 — Reversibility

**On screen:** Agent calls `undo_last_commit`; show the exact intermediate return while the earlier commit remains reached.

**Narration:**

> Undo reverses only the last elementary step while keeping the earlier evidence intact.

## 2:49–2:59 — Turn evidence into next practice

**On screen:** Agent calls `get_learning_profile`, then `propose_practice_plan` with the returned profile revision and two recommended exercises. Show the visible Practice Compass plan and its unchanged chemistry. End on the learner-only **Start this plan** button.

**Narration:**

> Now the page turns exact checks into a private cross-exercise evidence map. The agent can stage what to practice next, but only the learner can start the plan. WebMCP adds continuity without taking away control.

## Recording checklist

- Start from the deployed HTTPS URL, not localhost.
- Start at `https://mihirduvedi.github.io/mechanism-canvas/?demo=1`; do not reset saved practice for the recording.
- Show the Site tools count and at least one real tool call source.
- Keep the proposal panel visible long enough to show that staging did not alter the draft or revision.
- Click **Add to my draft** yourself; do not use browser automation to bypass the learner-only gate.
- Keep the incomplete check and read-only history banner on screen long enough to read.
- Show the **Chemistry reviewed** badge and the reviewed-library footer at least once.
- End with the visible Practice Compass and its learner-only plan action.
- Record at 1440 × 900 or a similar desktop size with browser zoom at 100%.
- Keep the final cut under three minutes and confirm that narration is audible before publishing.
