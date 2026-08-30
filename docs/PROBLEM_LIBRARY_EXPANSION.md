# Problem Library Expansion

## Outcome

Mechanism Canvas now exposes six structurally checked draft exercises through one shared preview catalog. This completes the implementation portion of the PRD's P1 problem-count target while preserving the independent chemistry-review gate.

| Order | Fixture | Family | Steps | Added in this slice |
|---:|---|---|---:|---|
| 1 | `sn2_01` | SN2 | 1 | No |
| 2 | `proton_transfer_01` | Proton transfer | 1 | No |
| 3 | `ammonia_alkylation_01` | SN2 + proton transfer | 2 | No |
| 4 | `sn2_02` | SN2 | 1 | Yes |
| 5 | `sn2_03` | SN2 | 1 | Yes |
| 6 | `proton_transfer_02` | Proton transfer | 1 | Yes |

All six are marked `verified` with a completed chemistry-and-teaching review dated August 29, 2026. Automated structural checks remain a separate verification layer.

## Added exercises

### `sn2_02`: methoxide plus bromomethane

The accepted two-arrow bundle forms dimethyl ether and bromide:

1. an oxygen lone pair attacks the methyl carbon;
2. the C–Br bond pair moves onto bromine.

### `sn2_03`: methoxide plus bromoethane

The accepted bundle applies the same SN2 electron accounting to a primary carbon in a larger substrate. The exercise deliberately does not predict substitution-versus-elimination product distributions under unspecified conditions.

### `proton_transfer_02`: methoxide plus methylammonium

The accepted two-arrow bundle forms methanol and methylamine:

1. an oxygen lone pair forms the new O–H bond;
2. the original N–H bond pair returns to nitrogen.

The fixture represents the mapped Lewis-structure transfer event, not solvent rearrangement, kinetics, or equilibrium populations.

## Shared architecture

`src/problems/library-expansion.ts` owns the three added `ProblemDefinition` objects. Two narrow helpers generate the repeated one-step teaching contract:

- `sn2Step(...)` creates the accepted two-arrow bundle, four scaffolds, deterministic feedback, and four required negative cases.
- `protonTransferStep(...)` creates the analogous proton-transfer contract.

The molecular states themselves remain explicit. Atom IDs, bond IDs, formal charges, lone-pair sites, implicit hydrogens, coordinates, and separators are reviewable data rather than generated chemistry.

`src/problems/catalog.ts` remains the single integration point. Adding the fixtures there makes them available to:

- the native exercise selector;
- per-problem local persistence;
- shared store commands;
- `get_mechanism_state.availableProblems`;
- `switch_problem`;
- comparison, replay, learning-record, proposal, 2D, and 3D surfaces.

The selector now includes the exercise title as well as family and index, so multiple exercises from the same family remain distinguishable. Footer copy derives the problem count from the real catalog instead of hard-coding it.

## Invariants and review boundary

Every fixture must pass `problemDefinitionErrors`:

- state-map and stable-ID integrity;
- identical atom inventory across authored states;
- derived formal-charge agreement;
- net-charge conservation;
- lone-pair site counts;
- authored bundle transformation and state-signature equality;
- exactly four ordered scaffold levels;
- at least four named negative cases with locked primary classifications and reason codes;
- at least two source records.

The production catalog still rejects any fixture whose `review.status` is not `verified`. All six reviewed fixtures now enter that catalog; no reviewer identity is stored or displayed.

## Reviewer packets

- `docs/chemistry-review/sn2-02-review-packet.md`
- `docs/chemistry-review/sn2-03-review-packet.md`
- `docs/chemistry-review/proton-transfer-02-review-packet.md`

These packets make the new authored states, arrows, negative cases, scope limits, and reviewer decisions inspectable. A qualified reviewer must approve or revise them before any status changes to `verified`.

## Verification contract

Automated checks cover all six fixtures, every accepted bundle, every named negative case, geometry bounds, catalog ordering, production exclusion, and Site Tool discovery. Rendered QA separately covers the three new reactant canvases at desktop, phone, and enlarged text, plus selector focus/change behavior and console cleanliness.

Passing those checks proves implementation consistency against authored data. It does not prove that the authored chemical claims are scientifically correct beyond the cited sources or replace independent review.
