# Mechanism Canvas design contract

## Current direction — Reaction Garden · Reaction Cloud

This section supersedes the earlier visual-direction rules wherever they conflict.
The interaction, chemistry, evidence, and accessibility contracts below remain
authoritative.

- **Thesis:** Mechanism Canvas is a warm reaction garden: a place to try a path, inspect
  what happened, and recover from a wrong turn. It should feel like a study tool with a
  point of view, not an administrative dashboard or a stack of generated cards.
- **Opening story:** the first screen shows the agent's isolated test ideas, the page's
  deterministic check, and the learner-only decision gate. When no lab exists, the
  product labels the clean SN2 fixture as example output. When a lab exists, the same
  surface renders its real branches and revision.
- **Information rhythm:** the opening proof, chemistry workspace, agent lab, and learning
  record appear in that order. The agent lab uses one native disclosure level: four calm
  stages remain closed until the learner asks for them. Inside an open stage, proximity,
  rows, and rules carry hierarchy; nested mini-cards do not.
- **Shape language:** irregular curves belong to large spatial fields, where they suggest
  an electron cloud or reaction boundary. The hero, agent field, problem leaf, and brand
  shell may be asymmetric. Eligible actions, compact statuses, selectors, disclosure
  cutouts, and plus/minus rings use fixed reaction-cloud silhouettes. Each wide outline
  has three broad, nearly even lobes per edge with shallow valleys and an 85–90% vertical
  fill. The result reads as full and bubbly, not thin, scalloped, or erratically wavy.
  There are no pointed lenses, hard pinches, random distortion, or repeated one-radius
  capsules. Compact counters use one full rounded blob instead of miniature ripples.
  Evidence, chemistry, typography, and data alignment stay exact.
- **Warmth:** the existing ocean, coral, sunlight, seafoam, plum, and periwinkle roles
  remain, but they sit on a warm paper canvas instead of cool gray software chrome.
- **Type:** Charter, Iowan Old Style, and Georgia give learner-facing titles the voice of a
  familiar study book. Avenir Next and the system sans stack carry controls and body copy.
  Monospace remains limited to reason codes and machine-readable identifiers.
- **Controlled counter-rule:** chemistry does not become blobby. Atoms, bonds, curved
  arrows, validator results, and receipt evidence stay exact. Arrow shafts and heads are
  explicit SVG geometry with shared color, weight, centerline, and round joins; font
  chevrons are never used as diagram connectors.
- **Reaction-cloud rule:** six hand-authored SVG masks provide low-frequency, gently
  multi-lobed silhouettes, with additional stable assignments where neighboring controls
  would otherwise look stamped from one template. Labels, baselines, rectangular hit areas,
  complete painted outlines, and focus states remain exact; only the visible contour
  varies. Shapes stay stable across reloads, are never randomized, and no variant is a
  plain ellipse, capsule, rounded rectangle, or angular polygon.
- **Arrow construction rule:** every preview arrowhead is derived from its shaft endpoint
  and direction. Its base is centered on and overlaps that endpoint, preventing a kink,
  gap, or arrowhead that points away from its target after SVG scaling. Preview lone-pair
  dots are tangent to the atom perimeter as a conventional pair; the shaft begins beyond
  both dot radii with visible clearance, matching the interactive canvas invariant.
- **Brand mark:** the `e−` sits in one organic warm-paper shell with optical centering and
  no decorative dot. Paired dots appear only as a deliberate electron-pair motif.
- **Geometry:** top-level fields may use 28–74 px asymmetric radii. Work surfaces use
  30–50 px smooth asymmetric corners. Open agent instruments use a restrained 11–17 px
  frame and straight internal rules. Eligible controls use responsive SVG masks whose
  spline paths use only a few broad lobes and shallow, uniform valleys while filling
  nearly the full hit box. Every important action keeps at least a 44 px rectangular
  target beneath its painted cloud. Forced-colors mode restores a conventional
  high-contrast border rather than depending on the mask.
- **Motion:** only short, soft press/elevation feedback and user-triggered electron-flow
  replay. Reduced motion removes both animation and smooth scrolling without removing
  information.
- **Responsive contract:** the complete two-idea result is visible beside the story at
  desktop. At narrow widths the story, trust flow, result, workspace, and disclosures
  stack in that order with no horizontal overflow at 360 px. Sticky workspace content
  becomes static before it can obscure zoomed or keyboard-focused content.
