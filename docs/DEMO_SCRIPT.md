# Demo script: under three minutes

**Target runtime:** 2:35–2:50
**Format:** screen recording with live narration
**Primary frame:** deployed app in ChatGPT's built-in browser, with the Site tools menu shown once near the start

## 0:00–0:20 — The problem

**On screen:** Fresh SN2 workspace, then briefly hover or focus an atom and a lone pair.

**Narration:**

> Organic chemistry mechanisms look like drawings, but every arrow carries exact meaning: which electron pair moved, where it went, and which bonds changed with it. A browser agent can see the pixels. It cannot safely infer all of that structure from coordinates.

## 0:20–0:38 — The WebMCP idea

**On screen:** Open the Site tools menu and show the 12 available tools. Return to the page.

**Narration:**

> Mechanism Canvas gives the open page twelve narrow site tools. The learner and the agent share one revisioned chemistry store, one canvas, and one activity trail. The model never grades the chemistry.

## 0:38–1:00 — Discover and switch

**On screen:** Ask the agent to read state, switch to `proton_transfer_01`, and inspect `lp_n_1`, `h_transfer`, `bond_o_h_transfer`, and `o_acid`.

**Narration:**

> The agent discovers two reaction families, switches the visible station, and reads stable chemical IDs instead of guessing where to click.

## 1:00–1:28 — Let an incomplete idea fail honestly

**On screen:** Agent adds `lp_n_1 → h_transfer`, then calls `check_draft_step`. Keep the amber incomplete feedback visible.

**Narration:**

> First it adds only the bond-forming arrow. The deterministic check rejects that as incomplete because the original oxygen-hydrogen bond pair is still unaccounted for. Checking diagnoses the draft. It does not change the molecule.

## 1:28–1:58 — Complete, check, commit

**On screen:** Agent adds `bond_o_h_transfer → o_acid`, checks again, then commits with the returned validation ID.

**Narration:**

> The companion arrow returns that bond pair to oxygen. This time the authored transition and electron bookkeeping agree. The valid check produces a token bound to this exact revision, and only then can the agent commit ammonium plus water.

## 1:58–2:24 — Inspect the proof

**On screen:** Show the activity trail. Have the agent call `get_activity_trail`. Open the 3D inspector and select nitrogen if the pace allows.

**Narration:**

> Every agent action is already visible beside learner and validator events, and the same record is available as structured site-tool output. The optional 3D view is generated from the committed molecular graph, so ammonium becomes tetrahedral while water is bent.

## 2:24–2:42 — Reversibility and close

**On screen:** Agent calls `undo_last_commit`; show reactants return and the undo event remain in the trail.

**Narration:**

> Undo restores the reactants without erasing what happened. Mechanism Canvas shows what WebMCP adds to a visual learning tool: shared semantics, bounded actions, deterministic checks, and a learner who stays in control.

## Recording checklist

- Start from the deployed HTTPS URL, not localhost.
- Use a fresh or explicitly reset proton-transfer workspace.
- Show the Site tools count and at least one real tool call source.
- Keep the incomplete check on screen long enough to read.
- Do not describe the fixtures as chemistry-reviewed; the review badge must remain visible.
- Record at 1440 × 900 or a similar desktop size with browser zoom at 100%.
- Keep the final cut under three minutes and confirm that narration is audible before publishing.
