# Judge guide

Mechanism Canvas turns curved-arrow chemistry into a shared human-agent workspace. The useful comparison is visible in one minute: an agent operates on stable atoms, bonds, and electron pairs while the learner watches the same canvas and the app keeps control of validation.

## Fastest live path

1. Open <https://mihirduvedi.github.io/mechanism-canvas/> in ChatGPT's built-in browser.
2. Confirm that the address bar's Site tools menu lists 12 tools.
3. Paste the prompt below.
4. Keep the molecular canvas and activity trail visible while the agent works.

> Use this page's site tools and keep every change visible. Read the current mechanism state. If the active proton-transfer exercise contains old work, reset it; I confirm that reset. Switch to the proton-transfer problem, inspect the nitrogen lone pair, mapped hydrogen, oxygen-hydrogen bond, and oxygen. Add only the nitrogen lone-pair arrow first and check the incomplete step. Explain the validator's result briefly. Add the companion bond arrow, check again, commit the valid step, read back the shared activity trail, then undo the commit.

Current ChatGPT documentation says Site tools work in the desktop app's built-in browser with supported models and may depend on account rollout. The full interface remains usable when `document.modelContext` is unavailable.

## What the sequence proves

| Moment | Evidence on screen | WebMCP point |
|---|---|---|
| State read | The agent discovers both reaction stations and the current revision. | The page exposes domain state rather than forcing screenshot inference. |
| Problem switch | The visible exercise changes to **Pass the proton**. | A tool reuses the same store and persistence path as the native selector. |
| Entity inspection | Nitrogen's lone pair, mapped hydrogen, O–H bond, and oxygen have stable IDs. | The agent reasons over chemistry semantics, not coordinates. |
| First arrow and check | The draft appears and the validator reports an incomplete concerted step. | The agent can test a partial hypothesis without receiving a hidden solution. |
| Second arrow and check | The validator returns a valid revision-bound token. | Deterministic application logic, not the model, decides acceptance. |
| Commit | The product changes to ammonium plus water. | A checked result is still separate from an explicit mutation. |
| Activity read | Human, agent, and validator events match the visible trail. | The collaboration record is structured and inspectable. |
| Undo | Reactants return and the reversal remains in history. | Agent writes are controlled and recoverable. |

## Manual fallback

In an ordinary browser, select **02 · Proton transfer** and reset the exercise if needed. Click nitrogen's lone pair, then the mapped hydrogen. Click the O–H bond, then oxygen. **Check step** should accept the two-arrow bundle; **Commit checked step** changes the structure; **Undo commit** restores the reactants.

This fallback proves the human experience and shared command layer. It does not count as live WebMCP verification.

## Architecture in one sentence

Problem fixtures, the React interface, twelve top-level site tools, local persistence, deterministic validation, provenance, and the 3D inspector all converge on one revisioned `MechanismStore`.

The most important guardrails are visible in code and behavior:

- Every mutating tool uses the current `mechanismRevision`.
- Editing a draft invalidates its previous check.
- A commit requires a valid check token bound to the exact revision and arrow signature.
- Reset is destructive and requires both explicit confirmation and a current revision.
- Tool actions appear in the same activity trail as learner actions.
- Refresh restores work but never restores validation authority.

## Honest boundary

The current fixtures pass automated structural checks, charge conservation checks, authored transition checks, negative-case checks, store tests, and tool-journey tests. Independent chemistry review is still pending, so both exercises are plainly marked **Prototype · review pending** and are excluded from the production fixture catalog.

The 3D view is explanatory. It does not claim quantum chemistry, molecular dynamics, conformer prediction, kinetics, or reaction energetics.
