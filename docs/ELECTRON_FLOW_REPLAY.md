# Mechanism Canvas Electron Flow Replay

Electron Flow Replay presents the exact curved-arrow bundle already committed for one active reached step. It is an explanatory view of electron bookkeeping, not a second chemistry command and not a physical transition-state animation.

## Product contract

- Replay is available only for a transition returned by `availableStepComparisons`.
- It uses the performed arrows stored on that active commit; it never reads an authored accepted bundle.
- Arrows appear over the reached before-state while the reached after-state remains visible for comparison.
- Starting, restarting, selecting, or closing replay does not change `mechanismRevision`, `activitySequence`, current state, history view, validation authority, reflections, or persistence.
- Undo relocks the after-state and removes the transition from replay eligibility.
- The status copy explicitly says that the trace is electron bookkeeping rather than a physical transition state.

## Shared geometry

`src/components/mechanism-arrow-layout.ts` owns electron-source lookup and obstacle-aware route selection for both the drawable `MechanismCanvas` and the read-only `MoleculeSnapshot`. `src/components/mechanism-arrow-geometry.ts` turns those routes into the same curved shaft and arrowhead geometry in both surfaces.

The comparison renderer also reuses the drawable canvas's atom, bond, charge, implicit-hydrogen, lone-pair, and separator classes. Every atom paints an opaque target mask after bonds, preventing a bond from crossing through a symbol. Replay arrows paint last so their source and destination remain legible without changing the molecular graph.

The evidence view adds one comparison-only rule: a replay arrow longer than 220 view-box units receives an explicit upper arch. This prevents cross-species electron flow from passing through an intervening molecule while leaving the interactive exercise's already-validated routing unchanged. Target landing angles, electron-source clearance, arrowhead geometry, and shared-target routing remain authoritative from the shared mechanism geometry modules.

## Human interaction

1. Commit a checked step and open **Step evidence**.
2. Select an active reached transition.
3. Select **Replay electron flow**. Repeating the action restarts the trace from the same performed bundle.
4. Read the exact text bundle and graph-change ledger if motion or spatial interpretation is not useful.

With `prefers-reduced-motion: reduce`, replay immediately shows the complete static arrow bundle. The live status announces **Performed arrows shown** and explains why the animation was removed.

## Site Tool

`replay_reached_step({ beforeStateId, afterStateId })` is one of twenty-six tools in the complete catalog and remains available in every Collaboration Contract mode. An active delegation session may omit it or meter it as a purpose-specific presentation action.

The tool:

- validates the exact pair through the same pure comparison engine as `compare_reached_step`;
- rejects undone, unreached, reversed, non-adjacent, and malformed pairs;
- dispatches a narrow presentation event containing the active commit ID and exact state IDs;
- opens the human evidence dialog, selects that commit, and starts or restarts replay; and
- returns the current problem ID, revision, activity sequence, step metadata, and comparison result.

Its annotations are `destructiveHint: false`, `idempotentHint: false`, `openWorldHint: false`, and `readOnlyHint: false`. The tool is not marked read-only because it visibly changes transient page presentation; it still performs no chemistry, activity, network, or persistence write.

## Verification

Automated tool-contract coverage locks replay's annotations, active-commit success path, unreached-pair rejection, unchanged activity sequence, and its presence within the current adaptive twenty-six-tool complete catalog. Shared molecule geometry tests protect label clearance and comparison view-box bounds. Browser QA separately covers the one-step SN2 fixture, one-step proton-transfer fixture, both dense capstone transitions, animated replay, reduced-motion static replay, desktop side-by-side layout, and phone stacking.

Chemistry review is complete. Manual screen-reader review remains outside this automated verification boundary.

## Source map

| Concern | Source |
|---|---|
| Replay event contract | `src/domain/reaction-replay.ts` |
| Shared source lookup and comparison-only long-arrow arch | `src/components/mechanism-arrow-layout.ts` |
| Curved shaft and head geometry | `src/components/mechanism-arrow-geometry.ts` |
| Replay rendering and molecule masks | `src/components/MoleculeSnapshot.tsx` |
| Dialog selection, timing, and reduced-motion behavior | `src/components/ReactionDiff.tsx` |
| Site Tool registration | `src/webmcp/register-tools.ts` |
| Tool-contract tests | `src/webmcp/register-tools.test.ts` |
