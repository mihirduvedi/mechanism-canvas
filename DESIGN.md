# Mechanism Canvas design contract

## Product

- Direction: **Clear Lab 2.0 · Reaction Relay**.
- Thesis: help early organic chemistry learners inspect electron movement without making them decode the interface first.
- Core journey: choose an exercise, inspect the current state, add the complete arrow bundle, check it, then commit or revise. Multi-step exercises repeat that cycle at a named intermediate.
- Audience: undergraduate learners at a laptop, including keyboard and screen-reader users. Hackathon judges should understand the product from the same interface.
- Platform: responsive web app optimized for 1440 x 900 and usable from 360 px upward.
- Persistence: local browser storage only. There is no account or cloud sync.

## Visual voice

- Register: calm, exact, instructional. Avoid nostalgic notebook styling, generic AI dashboards, and decorative laboratory graphics.
- Subject concept: a clean teaching-lab workstation where the molecular diagram is the instrument readout.
- Dominant rule: a compact lesson column leads into one bright, spacious reaction canvas. Drafting and feedback follow below it in task order instead of competing at the same level.
- Counter-rule: green, amber, rust, and red appear only when the mechanism state or validation result needs them.
- Signature: stable atoms, bonds, and electron pairs remain directly selectable while the adjacent feedback names the same entities in plain language.
- Multi-step signature: a thin reaction path sits on the edge of the canvas. Reached states become navigable evidence; unreached states remain locked so history cannot reveal a future product.
- Reaction-diff signature: one quiet utility panel opens a focused read-only comparison. Warm broken-bond marks, green formed-bond marks, teal atom-property rings, and an exact text ledger explain the same committed transition without becoming a second workspace.
- Learning-record signature: a quiet reflection surface follows feedback and activity. The compact instructor view reads like a local lab record, not an account dashboard or gradebook.
- Three-dimensional signature: a matte molecular model uses familiar element colors, spherical electron markers, readable bond rods, optional dipole arrows, and restrained lighting.
- Typography: one system sans stack carries headings, controls, body copy, numbers, and chemistry labels. Hierarchy comes from size and weight, not a change of typeface. Monospace is reserved for machine-readable reason codes only.
- Creative risk: the reduced visual system may feel too quiet. Test it by checking whether the molecule, current instruction, and check result are still the first three points of attention.

## System

- Geometry: 20 px outer panels, 12–14 px inner groups, selectively capsule-shaped status controls, and a 4 px spacing base. Rounding communicates containment and touch affordance; it is not applied to every item.
- Material: cool gray canvas, white working surfaces, and pale teal instructional fields. Restrained layered shadows lift the reaction canvas and action surfaces; inner content groups remain flat.
- Typography: the native system sans stack is used throughout at regular, semibold, and bold weights. Progress labels, controls, and atom measurements share the same plain voice. Only reason codes use monospace.
- Palette: cool off-white canvas, white surfaces, near-black text, neutral gray dividers, deep teal action/focus, amber drafts, green accepted states, rust pathway mismatch, and red invariant failure.
- Iconography: CSS and SVG marks with visible labels. No decorative icon library.
- Motion: short color and stroke transitions only. Reduced-motion removes them.

## Behavior and trust

- Navigation: one workspace at `/`; a native selector swaps the active exercise and preserves separate local progress.
- History navigation: reactants, reached intermediates, and committed products are read-only views over one current mechanism. Returning to the current node restores editing; viewing history never changes the chemistry revision.
- Step comparison: only active committed transitions may be compared. Structures, performed arrows, and graph deltas come from the reached commit and authored states; undo relocks the reversed after-state. Opening, selecting, and closing a comparison never change chemistry, revision, activity, or persistence.
- Primary action: **Check step**. Checking never mutates the committed mechanism.
- Commit: enabled only after a current valid check. Undo remains explicit and reversible.
- State grammar: every status uses text and shape in addition to color.
- Copy: short chemistry verbs such as select, draw, inspect, check, commit, undo, and reset. Avoid AI praise and promotional language.
- Trust: fixtures and grading are deterministic. Agent actions appear in the same visible trail. Review and storage limits remain visible.
- Reflection: learner notes attach to exact commits and survive reversal. Saving a note does not change chemistry revision, restore commit authority, or become agent-authored chemistry.
- Review and export: instructor review is local and read-oriented. JSON export is active-exercise-only, uses an explicit allowlist, and adds no accepted bundles, unreached graphs, validation IDs, or dedicated identity fields. Freeform reflections need a review-before-sharing reminder.