- **Reference boundary:** the direction borrows only the broad principle of friendly,
  rounded geometry from modern consumer-product identities. It does not reproduce a
  protected logo, palette, typeface, or component system.
- **Research basis:** expressive color and shape guide attention only when they reinforce
  function ([Google Design](https://design.google/library/expressive-material-design-google-research));
  advanced controls begin secondary and use a clearly labeled disclosure
  ([Nielsen Norman Group](https://www.nngroup.com/articles/progressive-disclosure/)); and
  the layout reflows without two-dimensional scrolling at a 320 CSS px equivalent
  ([W3C WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)).

## Product

- Direction: **Tidal Pop · Reaction Line** with **Electron Flow Replay** as its most vivid event.
- Thesis: help early organic chemistry learners inspect electron movement in a workspace that feels fresh, exact, energetic, and memorable without becoming sterile, decorative, or machine-generated.
- Core journey: choose an exercise, inspect the current state, add the complete arrow bundle, check it, then commit or revise. Multi-step exercises repeat that cycle at a named intermediate.
- Audience: undergraduate learners at a laptop, including keyboard and screen-reader users. Hackathon judges should understand the product from the same interface.
- Platform: responsive web app optimized for 1440 x 900 and usable from 360 px upward, with pointer, keyboard, touch, reduced-motion, and high-contrast paths.
- Persistence: local browser storage only. There is no account or cloud sync.

## Visual voice

- Register: fresh, exact, native, and confidently playful. Avoid clinical white-and-cyan software, arbitrary colored patches behind copy, nostalgic notebook styling, generic AI dashboards, and decorative laboratory graphics.
- Subject concept: the interface reads like a crisp reaction map. Deep-ocean chrome frames the workspace; nearly white paper keeps chemistry readable; aqua, sunlight, seafoam, periwinkle, and coral form one bright coastal family rather than unrelated software category colors.
- Dominant rule: color belongs to complete, meaningful surfaces and interaction states. The problem brief is ocean mist, drafting is sunlight, reasoning is pale aqua, reflection/evidence is periwinkle, and the chemistry canvas remains quiet white paper. The stronger draft surface is intentional task emphasis; the other light fields stay close in value so the page remains composed.
- Surface rule: a region receives color only when the color explains its role. Aqua marks active interaction, amber means draft/incomplete/broken bond, sea green means accepted/committed/formed bond, coral means performed electron movement, deep blue means reflection or reached evidence, and red means failure.
- Counter-rule: molecular geometry, paragraphs, evidence rows, and nested controls remain calm. Organic shapes may frame a top-level story or work zone, but ornamental stripes, highlight patches, and one-off tints may not simulate hierarchy.
- Signature: stable atoms, bonds, and electron pairs remain directly selectable while the adjacent feedback names the same entities in plain language.
- Delegation signature: one sunlight intent surface turns a broad contract into a fixed purpose, exact mechanism scope, and finite action meter. Active work shifts to aqua; exhaustion or drift returns to amber. The three-step Intent → Capability → Execution chain is always textual and never relies on color alone.
- Counterfactual-lab signature: one deep-plum hypothesis surface contains two or three equal white molecular stages. Purple identifies isolated branch state, amber names incomplete or drifted evidence, and sea green names validator-approved or recommended evidence. The main-revision seal and learner-review gate remain textual; purple never leaks into the authoritative chemistry canvas.
- Observatory signature: one deep-ocean instrument surface turns Contract → Page state → Intent → Host into a visible narrowing path. Host-attested aqua, manual-preview amber, and registration-error coral always carry explicit text. The journey eval is a calm seafoam evidence sheet, not a generic analytics dashboard; its seven claims remain rows with page-side proof language.
- Multi-step signature: a thin reaction path sits on the edge of the canvas. Reached states become navigable evidence; unreached states remain locked so history cannot reveal a future product.
- Reaction-diff signature: one focused evidence sheet pairs two equal molecular stages whose full sunlight-before and seafoam-after surfaces make direction legible without carrying the chemical change alone. A comparison-only layout places every disconnected species on one canonical heavy-atom reaction line, derives plus signs from measured inter-species bounds, and never reuses the exercise fixture's freeform separator positions. The exact ledger uses rows instead of mini-cards.
- Replay signature: **Replay electron flow** draws the learner's performed arrows over the reached before-state, then rests. It is available only for active committed transitions, changes no chemistry or revision, and becomes a static arrow reveal when reduced motion is requested.
- Learning-record signature: a full periwinkle reflection surface follows feedback and activity. The compact instructor view reads like a local learning record, not an account dashboard or gradebook.
- Three-dimensional signature: a matte molecular model uses familiar element colors, spherical electron markers, readable bond rods, optional dipole arrows, and restrained lighting.
- Typography: the native system sans stack carries interface copy. Comparison chemistry uses three deliberate roles: humanist atom symbols, conventional H-with-subscript-count annotations, and small monospaced atom-map IDs. Monospace is otherwise reserved for machine-readable reason codes.
- Creative risk: several full surfaces now carry visible color. The palette must remain role-based and text must retain WCAG AA contrast; verify that chemistry stays dominant and that the page never becomes a stack of arbitrary pastel cards.

## System

- Geometry: 18–22 px primary containers, 12–16 px controls and inset groups, selectively capsule-shaped statuses, and a 4 px spacing base. Comparison states pair as two equal 14 px stages; evidence inside them stays row-based. Rounding communicates a boundary or touch affordance and is not repeated around every paragraph.
- Material: cool mist canvas, clean white paper, brighter raised surfaces, full semantic work zones, 1 px blue-gray hairlines, and a close ocean-tinted ambient shadow. Deep ocean is reserved for product chrome and modal headers. Blur, glass, and decorative gradients are not used in the content layer.
- Typography: the native system stack uses regular, medium, semibold, and bold weights. Stable atom-map IDs are the sole chemistry exception to the plain voice because they are technical identifiers, not molecular content; reason codes are the only other monospace role.
- Palette: mist canvas `#E7F0F1`, white paper `#FCFEFD`, deep-aqua ink `#0B2B31`, ocean chrome `#073B4C`, aqua interaction `#007A78`, amber draft `#8A5700`, sea-green acceptance `#126F50`, coral electron flow `#C9432D`, deep-blue evidence `#315C8A`, and red failure `#A92C40`. Full role surfaces are ocean mist `#DCEFF2`, sunlight `#FFDB6E`, pale aqua `#D5EEF3`, periwinkle `#D9E7FF`, before-state sunlight `#FFE7AA`, and after-state seafoam `#D3F0E2`. Their relative-luminance spread is capped by regression coverage, and every filled-control foreground/background pair is at least WCAG AA. No text panel receives a decorative edge accent.
- Iconography: CSS and SVG marks with visible labels. No decorative icon library.
- Motion: short press/elevation feedback and one user-triggered reached-step electron-flow replay. Reduced motion removes path drawing and shows the same arrows as a static state.

## Behavior and trust

- Navigation: one workspace at `/`; a native selector swaps the active exercise and preserves separate local progress.
- History navigation: reactants, reached intermediates, and committed products are read-only views over one current mechanism. Returning to the current node restores editing; viewing history never changes the chemistry revision.
- Step comparison: only active committed transitions may be compared. Structures, performed arrows, and graph deltas come from the reached commit and authored states; undo relocks the reversed after-state. Opening, selecting, and closing a comparison never change chemistry, revision, activity, or persistence.
- Step replay: only active committed transitions may be replayed. A learner or Site Tool can open the same evidence sheet and replay the performed arrow bundle. Replay is transient presentation state: it appends no activity, changes no chemistry revision, creates no validation authority, and exposes no unreached state.
- Primary action: **Check step**. Checking never mutates the committed mechanism.
- Commit: enabled only after a current valid check. Undo remains explicit and reversible.
- State grammar: every status uses text and shape in addition to color.
- Copy: short chemistry verbs such as select, draw, inspect, check, commit, undo, and reset. Avoid AI praise and promotional language.
- Trust: fixtures and grading are deterministic. Agent actions appear in the same visible trail. Review and storage limits remain visible.
- Delegation: only the visible learner interface can start or end a tab-local session. Its frozen tool grant can shrink but never widen, and every metered call carries the session action ordinal into the proof ledger.
- Counterfactual Lab: only the visible learner interface can start or end the tab-local sandbox. Branch edits and checks advance only lab revision; a human main-state change drifts active work; recommendation stages but never adopts a proposal.
- WebMCP Observatory: a host event exists only after its complete registration batch resolves. Manual projections and failed refreshes stay visibly distinct. The run report evaluates retained callback evidence, not model prose, and creates no chemistry, permission, or persistence authority.
- Reflection: learner notes attach to exact commits and survive reversal. Saving a note does not change chemistry revision, restore commit authority, or become agent-authored chemistry.
- Review and export: instructor review is local and read-oriented. JSON export is active-exercise-only, uses an explicit allowlist, and adds no accepted bundles, unreached graphs, validation IDs, or dedicated identity fields. Freeform reflections need a review-before-sharing reminder.

## Validation

- First attention: the active reaction structure. Second: the current instruction and primary action. Third: feedback and reached evidence.
- A first-time learner should understand that an arrow starts at an electron source and that a concerted step must be checked as one bundle.
- In the capstone, the learner should understand that step 1 ends at a charged intermediate and that step 2 begins from that exact committed structure.
- Core controls must work by keyboard with visible focus, meaningful names, and a textual structure view.
- The interface becomes generic if the anchored electron controls, atomic validation bundle, and shared human-agent trail are removed.
- Counterfactual branches must render the actual molecule and electron-flow arrows, not generic text cards. At desktop they compare side by side; at narrow widths they stack in reading order with the same validation and arrow descriptions.
- The Observatory must show zero horizontal overflow at 360 px, stack the four-stage capability path in order, keep every claim textual beyond color, and never label a manual projection as host accepted.
- The learning record must remain subordinate to active mechanism work. Its empty state is compact; the denser evidence ledger opens in a modal with native focus containment and Escape/close behavior.
- Reaction Diff must show the full structure on narrow screens, stack before and after in reading order, and repeat every visual highlight as text. Every disconnected species uses the same derived heavy-atom baseline and every plus sign uses that exact line at all widths. Only changed atoms receive visible map labels. Opening and closing the modal must move and restore focus; a reopened dialog starts at its header.
- A design pass fails if atom mapping labels intersect atom symbols, formal charges, implicit hydrogens, lone-pair dots, or other mapping labels in the rendered comparison. Label placement must be geometry-aware, stable across both sides of a comparison, and checked in every authored state.
- A design pass also fails if an implicit-hydrogen annotation intersects an atom-map ID, atom symbol, formal charge, or lone-pair dot. Its placement is selected from clear perimeter ports, and its count is subordinate to the H rather than written as an undifferentiated `3H` token.
- Comparison SVGs use `aria-label` plus a description, not a child `<title>` element: native SVG title tooltips can float over the dialog header and are a visual defect even when the graph itself is collision-free.
- Disclosure toggles use a real 24 px icon box at the trailing edge of the summary. The plus/minus glyph is optically and mathematically centered; it is not an unmeasurable inline pseudo-element before the label.
- A design pass also fails if repeated identical cards, pills, random tint patches, symmetrical bento modules, generic gradients, glass, or ornamental icons replace content-led hierarchy. Purposeful electron-cloud shapes are allowed only where they reinforce the molecular play-space; statuses and evidence must remain legible without them.
- Playfulness must have a product job: aqua marks interaction, sunlight marks drafting, pale aqua marks reasoning, periwinkle marks reflection/evidence, coral traces performed electron movement, and state colors mark accepted, incomplete, or invalid outcomes. Decorative color without a semantic or compositional role is removed.
- Instruction bands use one complete seafoam surface with a normal 1 px border and ambient shadow. A thicker colored start edge or inset stripe is a regression even when the rest of the band is neutral.

## Iteration safeguards

- Atom symbols must be optically centered with SVG baseline controls. Implicit-hydrogen labels sit fully outside the atom target with at least 8 px of visible clearance at the rendered size.
- Comparison separators are generated from connected-component visual bounds, use explicit SVG central-baseline alignment, and maintain at least 28 view-box units of clear space on both sides. Fixture-authored separator coordinates remain untouched for the interactive exercise but are not authoritative in evidence views.
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
- Long replay arrows that cross disconnected species lift into a comparison-only upper arch so they cannot run through intervening atoms or electron pairs. The drawable exercise keeps its existing routing.
- Replay never implies a physical transition state or reaction coordinate. It repeats the authored curved-arrow bookkeeping performed by the learner or agent, and the copy names that boundary.
- Primary actions are at least 44 px high, use filled rounded rectangles, and include pressed, focus, selected, and disabled states. Capsule geometry is reserved for compact statuses and standalone utility controls.
