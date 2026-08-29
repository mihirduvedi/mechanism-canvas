# Judge guide

Mechanism Canvas turns curved-arrow chemistry into a shared human-agent workspace. The useful comparison is visible in one minute: an agent operates on stable atoms, bonds, and electron pairs while the learner watches the same canvas and the app keeps control of validation.

## Fastest live path

1. Open <https://mihirduvedi.github.io/mechanism-canvas/?demo=1> in ChatGPT's built-in browser. The demo uses memory only, so it starts clean without erasing saved practice.
2. Confirm that the address bar's Site tools menu lists 14 tools.
3. Paste the prompt below.
4. Keep the molecular canvas and activity trail visible while the agent works.

> Use this page's site tools and keep every change visible. Read the clean demo state and switch to ammonia_alkylation_01. Add only lp_n_attack_1 → c_methyl and check the incomplete first step; explain the validator's result briefly. Add bond_c_br → br_leaving, check again, and commit the intermediate. Call compare_reached_step for amine_reactants → methylammonium_intermediate and summarize the exact bond and charge changes. Use view_mechanism_history_state to show the reactants, then return to the current intermediate. Add lp_n_base_1 → h_transfer and bond_n_attack_h_transfer → n_attacker, check, and commit the products. Read back the shared activity trail, then undo only the last commit.

Current ChatGPT documentation says Site tools work in the desktop app's built-in browser with supported models and may depend on account rollout. The full interface remains usable when `document.modelContext` is unavailable.

## What the sequence proves

| Moment | Evidence on screen | WebMCP point |
|---|---|---|
| State read | The agent discovers three exercises, including a two-step capstone, and the current revision. | The page exposes domain state rather than forcing screenshot inference. |
| Problem switch | The visible exercise changes to **Build methylamine in two steps**. | A tool reuses the same store and persistence path as the native selector. |
| Partial first step | One N → C arrow appears and the validator reports an incomplete concerted substitution. | The agent can test a partial hypothesis without receiving a hidden solution. |
| First commit | The canvas advances to charged methylammonium bromide plus ammonia. | Deterministic application logic, not the model, decides the authored transition. |
| Reaction Diff | The learner opens a side-by-side structure comparison while the agent reads the same bond, charge, and lone-pair deltas. | `compare_reached_step` reuses one pure comparison engine and rejects any pair not listed as active reached evidence. |
| History comparison | The agent shows reactants, returns to the current intermediate, and never unlocks products early. | `view_mechanism_history_state` changes only the visible review state, not chemistry or revision. |
| Second commit | Two proton-transfer arrows advance the same mapped atoms to methylamine plus ammonium bromide. | Each elementary step has a separate revision-bound validation and commit gate. |
| Activity read | Human, agent, validator, history-view, and commit events match the visible trail. | The collaboration record is structured and inspectable. |
| Undo | Only the second commit reverses; the exact charged intermediate returns. | Multi-step agent writes remain controlled and recoverable in LIFO order. |

## Manual fallback

In an ordinary browser, open the clean demo and select **03 · SN2 + proton transfer**. For step 1, click N1's lone pair then C1, and the C–Br bond then Br1. Check and commit to reach methylammonium bromide. Open **Compare committed steps** and confirm the C–Br break, C–N formation, and N1/Br1 charge and lone-pair changes. Close it, use the timeline to view **Reactants**, return to the current intermediate, then complete step 2 with N2's lone pair → H1 and the N1–H1 bond → N1. Check and commit. Compare step 2, then **Undo commit**; products must relock and only step 1 may remain comparable. Refreshing the demo starts it clean again; the normal saved workspace is separate.

This fallback proves the human experience and shared command layer. It does not count as live WebMCP verification.

## Architecture in one sentence

Problem fixtures, the React interface, fourteen top-level site tools, local persistence, deterministic validation, provenance, reached-state comparison, history navigation, and the 3D inspector all converge on one revisioned `MechanismStore`.

The most important guardrails are visible in code and behavior:

- Every mutating tool uses the current `mechanismRevision`.
- Editing a draft invalidates its previous check.
- A commit requires a valid check token bound to the exact revision and arrow signature.
- Reset is destructive and requires both explicit confirmation and a current revision.
- Tool actions appear in the same activity trail as learner actions.
- History navigation permits only reached states, leaves chemistry and revision unchanged, and makes the canvas read-only until the current step is restored.
- Reaction Diff and `compare_reached_step` accept only active committed transitions, return the same deterministic graph delta, and never add activity or change revision.
- Refresh restores work but never restores validation authority.
- `?demo=1` uses an in-memory store, advertises that session mode through `get_mechanism_state`, and never touches the saved workspace.

## Honest boundary

The current fixtures pass automated structural checks, charge conservation checks, authored transition checks, negative-case checks, store tests, and tool-journey tests. Independent chemistry review is still pending, so all three exercises are plainly marked **Prototype · review pending** and are excluded from the production fixture catalog.

The 3D view is explanatory. It does not claim quantum chemistry, molecular dynamics, conformer prediction, kinetics, or reaction energetics.