## Validation

- First attention: the reaction and current instruction. Second: the active draft and actions. Third: the unified feedback, hints, and activity surface below.
- A first-time learner should understand that an arrow starts at an electron source and that a concerted step must be checked as one bundle.
- In the capstone, the learner should understand that step 1 ends at a charged intermediate and that step 2 begins from that exact committed structure.
- Core controls must work by keyboard with visible focus, meaningful names, and a textual structure view.
- The interface becomes generic if the anchored electron controls, atomic validation bundle, and shared human-agent trail are removed.
- The learning record must remain subordinate to active mechanism work. Its empty state is compact; the denser evidence ledger opens in a modal with native focus containment and Escape/close behavior.
- Reaction Diff must show the full mapped structure on narrow screens, stack before and after in reading order, and repeat every visual highlight as text. Opening and closing the modal must move and restore focus; a reopened dialog starts at its header.

## Iteration safeguards

- Atom symbols must be optically centered with SVG baseline controls. Implicit-hydrogen labels sit fully outside the atom target with at least 8 px of visible clearance at the rendered size.
- Curved arrows use separate shaft and filled-head geometry instead of SVG markers. The shaft ends at the arrowhead base, the head tip stops 2.5 px outside the target atom, and lone-pair arrows begin beyond both electron dots. Bond-source arrows begin on the bond, leave its axis, and approach the selected atom radially at an off-axis perimeter point so the destination cannot read as the bond itself. Target routing reserves the perimeter occupied by lone pairs, existing bonds, charge marks, and implicit-hydrogen labels before choosing that landing point.
- Arrows that converge on the same atom reserve distinct perimeter targets and matching curve lanes. Adjacent heads keep at least 22 degrees of angular separation unless the authored geometry makes that impossible; naturally separated approaches are not displaced.
- A level-four hint preview is visible only while its hint is open and the draft is empty. Starting a new arrow hides the preview. Every open hint has a visible Hide hint action.
- Status color is paired with a symbol and text. Green means accepted or committed, amber means incomplete, and red means a chemistry or input failure.
- User-facing actor names, progress values, and atom measurements do not use monospaced or terminal-style type. Only reason codes may look like code.
- Formal charge is never communicated by a halo alone. The 3D model must show an explicit blue plus or red minus badge, while the inspector names the sign in text.
- Legend marks use explicit shape geometry, not font baselines, when they depict rods, pluses, minuses, or other centered symbols. A disclosure boundary uses one divider per relationship; adjacent closed disclosures may not create doubled rules.
- Dipole arrow length is proportional to electronegativity difference. Shaft, head, and crossed tail must touch, and the complete arrow must clear both bonded atoms.
- Final QA must inspect the 2D atom baseline, implicit-hydrogen clearance, two-arrow bundle, hidden-hint state, positive and negative 3D charges, dipole overlays, and the compact atom inspector at desktop and narrow widths.
- The page uses one dominant working canvas and a two-column desktop structure. Feedback moves below the workbench. A redesign fails if auxiliary rails compete visually with the reaction or if narrow layouts only shrink the desktop composition.
- The reaction timeline remains a supporting edge, not a card grid or second navigation rail. Its state nodes use one connected line, one current-state halo, and concise chemical labels. It must scroll horizontally at narrow widths without shrinking or revealing locked-state content.
- Comparison color never carries the change alone: formed, broken, order, charge, lone-pair, and implicit-hydrogen changes are named with before and after values in the ledger.
- Primary actions are at least 44 px high, use filled rounded rectangles, and include pressed, focus, selected, and disabled states. Capsule geometry is reserved for compact statuses and standalone utility controls.
