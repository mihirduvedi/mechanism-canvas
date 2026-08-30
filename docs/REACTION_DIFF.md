# Mechanism Canvas Reaction Diff

Reaction Diff is the comparison layer inside the local **Reached step evidence** surface. It implements the PRD's P1 “before this step / after this step” comparison without introducing a second chemistry state, answer reveal, or grading path. Electron Flow Replay is documented separately in [ELECTRON_FLOW_REPLAY.md](ELECTRON_FLOW_REPLAY.md).

## User flow

1. The learner checks and commits an authored transition.
2. The compact Reaction Diff panel reports that one committed step is available.
3. **Open step evidence** opens a native modal and moves focus to **Close comparison**.
4. The dialog shows the reached before and after structures, highlights changed atoms and bonds, names every exact graph delta, and lists the arrow bundle actually performed.
5. **Replay electron flow** may trace that performed bundle over the before-state without applying the transition again.
6. A multi-step exercise exposes a native selector for each active commit. A newly committed step becomes the default.
7. Escape or **Close comparison** closes the dialog and restores focus to the trigger. Reopening starts from the dialog header rather than its prior scroll position.
8. Undo relocks the reversed after-state and removes that transition from Reaction Diff while preserving its commit and reflection in the Learning Record.

Opening, selecting, scrolling, and closing Reaction Diff do not change `mechanismRevision`, `activitySequence`, the current chemistry state, history view, local storage, or validation authority.

## Comparison model

`src/domain/mechanism-comparison.ts` is the shared source of truth.

- Bonds are matched by a normalized pair of stable atom IDs rather than drawing coordinates or bond-array order.
- A bond pair is reported as formed, broken, or order-changed with exact before and after orders.
- Stable atoms are compared for formal charge, lone-pair count, and implicit-hydrogen count.
- Layout coordinates and lone-pair drawing angles are intentionally excluded; they can change presentation without changing chemistry.
- The result includes all changed entity IDs and a deterministic count summary.
- Available transitions come only from commit records whose `undoneAt` is `null`, whose before and after states remain reachable, and whose state pair matches an authored problem step.

The current fixtures conserve atom inventory, so missing or added atoms are not a supported comparison case. Fixture validation remains responsible for that invariant.

## Comparison presentation geometry

`src/components/comparison-molecule-layout.ts` is a presentation-only adapter between authored graph states and the read-only evidence renderer. It never changes the source fixtures or comparison data.

- Bonds define disconnected molecular components; isolated atoms are valid one-atom components.
- Components retain their internal authored geometry and left-to-right order.
- The average heavy-atom y position of every component is translated to one fixed reaction line. Attached explicit hydrogens keep their authored offsets from that line.
- Each component's atom masks, map labels, formal charges, implicit-hydrogen annotations, and lone-pair dots contribute to its visual bounds.
- Components are centered as one sequence with a protected 56–76 unit gap. Plus signs are regenerated at the exact midpoint of adjacent component bounds and on the exact reaction line.
- Before and after share the fixed `760 × 360` comparison viewport. Authored fixture separators are intentionally ignored in the evidence sheet.

Atom-map IDs use a quiet monospaced metadata role. Atom symbols use a humanist chemistry role. Implicit hydrogens use H with a subordinate count and select a clear perimeter port rather than competing with a lone pair. These are semantic type and placement roles, not decorative variation.

## Reachability and answer boundary

The initial problem state and targets of active commits are reachable. `reachableHistoryStateIds` ignores reversed commit records, so undo relocks the corresponding product or intermediate in both the timeline and comparison engine.

Reaction Diff may show:

- the graph states on an active committed transition;
- the exact arrow bundle the learner or agent actually committed;
- graph and electron-bookkeeping changes derived from those reached states.

It never serializes authored accepted bundles, negative cases, unreached graphs, validation IDs, draft signatures, commit authority, other problem workspaces, or future transitions. Reversed commits remain available only in the existing Learning Record evidence surface; they are not treated as currently reachable chemistry.

## Site Tool

`compare_reached_step({ beforeStateId, afterStateId })` is one of twenty top-level Site Tools and is available in every Collaboration Contract mode. It is read-only, idempotent, and closed-world. `replay_reached_step` uses the same reachability gate. See [ELECTRON_FLOW_REPLAY.md](ELECTRON_FLOW_REPLAY.md) for replay's transient presentation contract.

The exact state pair must appear in `get_mechanism_state().mechanism.availableStepComparisons`. Success returns:

- problem ID and current mechanism revision;
- step and commit metadata;
- the performed arrow bundle;
- before and after state labels;
- structured bond and atom-property changes; and
- the same deterministic summary used in the human dialog.

An undone, unreached, non-adjacent, reversed, or malformed pair returns a structured error and does not add activity. The tool does not open or change the human dialog.

## Responsive and accessibility behavior

- The compact entry panel stays subordinate to the mechanism, feedback, and drafting workflow.
- Desktop presents before and after side by side; widths below 900 px stack them in DOM reading order.
- Phone snapshots scale the full graph into each card rather than requiring nested horizontal scrolling. The exact text ledger remains the authoritative accessible detail.
- Every atom uses the same opaque target mask, bond stroke, charge placement, and lone-pair grammar as the drawable mechanism canvas. Comparison-only type roles distinguish atom symbols, map IDs, and implicit-hydrogen counts. Bonds are painted first and atom masks second, so no bond can run through an atom label even when that atom has no property change.
- Atom-map labels are limited to atoms involved in a reported bond or property change and use geometry-aware placements shared across both sides of the comparison.
- SVG snapshots have a concise title and description; their changed-entity highlights are duplicated in the text ledger.
- Formed, broken, order, charge, lone-pair, and hydrogen changes use both words and before/after values, never color alone.
- The dialog uses native focus containment, an explicit Escape fallback, a visible focus ring, and trigger focus restoration.

## Source map

| Concern | Source |
|---|---|
| Pure comparison engine and reachability gating | `src/domain/mechanism-comparison.ts` |
| Domain and undo-relocking tests | `src/domain/mechanism-comparison.test.ts` |
| Read-only structure renderer | `src/components/MoleculeSnapshot.tsx` |
| Canonical reaction-line packing and separator derivation | `src/components/comparison-molecule-layout.ts` |
| Map-label and implicit-hydrogen placement | `src/components/molecule-snapshot-geometry.ts` |
| Exact replay-button vector mark | `src/components/ReplayIcon.tsx` |
| Entry panel, dialog, selector, and text ledger | `src/components/ReactionDiff.tsx` |
| Responsive and forced-color styling | `src/index.css` |
| Site Tool registration and state discovery | `src/webmcp/register-tools.ts` |
| Site Tool contract tests | `src/webmcp/register-tools.test.ts` |

## Verification boundary

Automated tests prove bond/atom deltas, capstone step isolation, active-commit gating, undo relocking, Site Tool input rejection, read-only activity behavior, tool discovery, component alignment, separator derivation, feature containment, annotation clearance, rendering order, and replay-icon centroid. Rendered browser QA separately exercises both one-step fixtures, both capstone transitions, selector behavior, desktop side-by-side, tablet/phone stacking, animated replay, reduced motion, and overflow/collision measurements. Static and rendered checks do not constitute independent chemistry or screen-reader review.
