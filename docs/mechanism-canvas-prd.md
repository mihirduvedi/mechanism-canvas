# Mechanism Canvas

## Product Requirements Document

**Version:** 1.0
**Status:** Build-ready hackathon baseline
**Author:** Mihir Duvedi with Codex
**Created:** August 27, 2026
**Target event:** The WebMCP Challenge
**Submission deadline:** September 3, 2026 at 1:00 p.m. Pacific Time
**Primary implementation window:** August 28–September 2, 2026

---

## Implementation status addendum — August 28, 2026

The P1 two-step capstone is now implemented as the draft-only `ammonia_alkylation_01` fixture. Its SN2 commit advances to a charged methylammonium intermediate; a separately checked proton-transfer commit advances to products. A reached-state timeline and the `view_mechanism_history_state` site tool provide read-only history navigation, future states remain locked, and undo reverses one commit at a time. The active prototype therefore has three fixtures and thirteen site tools. The original counts and milestones below remain the build-baseline record; [README.md](../README.md) and [JUDGE_GUIDE.md](JUDGE_GUIDE.md) describe current behavior. Independent chemistry review is still required before the capstone can enter the production catalog.

The P1 Learning Record slice is also implemented locally. Each commit can carry a learner-authored reflection that remains attached after undo and does not change chemistry revision or validation authority. A compact instructor view summarizes checks, hint use, active and reversed commits, performed arrow bundles, and reflections. Download JSON and Copy JSON produce an active-exercise-only export from an explicit allowlist; authored accepted bundles, unreached state graphs, validation IDs, dedicated identity fields, and other problem workspaces are omitted. Freeform reflections can contain learner-entered text and must be reviewed before sharing. Saved workspaces migrate from storage schema v2 to v3, while `?demo=1` remains memory-only. The schema and trust boundary are documented in [LEARNING_RECORD.md](LEARNING_RECORD.md).

---

## 1. Executive summary

Mechanism Canvas is a visual organic-chemistry learning workspace where a learner and a browser-based AI agent reason over the same live reaction mechanism.

The learner constructs a mechanism step by choosing electron sources and destinations on an SVG molecular diagram. A deterministic chemistry engine checks electron accounting, bond changes, formal charge, elementary valence constraints, and whether the resulting state matches an instructor-authored pathway. Through WebMCP, the agent can inspect the exact atoms, bonds, charges, lone pairs, draft arrows, validation results, and attempt history without guessing from pixels or brittle DOM interactions. It can focus relevant entities, add or remove a proposed arrow, request a bounded hint, check a draft step, and commit a validated step when the learner explicitly asks.

The product is not a general chemistry chatbot, arbitrary molecule editor, reaction predictor, or substitute for an instructor. It is a deliberately constrained learning environment for two introductory mechanism families: proton-transfer acid–base steps and SN2 substitutions. All accepted pathways are authored and chemistry-reviewed. The deterministic application—not the agent—decides whether a submitted step is accepted.

The hackathon demonstration will show a learner drafting an incomplete SN2 step, asking the agent to check rather than solve it, receiving evidence-linked feedback about a missing companion arrow, requesting a conceptual hint, correcting the step, and then asking the agent to commit the validated transformation. Every agent action changes or focuses the same visible canvas the learner controls.

### 1.1 One-sentence pitch

**Mechanism Canvas lets a student and an AI agent push electrons together on the same molecular canvas, while deterministic chemistry rules keep the lesson grounded.**

### 1.2 Product thesis

Curved-arrow mechanisms are a semantic graph problem presented through a spatial interface. Pixels show where an arrow appears, but they do not reliably tell an agent which lone pair, atom, bond, or reaction state that arrow means. WebMCP gives the agent stable chemical entities and domain actions while preserving the visual workspace and the learner's agency.

### 1.3 Build decision summary

| Decision | Baseline choice | Reason |
|---|---|---|
| Primary learner | First-semester undergraduate organic-chemistry student | Specific, credible audience with a well-defined learning difficulty |
| P0 reaction scope | Proton transfer and SN2 | Demonstrates multi-arrow steps without requiring a universal chemistry engine |
| Problem count | Four verified core problems; two additional problems as stretch | Enough variety for credibility while protecting the deadline |
| Molecular input | Authored, fixed-layout SVG graphs | Avoids the risk and complexity of arbitrary structure drawing |
| Arrow interaction | Select a source, then select a destination; submit all arrows atomically | Correctly represents concerted steps and enables keyboard access |
| Correctness authority | Deterministic validator plus authored transition graph | Prevents the language model from grading chemistry |
| Agent intelligence | External ChatGPT Work or Codex using site tools | No unnecessary in-app model API or backend cost |
| WebMCP integration | Imperative tools registered from the top-level page | Required for current ChatGPT in-app browser compatibility |
| Persistence | Versioned local browser storage | No login or database required for judging |
| Deployment | Static Vite application, initially targeted to Vercel | Fast, low-risk deployment with no server dependency |
| License | MIT for code; original problem fixtures and SVG assets | Meets the public open-source submission requirement |

---

## 2. Challenge alignment

### 2.1 Official challenge requirement

The challenge asks for a WebMCP-powered web application that explores an open web where humans and agents interact, collaborate, and create together. The official judging criteria are WebMCP Leverage, Execution, Potential Impact, and Creativity & Ambition. WebMCP Leverage is strategically central because the project must demonstrate more than ordinary browser automation or a chatbot beside an app.

### 2.2 Why Mechanism Canvas is a strong WebMCP fit

OpenAI's official site-tools documentation specifically identifies canvases and dashboards as useful shared surfaces for humans and agents. Mechanism Canvas has all the properties that make this interaction meaningful:

- The visual position of a mark is not enough; atoms, bonds, electron sites, charges, and mechanism stages have stable domain meaning.
- The learner and agent must see the same current intermediate, draft arrows, hints, and validation result.
- The agent benefits from structured read access instead of interpreting chemical graphics from a screenshot.
- The learner benefits from high-level, reversible domain actions instead of an agent attempting coordinate-based clicks.
- The learner retains the essential judgment: which electrons should move and whether to accept, reject, or modify a suggestion.
- The app supplies deterministic constraints and evidence that the agent can explain but cannot override.

### 2.3 What becomes possible that is difficult today

Existing chemistry homework systems can grade arrows, and general-purpose agents can discuss mechanisms in prose. The missing interaction is a shared, inspectable workspace where an agent can say, in effect, “I am looking at the exact step you drafted; this arrow starts at lone pair lp_o1_2, this carbon currently has four bonds, and the C–Br bond has not been accounted for,” then visibly focus those entities and let the learner decide what to change.

Without WebMCP, an agent would have to infer atom identity from labels and coordinates, locate hit targets, draw Bézier arrows through browser-control gestures, and guess whether the app accepted the result. With WebMCP, it operates on stable IDs and receives compact, verifiable results while the learner sees every state change.

### 2.4 Rubric strategy

| Judging criterion | Product evidence |
|---|---|
| WebMCP Leverage | Nine purposeful tools; typed atom/bond/electron-site IDs; shared revisioned state; read/write/validate/commit workflow; visible activity log; stale-state protection; agent eval suite |
| Execution | Complete human interface; four reviewed problems; deterministic validation; undo/reset; seeded demo; accessible interaction; deployed app with no login |
| Potential Impact | A focused audience and recurring learning problem; immediate, state-specific formative feedback; a design that preserves learner reasoning instead of replacing it |
| Creativity & Ambition | A molecular canvas as a first-class human-agent workspace; atomic multi-arrow transformations; an agent structurally prevented from inventing the grading result |

### 2.5 Submission constraints that shape the product

- The live URL must work in ChatGPT's in-app browser or supported Chrome with WebMCP enabled.
- WebMCP tools must use top-level imperative JavaScript registration; current ChatGPT support does not discover declarative form tools or tools registered inside iframes.
- A full human interface must work when WebMCP is unavailable.
- The repository must be public and visibly licensed.
- The demo must be public on YouTube, contain audio, and stay under three minutes.
- The deployed app must work consistently as shown in the demo.
- The build and its evidence must be completed within the submission period.

---

## 3. Problem definition

### 3.1 User problem

Introductory organic-chemistry students often learn curved-arrow notation as a set of shapes to reproduce rather than as an accounting language for electron flow, bond formation, bond cleavage, and charge. Paper exercises and static worked solutions provide delayed or post-hoc feedback. Conventional digital homework can mark an answer wrong but often gives limited help connecting that result to the exact source, destination, and companion electron movement the student selected.

General-purpose AI tutors add another problem: they usually do not share the exact live molecular state. A learner must translate a spatial diagram into prose or an image, while the model may misidentify an atom, overlook an existing charge, or explain a chemically different structure. If the model simply reveals the final mechanism, it can short-circuit the reasoning practice the learner needs.

### 3.2 Learning problem to solve

The P0 product addresses one narrow learning objective:

> Given an authored reactant state for a proton-transfer or SN2 step, the learner should identify valid electron sources and destinations, construct the complete set of curved arrows for that elementary step, and use feedback to explain why the resulting bond and charge changes are plausible.

### 3.3 Product opportunity

Create immediate feedback that is:

- **State-specific:** refers to the exact entity IDs and draft arrows on screen.
- **Bounded:** gives only as much help as requested.
- **Evidence-linked:** distinguishes hard electron/valence constraints from exercise-specific accepted pathways.
- **Collaborative:** enables the learner to challenge, reject, or modify the agent's suggestion.
- **Visible:** every tool-driven focus or edit appears in the normal interface.
- **Deterministic at the boundary:** the agent explains validation but does not author the verdict.

### 3.4 Evidence informing the design

Chemistry-education research treats electron-pushing formalism as central to explaining and predicting reaction pathways, while also documenting that students can struggle to attach meaning to the notation. Research prototypes have demonstrated the value of real-time feedback and decision-tree records for electron-movement practice. These findings support three choices in this PRD:

1. Ask the learner to reason from electron source to destination instead of starting from a memorized product.
2. Record the learner's sequence of draft, validation, hint, and revision decisions.
3. Provide progressive feedback rather than revealing the accepted arrow set immediately.

This PRD does **not** claim that Mechanism Canvas improves learning outcomes. That would require a controlled study beyond the hackathon. The initial product will measure interaction quality and correctness proxies only.

---

## 4. Market and differentiation

### 4.1 Existing product category

Mechanism drawing and automatic feedback are not globally new. Pearson Mastering with Marvin, Norton Smartwork, Aktiv Chemistry, Chem21, Reaction Explorer, and Alchemie's Mechanisms product all provide some combination of molecular drawing, curved arrows, worked mechanisms, or immediate feedback.

### 4.2 Differentiation

Mechanism Canvas must not present itself as the first curved-arrow application. Its differentiated contribution is:

- an open WebMCP tool surface for molecular state and mechanism actions;
- a browser agent and learner operating the same state rather than exchanging screenshots or prose descriptions;
- domain-level actions such as `add_draft_arrow` and `check_draft_step`, not pixel-level clicking;
- a deterministic validator whose reasons can be inspected by the agent;
- progressive, learner-controlled scaffolding;
- explicit separation of invariant chemistry errors from “not accepted in this authored exercise” outcomes;
- visible provenance for human actions, agent actions, and validator results;
- a complete no-agent experience that remains useful in an ordinary browser.

### 4.3 Defensible hackathon claim

The defensible claim is not “no chemistry mechanism app exists.” It is:

> Mechanism Canvas demonstrates how a visual chemistry-learning site becomes materially more useful when it exposes molecular semantics and safe mechanism actions directly to an agent sharing the learner's live page.

### 4.4 Competitive failure mode to avoid

If the agent merely asks the app for the correct arrows and draws them automatically, the result is a less educational version of existing homework software. The winning experience must show negotiation and adaptation: the learner drafts, the agent inspects, the app validates, the learner requests a bounded hint, and the learner chooses or explicitly approves the final change.

---

## 5. Product vision and principles

### 5.1 Vision

Make the invisible bookkeeping of introductory reaction mechanisms visible, inspectable, and discussable between a learner and an agent.

### 5.2 Product principles

1. **Electrons before answers.** Start with sources, destinations, and consequences rather than product memorization.
2. **The canvas is the shared truth.** Human UI, WebMCP tools, validation, history, and accessibility views must derive from one state.
3. **Validate atomically.** All arrows in a concerted elementary step are applied to the same pre-state and checked together.
4. **The app grades; the agent coaches.** Only deterministic application logic can label a draft valid for the exercise.
5. **Reveal progressively.** A learner should be able to request a principle, region, source, or full preview as separate levels.
6. **Preserve agency.** The learner can reject, edit, undo, or reset any reversible agent action.
7. **Name the boundary.** An exercise-path mismatch is not automatically described as chemically impossible.
8. **Make agent behavior visible.** Tool actions create focus rings, activity entries, and concise outcome messages.
9. **No WebMCP dependency for basic use.** The normal interface remains complete and accessible.
10. **Scope is a correctness feature.** Fewer reviewed reaction families are better than broad, unreliable chemistry.

---

## 6. Users and use contexts

### 6.1 Primary persona: the mechanism learner

**Profile:** A student in the first semester of undergraduate organic chemistry who understands Lewis structures and formal charge but is beginning curved-arrow mechanisms.

**Needs:**

- Practice identifying electron-rich and electron-poor sites.
- See why an arrow must start at an electron source.
- Understand why concerted steps require more than one arrow.
- Receive feedback without immediately seeing the full solution.
- Ask questions about the exact structure currently on screen.
- Undo experiments without penalty.

**Pain points:**

- Static answer keys show what happened but not how to debug a partial attempt.
- Generic AI explanations can refer to the wrong atom or a different protonation state.
- Full-featured chemical editors impose unnecessary drawing overhead.
- A red “incorrect” result does not distinguish a hard valence error from a missing authored step.

### 6.2 Secondary persona: the instructor or teaching assistant

**Profile:** An organic-chemistry instructor, TA, or peer tutor evaluating whether the product supports reasoning rather than answer copying.

**Needs:**

- Confidence that the included fixtures were reviewed.
- A clear distinction between deterministic invariants and authored accepted paths.
- Visibility into what hints the learner used and what attempts they made.
- A quick way to reset and demonstrate a scenario.

Instructor authoring and class management are not part of the hackathon release.

### 6.3 Judge persona

**Profile:** A technically sophisticated hackathon judge who may not know organic chemistry and may evaluate mainly through the video.

**Needs:**

- Understand the learner's problem within 20 seconds.
- See why semantic site tools outperform coordinate-based browser control.
- Observe at least two handoffs between human and agent.
- See a visible, trustworthy validation result.
- Launch the live app without an account or configuration.

### 6.4 Context of use

- Desktop or laptop browser, with a viewport of at least 1024 × 700 for the judged experience.
- One learner and one browser agent in the same live page and session.
- Short practice sessions of approximately 3–10 minutes.
- No laboratory, clinical, industrial, or safety-critical chemistry use.

---

## 7. Goals, hypotheses, and success measures

### 7.1 Product goals

- Deliver a coherent mechanism-practice experience for two introductory reaction families.
- Demonstrate non-trivial WebMCP reads, reversible writes, validation, and a guarded commit.
- Make the learner's role indispensable to the successful demo.
- Keep every accepted problem and transition deterministic and reviewable.
- Ship a public, accessible, stable application and repository before the deadline.

### 7.2 Product hypotheses

| ID | Hypothesis | Hackathon evidence |
|---|---|---|
| H1 | Stable chemical entity IDs let an agent reason about the live mechanism more reliably than visual clicking | Tool calls use explicit atom, bond, and electron-site IDs; agent evals avoid coordinate operations |
| H2 | Progressive scaffolding preserves more learner agency than automatic solution generation | Demo shows principle-level hint followed by learner correction |
| H3 | Atomic multi-arrow validation produces clearer feedback for concerted steps | Incomplete SN2 step yields a specific missing-companion-arrow result rather than an impossible transient intermediate |
| H4 | A shared command layer keeps human and agent actions coherent | The same draft-arrow command and validator are exercised through UI and WebMCP tests |
| H5 | Visible tool activity increases judge trust and comprehension | Activity trail identifies actor, tool/action, affected entities, and result |

### 7.3 P0 quantitative success criteria

- 100% of authored accepted transitions pass fixture validation.
- 100% of authored negative cases fail with the expected primary reason code.
- 0 invalid or stale draft steps can be committed.
- At least 10 of 12 defined agent-eval prompts produce the expected tool or safe tool sequence during recorded manual evaluation.
- The complete golden-path collaboration can be demonstrated in 90 seconds or less.
- A fresh judge can load the app and start the demo problem in two clicks or fewer.
- All nine P0 WebMCP tools are discoverable in the supported in-app browser from the top-level document.
- Every write tool produces a visible UI change or visible activity result.
- Keyboard-only users can select an electron source and destination, check a step, inspect feedback, and undo.
- The deployed route loads without authentication and without a runtime backend dependency.

### 7.4 Post-hackathon learning metrics

These are future pilot measures, not claims for the submission:

- Percentage of students correcting an invalid draft without a full reveal.
- Average hint depth before a valid step.
- Frequency of misconception codes by problem family.
- Transfer accuracy on a structurally similar but unseen problem.
- Student explanation quality before and after a session.

---

## 8. Scope and prioritization

### 8.1 P0: must ship for the hackathon

- Landing/onboarding view with a one-click seeded demonstration.
- Problem chooser with at least four chemistry-reviewed fixtures.
- Authored SVG molecular graph renderer with stable entity IDs.
- Visible atoms, bonds, formal charges, relevant lone pairs, and reaction context.
- Human two-stage arrow construction: select source, then destination.
- Multi-arrow draft tray and curved-arrow rendering.
- Atomic deterministic validation for proton transfer and SN2.
- Progressive scaffold levels 1–4.
- Check, commit, undo, clear draft, and reset.
- History/reasoning ledger showing drafts, checks, hints, and committed states.
- Actor-aware collaboration trail for human, agent, and validator activity.
- Nine imperative WebMCP tools registered in the top-level document.
- Revision and validation-token protection against stale tool calls.
- Feature-detection fallback when WebMCP is unavailable.
- Versioned local persistence with a visible “Reset demo” action.
- Responsive desktop layout and baseline mobile stacking.
- Keyboard and screen-reader path for the golden workflow.
- Unit, fixture, contract, accessibility, browser, and manual agent-eval evidence.
- Public deployment, repository, license, README, video, and submission copy.

### 8.2 P1: should ship only after P0 is stable

- Two additional reviewed problems, for six total.
- One two-step capstone with an intermediate and history navigation.
- Side-by-side “before this step / after this step” comparison.
- Learner-authored reasoning note after a commit.
- Shareable local session JSON export.
- A reduced-motion curved-arrow animation.
- A compact instructor review view for attempts and hint use.

### 8.3 P2: explicitly post-hackathon

- E2, SN1, electrophilic addition, carbonyl addition, resonance, or rearrangement families.
- Stereochemistry and three-dimensional conformational checks.
- Single-electron fishhook arrows.
- Arbitrary structure drawing, SMILES import, or molecule generation.
- Instructor problem authoring.
- Accounts, classes, gradebook, LMS integration, or cloud sync.
- AI-generated chemistry problems or accepted pathways.
- Automatic reaction-mechanism discovery or energy calculations.
- Multiple simultaneous human collaborators.
- Native mobile applications.
- Assessment claims or adaptive mastery recommendations based on unvalidated models.

### 8.4 Non-goals

Mechanism Canvas will not:

- predict products for arbitrary reactions;
- establish that a pathway is the real experimental mechanism;
- provide laboratory procedure or chemical-safety guidance;
- replace chemical drawing suites such as ChemDraw or Marvin;
- use a language model as the source of chemical truth;
- require the learner to reveal personal or academic records;
- hide the answer graph in agent-visible tool output;
- claim that one authored path is the only chemically conceivable path.

---

## 9. Release content

### 9.1 Supported chemical elements

P0 fixtures may use only H, C, N, O, Cl, Br, and I. Any exception requires an explicit validator rule, test coverage, and chemistry review before inclusion.

### 9.2 P0 reaction families

#### A. Proton-transfer acid–base steps

A two-arrow elementary step:

1. A lone pair on a base forms a bond to an explicit proton.
2. The bond between that proton and its original atom breaks heterolytically, with the electron pair returning to that atom.

#### B. SN2 substitution

A concerted two-arrow elementary step:

1. A lone pair on a nucleophile forms a bond to the electrophilic carbon.
2. The carbon–leaving-group bond breaks heterolytically, with the electron pair moving to the leaving group.

The product renderer will not attempt to animate a chemically real transition state. It will show the accepted before and after Lewis structures and the submitted curved arrows.

### 9.3 Candidate core problems

The exact structures must pass the review gate in Section 20 before shipping.

| ID | Family | Learning focus | Minimum feedback cases |
|---|---|---|---|
| `acid_base_01` | Proton transfer | Arrow begins at a lone pair; explicit transferred proton | Arrow starts at charge label; O–H bond cleavage arrow omitted |
| `acid_base_02` | Proton transfer | Two arrows belong to one atomic step; formal charge changes | Proton selected as electron source; bond electrons sent to wrong atom |
| `sn2_01` | SN2 | Nucleophile attacks electrophilic carbon; leaving-group bond breaks | Only attack arrow drawn; attack directed to leaving group |
| `sn2_02` | SN2 | Correct source/sink identification in a slightly larger substrate | Wrong carbon selected; bond arrow points to carbon instead of leaving group |

Recommended concrete starting fixtures are hydroxide with ammonium, methoxide with methylammonium, hydroxide with bromomethane, and methoxide with bromoethane. These avoid introducing resonance into the P0 acid–base set. They are placeholders until reviewed; fixture IDs and architecture must not depend on their exact identities.

### 9.4 Stretch content

- `acid_base_03`: a proton-transfer case with two plausible basic sites but one authored target appropriate to the exercise context.
- `sn2_capstone_01`: a two-step sequence combining substitution and deprotonation, included only if every intermediate and condition is chemistry-reviewed.

---

## 10. Information architecture

### 10.1 Routes

| Route | Purpose | P0 |
|---|---|---:|
| `/` | Product introduction, browser support, and “Try the guided demo” | Yes |
| `/practice` | Problem chooser and progress summary | Yes |
| `/practice/:problemId` | Shared mechanism workspace | Yes |
| `/about` | Method, limitations, sources, privacy, and WebMCP explanation | Yes, may be a modal or section |
| `/review` | Instructor/session review | P1 |

### 10.2 Workspace regions

1. **Top bar**
   - Product name.
   - Current problem title and family.
   - Step progress.
   - WebMCP availability indicator.
   - Reset and help actions.

2. **Problem brief**
   - Learning objective.
   - Starting materials/reaction context.
   - Plain-language task.
   - “What counts as a step” explanation.

3. **Mechanism canvas**
   - Current molecular graph.
   - Relevant lone pairs and formal charges.
   - Draft curved arrows.
   - Entity focus and selection states.
   - Optional atom-ID learning overlay, disabled by default.

4. **Draft step tray**
   - Ordered list of draft arrows in plain language.
   - Remove/replace controls.
   - Clear draft, check step, and commit actions.

5. **Reasoning ledger**
   - Latest validation summary.
   - Reason codes translated into learner-facing language.
   - Progressive scaffold request.
   - Attempt and hint counts.
   - Committed step history.

6. **Collaboration trail**
   - Actor: learner, agent, or validator.
   - Action.
   - Affected entity IDs and human labels.
   - Outcome.
   - Timestamp relative to session start.

7. **Accessibility mirror**
   - Text list of atoms, bonds, electron sites, and arrows.
   - Live-region feedback after selection and validation.
   - Keyboard instructions.

### 10.3 Desktop layout

- Left column: problem brief and reaction-family guidance, approximately 22% width.
- Center: mechanism canvas and draft controls, approximately 53% width.
- Right column: reasoning ledger and collaboration trail, approximately 25% width.
- At widths below 1024 px, the right column becomes a tabbed drawer below or beside the canvas.
- At widths below 768 px, all regions stack; the canvas remains interactive but judged polish is desktop-first.

---

## 11. Core user journeys

### 11.1 Journey A: first-time guided demo

1. The learner opens the landing page.
2. The page explains in one sentence that curved arrows track electron pairs.
3. The learner selects **Try the guided SN2 demo**.
4. The app loads `sn2_01` in a clean session.
5. A three-step coach mark explains source selection, destination selection, and checking the complete draft.
6. The coach mark disappears and does not block WebMCP tools.
7. The learner can complete the workflow entirely through the human UI.

**Acceptance outcome:** A judge unfamiliar with the app can begin drawing an arrow in under 45 seconds.

### 11.2 Journey B: human drafts; agent diagnoses

1. The learner adds only the nucleophile-to-carbon arrow in the SN2 problem.
2. The learner asks the browser agent, “Check what I drew, but do not fix it.”
3. The agent calls `get_mechanism_state` and `check_draft_step`.
4. The validator returns `INCOMPLETE_CONCERTED_STEP` and identifies the currently unaccounted-for C–Br bond without returning the full accepted answer.
5. The UI shows the validation result and pulses the relevant bond.
6. The agent explains that forming the new bond would overfill carbon unless a companion electron movement occurs.
7. No arrow is added automatically.

**Acceptance outcome:** The app and agent diagnose the exact partial state while preserving the learner's next decision.

### 11.3 Journey C: learner requests bounded help

1. The learner asks, “Give me a hint, but don't show the full arrow.”
2. The agent calls `request_scaffold` with level 1 or 2.
3. The app reveals a principle or candidate region, increments the hint count, and records the action.
4. The learner adds the companion arrow through the UI or asks the agent to draft a specific arrow.
5. Any mutation invalidates the previous validation token.

**Acceptance outcome:** The learner can control how much information is revealed.

### 11.4 Journey D: agent drafts a learner-specified edit

1. The learner says, “Add an arrow from the C–Br bond to bromine.”
2. The agent inspects the entities if needed.
3. It calls `add_draft_arrow` with the exact bond and atom IDs plus the expected state revision.
4. The visible canvas adds the curved arrow and the collaboration trail records the agent action.
5. The tool returns the new revision and a compact, verifiable summary.
6. The learner can remove the draft arrow immediately.

**Acceptance outcome:** A semantic edit changes the shared interface without coordinate-level automation.

### 11.5 Journey E: validate and commit

1. The learner or agent calls **Check step**.
2. The validator evaluates the complete arrow bundle atomically.
3. If valid, the app returns a short-lived validation ID bound to the problem, state revision, draft signature, and expected next state.
4. The learner explicitly asks the agent to apply the validated step, or selects **Commit step** in the UI.
5. `commit_checked_step` verifies the token is current.
6. The molecular graph transitions to the authored next state.
7. The submitted arrows and before-state are added to history.
8. The learner sees bond and charge changes summarized in text.

**Acceptance outcome:** No unvalidated or stale draft can mutate the committed mechanism state.

### 11.6 Journey F: reject or undo

1. The learner disagrees with an agent-drafted arrow or wants to explore another path.
2. The learner removes the arrow or calls `undo_last_commit` after a commit.
3. The app restores the exact previous snapshot and increments the revision.
4. The activity trail records the reversal; it does not delete the historical record.

**Acceptance outcome:** Agent actions remain inspectable and reversible.

---

## 12. Functional requirements

Priority labels:

- **P0:** required for submission.
- **P1:** build only after all P0 acceptance tests pass.
- **P2:** future.

### 12.1 Entry, onboarding, and problem selection

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-001 | The landing page must explain the product, primary user, and WebMCP collaboration in plain language. | P0 | A first-time judge can identify the user and task without scrolling. |
| FR-002 | The landing page must provide a primary “Try the guided SN2 demo” action. | P0 | The action opens `sn2_01` with a fresh or explicitly reset state. |
| FR-003 | The app must display whether site tools are available without blocking ordinary use. | P0 | Unsupported browsers see “Site tools unavailable; manual practice still works.” |
| FR-004 | The problem chooser must show family, objective, difficulty, step count, and review status. | P0 | Unverified problems cannot appear in production builds. |
| FR-005 | Reset must require one confirmation and restore the seeded problem state. | P0 | Reset clears draft, history, hints, validation, focus, and problem-local persistence. |
| FR-006 | Onboarding must be dismissible and replayable. | P0 | Dismissal persists locally; “How it works” restarts it. |

### 12.2 Molecular canvas

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-010 | Render each authored state as SVG using fixture-supplied coordinates. | P0 | Atoms and bonds align at 1024, 1280, and 1440 px widths without overlap or clipping. |
| FR-011 | Every atom, bond, and selectable electron site must have a stable ID independent of screen coordinates. | P0 | Re-rendering or resizing does not change entity IDs. |
| FR-012 | Display all formal charges and all lone pairs that can participate in a P0 accepted or negative case. | P0 | Chemistry fixture snapshot tests match reviewed reference images/data. |
| FR-013 | Participating hydrogens must be explicit entities. | P0 | A transferred proton is addressable by stable ID and keyboard focus. |
| FR-014 | Nonparticipating hydrogens may be implicit but must be represented in the domain model for valence calculations. | P0 | Validator includes implicit bond order in valence totals. |
| FR-015 | Source, target, focused, draft, invalid, and validated states must be visually distinct and not rely on color alone. | P0 | Each state has a shape, icon, label, or line-pattern distinction. |
| FR-016 | Agent focus must visibly pulse or outline affected entities for 1.5–3 seconds and remain listed in the activity trail. | P0 | Reduced-motion preference replaces pulse with a static outline. |
| FR-017 | The canvas must offer a textual entity inspector. | P0 | Selecting an entity exposes label, element/type, charge/order, lone-pair count if applicable, and current role without revealing the accepted answer. |
| FR-018 | The optional ID overlay must show concise human-readable labels such as O1 and C2, not internal UUIDs. | P1 | Toggling the overlay does not alter mechanism state. |

### 12.3 Human arrow construction

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-020 | Arrow construction is a two-stage source-then-destination interaction. | P0 | The current stage and selected source are always visible and announced. |
| FR-021 | P0 sources are an available lone-pair site or a bond containing a transferable electron pair. | P0 | Charges, atom labels, empty space, and unsupported sites cannot become valid sources. |
| FR-022 | P0 destinations are atoms supported by the selected source semantics and current family. | P0 | Invalid targets remain selectable for instructional feedback only if they produce a defined reason code; otherwise they are disabled with an explanation. |
| FR-023 | Adding an arrow changes only the draft; it does not mutate the molecule. | P0 | Bond orders, charges, and committed state stay unchanged until commit. |
| FR-024 | Multiple arrows are rendered from the same pre-state and kept in an ordered draft list. | P0 | SN2 can contain attack and leaving-group arrows simultaneously. |
| FR-025 | Each draft arrow must have a plain-language mirror. | P0 | Example: “Electron pair from oxygen O1 to carbon C2.” |
| FR-026 | The learner can remove one arrow or clear the full draft. | P0 | Removal invalidates prior validation and increments state revision. |
| FR-027 | Arrow paths must use deterministic Bézier geometry with collision offsets for multiple arrows. | P0 | Golden fixtures have no arrowhead/entity overlap at tested viewports. |
| FR-028 | Dragging freehand arrows is out of scope. | P0 constraint | No freehand canvas state or unstructured coordinate-only arrow is stored. |

### 12.4 Validation and commit

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-030 | Checking a draft must evaluate every arrow against one common pre-state. | P0 | The first SN2 arrow never creates a transient five-coordinate committed carbon. |
| FR-031 | The validator must perform schema, source, transformation, conservation, valence, and authored-transition checks in a deterministic order. | P0 | Identical state and draft produce byte-equivalent ordered reason codes. |
| FR-032 | Validation results must distinguish `valid`, `invalid_invariant`, `incomplete`, and `not_accepted_path`. | P0 | UI and tool output never collapse all failures into “chemically impossible.” |
| FR-033 | A valid check must issue a validation ID bound to the problem ID, state revision, draft signature, and next-state ID. | P0 | Changing any bound value makes commit fail with `STALE_VALIDATION`. |
| FR-034 | An invalid check must not expose the complete accepted arrow set unless scaffold level 4 has already been explicitly requested. | P0 | Tool contract tests inspect result keys for answer leakage. |
| FR-035 | Commit must re-run critical invariants and verify the validation ID. | P0 | Tampered or replayed tokens cannot commit. |
| FR-036 | Commit must atomically replace the current graph with the authored next state and record the submitted arrow bundle. | P0 | No intermediate partial graph is observable. |
| FR-037 | A valid but uncommitted draft must remain editable. | P0 | Editing clears valid status and token. |
| FR-038 | Undo must restore the immediately preceding committed snapshot. | P0 | Repeated undo stops safely at the initial state. |
| FR-039 | Validation must complete synchronously from the user's perspective. | P0 | P95 local validation under 100 ms on the target fixture set. |

### 12.5 Feedback and scaffolding

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-040 | Every validation result must include a concise headline, explanation, affected IDs, and category. | P0 | UI can focus all referenced entities. |
| FR-041 | Feedback must state whether it comes from a hard invariant or the authored exercise path. | P0 | An exercise mismatch uses boundary-aware copy. |
| FR-042 | Scaffold levels must be cumulative and explicit. | P0 | The user can see the current highest reveal level and hint count. |
| FR-043 | Level 1 provides a governing principle without identifying a specific answer entity. | P0 | Example form: “Every curved arrow must begin at an electron pair.” |
| FR-044 | Level 2 narrows the region or role, not the exact complete move. | P0 | Example form: “Account for what happens to the bond at the electrophilic carbon.” |
| FR-045 | Level 3 identifies a source or destination but not the complete arrow bundle. | P0 | The exact revealed entity is logged. |
| FR-046 | Level 4 previews the authored accepted arrow bundle but never commits it. | P0 | The learner must still choose to copy/apply and check. |
| FR-047 | The agent cannot lower the recorded hint level or erase hint history. | P0 | Reset is the only operation that starts a clean hint record. |
| FR-048 | Agent prose is not stored as authoritative chemistry. | P0 | Only app-generated reason codes, scaffold text, and structured actions enter the deterministic ledger. |

### 12.6 History and collaboration trail

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-050 | Record draft additions/removals, checks, hints, commits, undo, reset, and focus actions. | P0 | Each record contains actor, command, revision before/after, affected IDs, and result. |
| FR-051 | Actor values are `human`, `agent`, `validator`, or `system`. | P0 | Unknown actor values fail schema validation. |
| FR-052 | History must be append-only within a session except for full reset. | P0 | Undo appends a reversal rather than deleting the earlier commit record. |
| FR-053 | The trail must not show hidden accepted-path data. | P0 | Unrevealed answers are absent from serialized activity records. |
| FR-054 | The latest agent action must be visually identifiable. | P0 | A judge can connect a recent site-tool call to a visible result. |
| FR-055 | A P1 export may include current graph, drafts, validation results, hints, and activity but no hidden answer graph. | P1 | Export schema has no accepted-transition field. |

### 12.7 Persistence

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-060 | Persist problem-local progress in versioned localStorage. | P0 | Reload restores the current committed state, draft, history, and hint depth. |
| FR-061 | Invalid or old persisted data must fail closed to a clean seeded problem. | P0 | Migration errors show a non-blocking “Session reset after an update” message. |
| FR-062 | Provide a URL query `?demo=1` that loads the golden fixture in a known clean state without silently erasing unrelated problem progress. | P0 | Video and judges can reproduce the same starting point. |
| FR-063 | No account, cookie-based identity, or server-side student record is required. | P0 | Network inspection shows no learner data upload after static assets load. |

---

## 13. Experience states and interface behavior

### 13.1 Workspace state machine

```text
loading
  ├─ invalid fixture → fatal_problem_error
  └─ valid fixture → idle

idle
  └─ source selected → selecting_target

selecting_target
  ├─ cancel → idle
  ├─ unsupported destination → target_feedback → selecting_target
  └─ supported destination → drafting

drafting
  ├─ add/remove arrow → drafting (revision increments)
  ├─ clear → idle
  └─ check → checking

checking
  ├─ incomplete → checked_incomplete
  ├─ invariant failure → checked_invalid
  ├─ path mismatch → checked_not_accepted
  └─ accepted → checked_valid

checked_incomplete | checked_invalid | checked_not_accepted
  ├─ request scaffold → same state with greater reveal level
  └─ edit draft → drafting

checked_valid
  ├─ edit draft → drafting and token invalidated
  └─ commit → committed

committed
  ├─ next authored state exists → idle at next step
  ├─ terminal authored state → completed
  └─ undo → previous committed state
```

### 13.2 Empty and initial states

- Before a source is selected, the action prompt reads: “Choose where the electron pair starts.”
- With zero draft arrows, **Check step** is disabled and explains why.
- With an incomplete draft, the learner can check and receive incomplete-step feedback.
- A fresh problem shows no “correct answer” preview.
- The history panel uses instructional empty copy, not a blank rectangle.

### 13.3 Loading states

- Static fixture loading should normally be imperceptible.
- Route transition shows a skeleton only after 150 ms to avoid flicker.
- Tool execution that finishes in under 300 ms uses immediate feedback; longer work shows a non-blocking “Checking this step…” state.
- Duplicate check or commit actions are disabled while the first command is in progress.

### 13.4 Error states

| Error | User-facing behavior | Recovery |
|---|---|---|
| Unknown entity ID | “That atom or bond is no longer in the current state.” | Refresh state; no mutation |
| Stale revision | “The canvas changed before this action ran.” | Agent reads current state and retries only if still appropriate |
| Duplicate arrow | “That electron movement is already in the draft.” | Focus existing arrow |
| Unsupported source | Explain that arrows begin at represented electron pairs or bonds | Return to source selection |
| Stale validation | “Check the edited step again before committing.” | Re-run check |
| Corrupt fixture | Problem unavailable page with problem ID and reset link | Load another verified problem |
| Unsupported WebMCP | Manual UI remains complete | Display setup link in About, not a blocking modal |
| Persistence migration failure | Non-blocking reset message | Start clean fixture |
| Unexpected exception | Error boundary with reset and diagnostic code | Preserve no partial mutation |

### 13.5 Visual response to agent actions

- Read-only tool calls do not mutate application state or the collaboration trail. Their invocation remains inspectable through the browser's site-tool activity surface.
- `focus_entities` applies a cyan outline plus a labeled “Agent focus” chip.
- Agent-added draft arrows use the same chemical arrow style as human arrows but carry a small agent-origin badge in the draft tray.
- Validation results use the same UI regardless of whether human or agent initiated the check.
- Commit shows a short before/after bond-change summary; animation is disabled when reduced motion is requested.
- No action uses a toast as its only persistent evidence.

---

## 14. Chemistry domain model

### 14.1 Modeling philosophy

The chemistry model is a Lewis-structure learning model, not a quantum-mechanical simulation. It represents the entities necessary to teach and validate the included electron-pushing exercises. Every graph and accepted transition is authored. The validator applies limited general invariants and then compares the transformed state with reviewed accepted states.

### 14.2 Stable atom mapping

Atom IDs persist across every authored state of a problem. A transferred hydrogen retains the same atom ID before and after transfer. A leaving group retains its atom ID after bond cleavage. This allows direct comparison of states and avoids general graph-isomorphism complexity.

Internal IDs use semantic fixture-local names such as `o_nucleophile`, `c_electrophile`, and `br_leaving`. The UI displays compact labels such as O1, C2, and Br3. Tool outputs may include both, but descriptions must prefer human-readable labels.

### 14.3 Core types

```ts
type Element = "H" | "C" | "N" | "O" | "Cl" | "Br" | "I";
type BondOrder = 1 | 2 | 3;
type Actor = "human" | "agent" | "validator" | "system";
type ReactionFamily = "proton_transfer" | "sn2";

interface Atom {
  id: string;
  displayLabel: string;
  element: Element;
  formalCharge: number;
  lonePairCount: number;
  implicitHydrogenCount: number;
  x: number;
  y: number;
  ariaDescription: string;
}

interface Bond {
  id: string;
  atomIds: readonly [string, string];
  order: BondOrder;
  style: "plain";
}

interface LonePairSite {
  id: string;
  atomId: string;
  ordinal: number;
  angleDegrees: number;
}

interface MolecularState {
  id: string;
  atoms: Atom[];
  bonds: Bond[];
  lonePairSites: LonePairSite[];
  netCharge: number;
}
```

### 14.4 Electron-arrow model

P0 supports only two-electron curved arrows.

```ts
type ElectronSource =
  | { kind: "lone_pair"; lonePairId: string }
  | { kind: "bond"; bondId: string };

type ElectronTarget =
  | { kind: "atom"; atomId: string };

interface DraftArrow {
  id: string;
  source: ElectronSource;
  target: ElectronTarget;
  actor: Actor;
  createdAtRevision: number;
}
```

The renderer computes arrow geometry from the referenced entities and fixture coordinates. Coordinates are not part of the domain command.

### 14.5 Arrow semantics in P0

#### Lone pair → atom

- Consume one available lone pair from the source atom in the transformed candidate state.
- Add or increase a bond between the source atom and target atom by one order.
- Recalculate relevant formal charges.
- Reject self-bonding and unsupported duplicate bond-order changes.

#### Bond → atom

- The target atom must be one endpoint of the source bond in P0.
- Decrease the source bond order by one; remove it if the order becomes zero.
- Add one lone pair to the target atom in the transformed candidate state.
- Recalculate relevant formal charges.

Bond-to-bond, bond-to-nonendpoint, delocalization, and one-electron semantics are outside P0.

### 14.6 Atomic transformation

Every draft arrow consumes electrons from the same immutable pre-state. The engine first validates that electron sources are available and not double-consumed, then calculates all bond and lone-pair deltas, and only then produces one candidate result.

This is required for a concerted SN2 step: the nucleophile-to-carbon arrow and carbon-to-leaving-group arrow must be considered together. Sequentially mutating the carbon after the first arrow would produce a misleading transient valence failure.

### 14.7 Formal-charge calculation

For P0 Lewis structures:

```text
formal charge =
  element valence electron count
  − nonbonding electron count
  − bond-order sum
```

where nonbonding electron count is twice the lone-pair count and the bond-order sum includes explicit bonds plus authored implicit hydrogen bonds.

Element valence electron counts used by P0:

| Element | Valence electrons |
|---|---:|
| H | 1 |
| C | 4 |
| N | 5 |
| O | 6 |
| Cl | 7 |
| Br | 7 |
| I | 7 |

Fixture loading must verify that stored formal charges equal derived formal charges for every state. A mismatch fails the production build.

### 14.8 Conservative valence constraints

P0 applies only constraints valid for its reviewed fixture set:

- Hydrogen may have one bond order total and no lone pairs in accepted states.
- Carbon in P0 accepted states must have bond-order sum four and no lone pairs.
- Nitrogen, oxygen, and halogens are checked using reviewed allowed Lewis configurations derived from bond-order sum, lone pairs, and formal charge.
- No atom may have a negative lone-pair count.
- No bond may have order below zero or above three.
- Net formal charge must be conserved across an elementary step.
- Atom inventory must be identical across authored states.

The engine must not generalize these constraints into claims about all possible hypervalent, radical, organometallic, or resonance-delocalized chemistry.

### 14.9 Problem and pathway types

```ts
interface MechanismProblem {
  schemaVersion: "mechanism-canvas.problem.v1";
  id: string;
  title: string;
  family: ReactionFamily;
  difficulty: 1 | 2 | 3;
  objective: string;
  prompt: string;
  contextNote?: string;
  initialStateId: string;
  terminalStateIds: string[];
  states: MolecularState[];
  transitions: AuthoredTransition[];
  scaffolds: ScaffoldSet;
  negativeCases: NegativeCase[];
  review: ChemistryReview;
}

interface AuthoredTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  acceptedArrowBundles: AcceptedArrowBundle[];
  changeSummary: string[];
}

interface AcceptedArrowBundle {
  id: string;
  arrows: ExpectedArrow[];
  aliasGroups?: Record<string, string[]>;
}
```

Alias groups allow chemically equivalent choices, such as selecting any visually represented lone pair on the same atom. Alternative reviewed pathways can be listed as additional bundles or transitions. No alternative is accepted merely because an agent proposes it.

### 14.10 Candidate-state signature

Because atom IDs persist across states, the canonical comparison signature is produced by sorting:

1. atom ID, formal charge, lone-pair count, and implicit-hydrogen count; and
2. normalized bond endpoint IDs and order.

Coordinates, display labels, history, actor, and arrow geometry do not affect chemical equivalence.

### 14.11 Validation pipeline

The deterministic pipeline runs in this order:

1. **Problem integrity**
   - Fixture is production-verified.
   - Current state exists in the fixture.

2. **Draft schema**
   - Arrow IDs are unique.
   - All sources and targets exist in the current state.
   - Only P0 source and target kinds are present.

3. **Electron-source availability**
   - Lone pair exists on the referenced atom.
   - Bond exists with positive order.
   - The same lone pair or bond electron pair is not consumed twice.

4. **Transformation construction**
   - Aggregate all bond-order and lone-pair deltas from the common pre-state.
   - Reject unsupported target semantics.

5. **Hard invariants**
   - Atom inventory unchanged.
   - No negative bond order or lone-pair count.
   - Formal charges derive consistently.
   - Net formal charge conserved.
   - P0 valence configuration allowed.

6. **Completeness diagnostics**
   - Detect a partial bundle that corresponds to a known transition prefix.
   - Detect a likely missing companion arrow for proton transfer or SN2.

7. **Authored-path match**
   - Compare the candidate signature with all reviewed outgoing states.
   - Confirm the submitted arrows match a reviewed alias-aware bundle.

8. **Result generation**
   - Return ordered reason codes, affected IDs, evidence category, safe learner-facing copy, and, only if accepted, a validation ID.

### 14.12 Validation status taxonomy

| Status | Meaning | Copy boundary |
|---|---|---|
| `valid` | Hard invariants pass and a reviewed outgoing transition matches | “This step matches an accepted pathway for this exercise.” |
| `incomplete` | Draft resembles part of an accepted elementary step but is missing required electron movement | “This draft does not yet account for the complete elementary step.” |
| `invalid_invariant` | Electron, bond, charge, or supported-valence constraint fails | “This draft violates [specific represented constraint].” |
| `not_accepted_path` | Hard invariants may pass, but no reviewed outgoing transition matches | “This result is not one of the reviewed pathways accepted in this exercise.” |
| `invalid_input` | IDs, schema, or revision are invalid | Operational error, not chemistry feedback |

### 14.13 Misconception and reason codes

| Code | Category | Example trigger | Default affected entity |
|---|---|---|---|
| `SOURCE_HAS_NO_ELECTRON_PAIR` | Invariant | Arrow begins at proton, charge mark, or unsupported atom site | Source |
| `DUPLICATE_ELECTRON_SOURCE` | Invariant | Same lone pair or bond pair used twice | Both arrows |
| `TARGET_NOT_SUPPORTED` | Input/semantics | P0 arrow targets empty space or unsupported entity type | Target |
| `SELF_BOND_ATTEMPT` | Invariant | Lone pair targets its own atom | Source atom |
| `NEGATIVE_BOND_ORDER` | Invariant | Too many arrows remove electrons from the same bond | Bond |
| `VALENCE_EXCEEDED` | Invariant | Candidate gives a P0 atom unsupported bond-order sum | Atom |
| `FORMAL_CHARGE_MISMATCH` | Fixture/internal | Derived and stored charge disagree | Atom/state |
| `NET_CHARGE_NOT_CONSERVED` | Invariant | Candidate total charge differs from pre-state | State |
| `INCOMPLETE_CONCERTED_STEP` | Completeness | Attack arrow present without necessary bond-cleavage arrow | Reaction center/bond |
| `WRONG_REACTION_CENTER` | Exercise | Chemically represented move occurs at the wrong authored site | Selected atom |
| `WRONG_LEAVING_GROUP_DIRECTION` | Exercise | C–X electrons target carbon instead of X | Bond and target |
| `NOT_IN_AUTHORED_PATH` | Exercise boundary | Candidate passes limited invariants but is not reviewed | State |
| `VALID_ACCEPTED_STEP` | Success | Accepted transition and arrow bundle match | Changed entities |
| `STALE_STATE` | Operational | Expected revision differs from current revision | Session |
| `STALE_VALIDATION` | Operational | Draft or state changed after check | Session |

### 14.14 Reason precedence

When several issues exist, the UI shows one primary reason and optional secondary details. Precedence is:

1. invalid input or stale state;
2. unavailable or duplicated electron source;
3. impossible bond/lone-pair delta;
4. formal-charge or net-charge failure;
5. supported valence failure;
6. incomplete concerted step;
7. exercise-path mismatch.

This order prevents an exercise-specific hint from masking a more basic electron-accounting error.

### 14.15 Scaffold model

```ts
interface ScaffoldSet {
  level1Principle: Scaffold;
  level2Region: Scaffold;
  level3Entity: Scaffold;
  level4Preview: Scaffold;
}

interface Scaffold {
  level: 1 | 2 | 3 | 4;
  text: string;
  focusEntityIds: string[];
  revealArrowBundleId?: string;
}
```

- Level 1 contains no answer IDs in tool output beyond entities already implicated by the learner's own draft.
- Level 2 may focus a reaction role or bond region.
- Level 3 may reveal one required source or destination.
- Level 4 may return and render the full reviewed bundle as a noncommitted preview.
- Scaffold content is authored and chemistry-reviewed with the problem.

### 14.16 Validation-token design

A validation record contains:

```ts
interface ValidationRecord {
  id: string;
  problemId: string;
  fromStateId: string;
  expectedRevision: number;
  draftSignature: string;
  nextStateId: string;
  acceptedBundleId: string;
  issuedAt: number;
}
```

The record remains in memory and may be persisted only as part of the current session. Commit resolves the ID against the stored record; the client does not trust token fields supplied by a tool caller. A state mutation or problem change invalidates it.

### 14.17 Example SN2 state

The canonical golden fixture should be structurally equivalent to:

```text
Reactants: hydroxide + bromomethane

Atoms:
- o_nucleophile: O, charge −1, three lone pairs, bonded to explicit H
- h_hydroxide: H, bonded to o_nucleophile
- c_electrophile: C, neutral, three implicit H, bonded to br_leaving
- br_leaving: Br, neutral, three lone pairs

Accepted arrow bundle:
1. lone pair on o_nucleophile → c_electrophile
2. bond c_electrophile–br_leaving → br_leaving

Result:
- new bond o_nucleophile–c_electrophile
- removed bond c_electrophile–br_leaving
- oxygen becomes neutral with two lone pairs
- bromine becomes Br− with four lone pairs
- total charge remains −1
```

The shipped fixture must be reviewed for representation, conditions, labels, lone-pair display, and student-facing explanation before it is marked production-ready.

---

## 15. WebMCP product requirements

### 15.1 Integration principles

- Register imperative tools through `document.modelContext.registerTool(...)` in the top-level document.
- Feature-detect `document.modelContext?.registerTool`; never crash an ordinary browser.
- Reuse the same domain commands and validators used by the human interface.
- Never implement a site tool by simulating a click on the app's own UI.
- Keep inputs narrow, reject additional properties, cap arrays and strings, and validate again at runtime.
- Describe side effects in the tool description.
- Mark genuinely read-only tools with `annotations: { readOnlyHint: true }`.
- Return enough structured information to verify the result without dumping the hidden problem definition.
- Treat tool callers as untrusted; a valid schema is not sufficient authorization to bypass domain invariants.
- Keep tool results compact. The live page is the full visual explanation.
- Do not register tools in an iframe.

### 15.2 Shared revisions

The app maintains two monotonic counters:

- `mechanismRevision`: increments when the committed molecular state or draft-arrow bundle changes.
- `activitySequence`: increments for every application trail event, including focus, check, hint, and write-tool activity. Strictly read-only tools do not increment it.

Validation IDs bind to `mechanismRevision`, not `activitySequence`. Focusing an atom or requesting a hint must not make an otherwise unchanged valid draft stale. Adding, removing, clearing, committing, undoing, resetting, or changing problems must increment `mechanismRevision`.

### 15.3 Common tool-result envelope

```ts
interface ToolResult<T> {
  ok: boolean;
  tool: string;
  mechanismRevision: number;
  activitySequence: number;
  summary: string;
  uiEffect:
    | "none"
    | "focus_changed"
    | "draft_changed"
    | "validation_changed"
    | "scaffold_revealed"
    | "state_committed"
    | "state_undone";
  data?: T;
  error?: {
    code: ToolErrorCode;
    message: string;
    recoverable: boolean;
    currentMechanismRevision?: number;
  };
}
```

Expected operational errors return `ok: false` in this envelope so an agent can recover. Unexpected implementation failures reject the tool promise and are captured by diagnostics.

### 15.4 Entity ID schema

All tool inputs that accept an entity ID use:

```json
{
  "type": "string",
  "minLength": 1,
  "maxLength": 64,
  "pattern": "^[a-z][a-z0-9_]*$"
}
```

Runtime validation also verifies that the ID exists in the current problem and state. Arrays use `uniqueItems: true` and a maximum of eight IDs unless otherwise specified.

### 15.5 Tool catalog

#### Tool 1: `get_mechanism_state`

**Purpose:** Read compact, answer-safe state for the current learning workspace.

**Annotation:** `readOnlyHint: true`

**Description intent:** Use to understand the learner's current problem, committed structure, draft arrows, validation status, and hint depth before reasoning or proposing an action. Does not reveal hidden accepted transitions.

**Input:**

```json
{
  "type": "object",
  "properties": {
    "includeActivityTail": {
      "type": "boolean",
      "default": false
    }
  },
  "additionalProperties": false
}
```

**Output data:**

- Problem ID, title, objective, family, and current step number.
- `mechanismRevision`.
- Current atom, bond, and lone-pair-site summaries.
- Draft arrows with actor and plain-language summaries.
- Latest validation status and reason codes.
- Current scaffold level, attempt count, and hint count.
- Current focused entity IDs.
- Up to five recent activity entries only when requested.
- No outgoing transition, accepted bundle, next-state graph, or unrevealed scaffold text.

**Acceptance tests:**

- Calling it does not mutate mechanism state, focus, validation, or history.
- Two calls at the same revision produce semantically identical chemical data.
- Hidden answer graph keys are absent.

#### Tool 2: `inspect_mechanism_entities`

**Purpose:** Inspect named atoms, bonds, lone pairs, or draft arrows without scanning the entire graph.

**Annotation:** `readOnlyHint: true`

**Description intent:** Use when the learner refers to a particular atom, bond, lone pair, or arrow and exact current properties are needed. Does not state whether an entity belongs to the correct answer.

**Input:**

```json
{
  "type": "object",
  "required": ["entityIds"],
  "properties": {
    "entityIds": {
      "type": "array",
      "minItems": 1,
      "maxItems": 8,
      "uniqueItems": true,
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 64,
        "pattern": "^[a-z][a-z0-9_]*$"
      }
    }
  },
  "additionalProperties": false
}
```

**Output data by kind:**

- Atom: display label, element, formal charge, lone-pair count, implicit H count, neighbors, and bond-order sum.
- Bond: endpoint IDs/labels and order.
- Lone pair: owner atom and availability in the current draft.
- Draft arrow: source, target, actor, and plain-language summary.

**Acceptance tests:**

- Unknown and no-longer-current IDs return `ENTITY_NOT_FOUND` with no partial mutation.
- Inspection never reports “correct target,” “expected arrow,” or equivalent hidden-answer language.

#### Tool 3: `focus_mechanism_entities`

**Purpose:** Focus up to eight current entities in the shared visible workspace.

**Annotation:** not read-only because it changes visible page state.

**Description intent:** Use to direct the learner's attention to entities already relevant to the discussion. This changes only the page focus/highlight, not the molecule, draft, validation, or answer.

**Input:**

```json
{
  "type": "object",
  "required": ["entityIds", "style"],
  "properties": {
    "entityIds": {
      "type": "array",
      "minItems": 1,
      "maxItems": 8,
      "uniqueItems": true,
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 64,
        "pattern": "^[a-z][a-z0-9_]*$"
      }
    },
    "style": {
      "type": "string",
      "enum": ["attention", "compare"]
    }
  },
  "additionalProperties": false
}
```

**Output data:**

- Focused entity IDs and labels.
- Whether each entity is currently visible.
- Viewport action, if the app scrolled the canvas region into view.

**Acceptance tests:**

- Focus does not change `mechanismRevision`.
- Reduced-motion users receive a static focus treatment.
- Focus is visible and recorded in the collaboration trail.

#### Tool 4: `add_draft_arrow`

**Purpose:** Add one reversible, noncommitted electron-pair arrow to the learner's current draft.

**Description intent:** Use only for an arrow the learner requested or clearly approved. This visibly changes the draft but does not transform the molecular state or grade the step.

**Input:**

```json
{
  "type": "object",
  "required": ["source", "target", "expectedMechanismRevision"],
  "properties": {
    "source": {
      "oneOf": [
        {
          "type": "object",
          "required": ["kind", "lonePairId"],
          "properties": {
            "kind": { "const": "lone_pair" },
            "lonePairId": {
              "type": "string",
              "minLength": 1,
              "maxLength": 64
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": ["kind", "bondId"],
          "properties": {
            "kind": { "const": "bond" },
            "bondId": {
              "type": "string",
              "minLength": 1,
              "maxLength": 64
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "target": {
      "type": "object",
      "required": ["kind", "atomId"],
      "properties": {
        "kind": { "const": "atom" },
        "atomId": {
          "type": "string",
          "minLength": 1,
          "maxLength": 64
        }
      },
      "additionalProperties": false
    },
    "expectedMechanismRevision": {
      "type": "integer",
      "minimum": 0
    }
  },
  "additionalProperties": false
}
```

**Output data:**

- New draft-arrow ID.
- Source and target labels.
- New draft-arrow count.
- Changed entity IDs.
- Whether a previous validation was invalidated.
- `undoAvailable: true`.

**Acceptance tests:**

- Stale revision returns `STALE_STATE` and current revision.
- Duplicate source/target pair returns `DUPLICATE_ARROW`.
- The committed molecular graph remains byte-equivalent.
- The arrow appears in the SVG and textual draft tray.

#### Tool 5: `remove_draft_arrow`

**Purpose:** Remove one reversible arrow from the current draft.

**Description intent:** Use when the learner rejects or revises a specific draft arrow. Does not undo a committed mechanism step.

**Input:** `arrowId` plus `expectedMechanismRevision`, with no additional properties.

**Output data:**

- Removed arrow summary.
- Remaining arrow count.
- New mechanism revision.
- Whether a validation record was invalidated.

**Acceptance tests:**

- Only a current draft arrow can be removed.
- An agent cannot remove a committed historical arrow through this tool.
- Removal is visually and textually reflected.

#### Tool 6: `check_draft_step`

**Purpose:** Run deterministic validation on the full current draft without modifying the molecular graph.

**Description intent:** Use when the learner asks whether the current complete or partial draft works. The app, not the agent, determines the status. Checking may update the visible validation panel and attempt history.

**Input:**

```json
{
  "type": "object",
  "required": ["expectedMechanismRevision"],
  "properties": {
    "expectedMechanismRevision": {
      "type": "integer",
      "minimum": 0
    }
  },
  "additionalProperties": false
}
```

**Output data:**

- Status taxonomy value.
- Primary and secondary reason codes.
- Evidence category: `invariant`, `completeness`, or `exercise_path`.
- Safe learner-facing headline and explanation.
- Affected entity IDs.
- Validation ID only for `valid`.
- No full accepted bundle unless level 4 was previously revealed.

**Acceptance tests:**

- Check does not change committed graph, draft, or `mechanismRevision`.
- Check increments attempt count and `activitySequence`.
- A partial SN2 attack arrow returns `incomplete`, not a transient-carbon valence verdict.
- Identical state and draft produce identical ordered chemistry results.

#### Tool 7: `request_scaffold`

**Purpose:** Reveal an authored hint at a learner-selected level.

**Description intent:** Use only after the learner asks for help. Levels increase from a general principle to a full noncommitted preview. This increments the recorded hint depth and visibly reveals the scaffold.

**Input:**

```json
{
  "type": "object",
  "required": ["level", "expectedMechanismRevision"],
  "properties": {
    "level": {
      "type": "integer",
      "minimum": 1,
      "maximum": 4
    },
    "expectedMechanismRevision": {
      "type": "integer",
      "minimum": 0
    }
  },
  "additionalProperties": false
}
```

**Output data:**

- Requested and effective scaffold level.
- Authored text.
- Focus entity IDs at that level.
- At level 4 only, the revealed noncommitted arrow preview.
- Updated hint count.

**Acceptance tests:**

- A request below the current reveal level does not erase history or reduce the level.
- Level 1 does not expose the accepted full move.
- Level 4 does not modify the draft or committed graph.
- The exact revealed content is visible in the UI and recorded.

#### Tool 8: `commit_checked_step`

**Purpose:** Commit a currently validated draft to the next authored molecular state.

**Description intent:** Use only after the learner explicitly asks to apply or commit the validated step. This changes the molecular state, clears the draft, and appends history. It cannot commit an unchecked, invalid, or stale draft.

**Input:**

```json
{
  "type": "object",
  "required": [
    "validationId",
    "expectedMechanismRevision"
  ],
  "properties": {
    "validationId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 96
    },
    "expectedMechanismRevision": {
      "type": "integer",
      "minimum": 0
    }
  },
  "additionalProperties": false
}
```

**Output data:**

- Previous and next state IDs.
- New mechanism revision.
- Bond changes, formal-charge changes, and affected entity IDs.
- Whether the problem is complete.
- Undo availability.

**Acceptance tests:**

- The handler checks current validation and state; tool invocation never bypasses domain validation.
- The tool description and agent evals require explicit learner intent. The site itself does not claim it can authenticate the natural-language conversation that preceded the call.
- Replaying a used validation ID fails.
- State, draft clearing, history, and persistence update atomically.

#### Tool 9: `undo_last_commit`

**Purpose:** Restore the immediately previous committed molecular state.

**Description intent:** Use only when the learner asks to undo the last committed step. This does not erase history and cannot go earlier than the initial state.

**Input:** `expectedMechanismRevision`, with no additional properties.

**Output data:**

- Restored state ID.
- New mechanism revision.
- Reverted bond/charge changes.
- Whether another undo remains available.

**Acceptance tests:**

- Undo at the initial state returns `NOTHING_TO_UNDO` with no mutation.
- Undo appends a reversal record.
- The restored SVG and text mirror match the original snapshot.

### 15.6 Tools intentionally omitted

- No `get_correct_answer`.
- No `list_valid_targets` that silently exposes the expected move.
- No `generate_problem`.
- No `modify_atom_charge` or low-level graph mutation.
- No coordinate-based `click_atom` or `draw_curve`.
- No tool for arbitrary prose insertion into trusted validation content.
- No direct problem-switching tool in P0; the learner chooses the exercise through the normal UI.

### 15.7 Registration lifecycle

- Register tools once after the application store and verified fixture are ready.
- Tool callbacks must read the store at execution time, not capture stale React render state.
- Development hot reload must not leave duplicate registrations.
- Navigation within the single-page app keeps tool names stable; their results reflect the current problem route.
- Closing or navigating away naturally removes page tools.
- If registration fails, the app logs a diagnostic, shows site tools as unavailable, and preserves manual functionality.
- Tool execution honors an abort signal when the current WebMCP implementation supplies one.

### 15.8 Example registration shape

```ts
if (typeof document.modelContext?.registerTool === "function") {
  await document.modelContext.registerTool({
    name: "get_mechanism_state",
    description:
      "Read the current Mechanism Canvas problem, molecular entities, draft arrows, " +
      "validation status, and hint depth. This is read-only and does not reveal hidden accepted paths.",
    inputSchema: {
      type: "object",
      properties: {
        includeActivityTail: { type: "boolean", default: false },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    execute: async (input) => webMcpCommands.getMechanismState(input),
  });
}
```

The implementation must use the exact current browser API verified during development; this example establishes the product contract, not a substitute for compatibility testing.

---

## 16. System architecture

### 16.1 Architecture decision

Mechanism Canvas is a static, client-side TypeScript application. It does not need an application server or an in-app model API for P0. The browser agent supplies natural-language reasoning; the site supplies the visual interface, domain state, authored content, deterministic validation, and WebMCP actions.

### 16.2 Proposed stack

- React and TypeScript.
- Vite for build and static bundling.
- A framework-independent vanilla state store that React and WebMCP handlers can both access.
- Zod or equivalent runtime schemas for fixtures, persistence, commands, and tool inputs.
- Native SVG for molecular and curved-arrow rendering.
- Vitest for domain and contract tests.
- Testing Library for component interaction tests.
- Playwright for end-to-end and viewport checks.
- axe integration for automated accessibility checks.
- Static deployment to Vercel, with no serverless functions required.

Library versions will be pinned when the repository is created and documented in the lockfile. No dependency should be introduced merely to render the four fixed-layout molecular graphs.

### 16.3 High-level data flow

```text
Human UI action ───────────────┐
                              │
WebMCP tool invocation ───────┼──> Runtime input schema
                              │          │
Persistence restore ──────────┘          v
                                  Domain command dispatcher
                                           │
                         ┌─────────────────┼─────────────────┐
                         v                 v                 v
                    Draft reducer    Validator/transform   View focus
                         │                 │                 │
                         └─────────────────┼─────────────────┘
                                           v
                                  Authoritative app store
                                      │    │    │
                    ┌─────────────────┘    │    └─────────────────┐
                    v                      v                      v
               SVG + controls      Activity/reasoning       Tool result
                                          ledger
```

### 16.4 Source-of-truth rule

There is one authoritative app store. React components never maintain a second chemical graph in component-local state. WebMCP handlers never scrape rendered SVG. Both dispatch the same typed domain commands.

View-only transient state such as hover may remain component-local, but selection, focus, draft arrows, validation, scaffolds, history, and revisions belong to the store.

### 16.5 Suggested repository structure

```text
mechanism-canvas/
├── LICENSE
├── README.md
├── HACKATHON.md
├── package.json
├── vite.config.ts
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── error-boundary.tsx
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── MechanismCanvas.tsx
│   │   │   ├── AtomNode.tsx
│   │   │   ├── BondEdge.tsx
│   │   │   ├── LonePairSite.tsx
│   │   │   └── CurvedArrow.tsx
│   │   ├── workspace/
│   │   │   ├── DraftTray.tsx
│   │   │   ├── ReasoningLedger.tsx
│   │   │   ├── CollaborationTrail.tsx
│   │   │   └── EntityInspector.tsx
│   │   └── common/
│   ├── domain/
│   │   ├── types.ts
│   │   ├── commands.ts
│   │   ├── command-dispatcher.ts
│   │   ├── transform-electrons.ts
│   │   ├── derive-formal-charge.ts
│   │   ├── validate-draft.ts
│   │   ├── canonical-signature.ts
│   │   ├── reason-codes.ts
│   │   └── scaffold.ts
│   ├── problems/
│   │   ├── schema.ts
│   │   ├── registry.ts
│   │   ├── acid-base-01.ts
│   │   ├── acid-base-02.ts
│   │   ├── sn2-01.ts
│   │   └── sn2-02.ts
│   ├── store/
│   │   ├── mechanism-store.ts
│   │   ├── persistence.ts
│   │   └── migrations.ts
│   ├── webmcp/
│   │   ├── register-tools.ts
│   │   ├── schemas.ts
│   │   ├── handlers.ts
│   │   ├── results.ts
│   │   └── support.ts
│   ├── accessibility/
│   │   ├── entity-descriptions.ts
│   │   └── keyboard-controller.ts
│   └── styles/
├── tests/
│   ├── domain/
│   ├── fixtures/
│   ├── webmcp/
│   ├── components/
│   ├── e2e/
│   └── accessibility/
├── evals/
│   ├── tool-journeys.json
│   ├── manual-results.md
│   └── README.md
├── docs/
│   ├── CHEMISTRY_REVIEW.md
│   ├── ARCHITECTURE.md
│   └── DEMO_SCRIPT.md
└── public/
    └── social-card.*
```

### 16.6 Domain commands

UI and tool handlers dispatch commands shaped like:

```ts
type DomainCommand =
  | { type: "draft.addArrow"; actor: Actor; input: AddArrowInput }
  | { type: "draft.removeArrow"; actor: Actor; input: RemoveArrowInput }
  | { type: "draft.clear"; actor: Actor }
  | { type: "draft.check"; actor: Actor }
  | { type: "scaffold.reveal"; actor: Actor; level: 1 | 2 | 3 | 4 }
  | { type: "step.commit"; actor: Actor; validationId: string }
  | { type: "step.undo"; actor: Actor }
  | { type: "view.focus"; actor: Actor; entityIds: string[] }
  | { type: "problem.reset"; actor: Actor };
```

The dispatcher:

1. validates command input;
2. checks expected revision where applicable;
3. runs the pure reducer/validator;
4. commits one atomic store update;
5. appends an activity record;
6. schedules persistence;
7. returns a structured result for either UI or WebMCP adapter.

### 16.7 Persistence schema

```ts
interface PersistedSessionV1 {
  schemaVersion: "mechanism-canvas.session.v1";
  problemId: string;
  currentStateId: string;
  draftArrows: DraftArrow[];
  history: CommittedStepRecord[];
  activity: ActivityRecord[];
  highestScaffoldLevel: 0 | 1 | 2 | 3 | 4;
  hintCount: number;
  attemptCount: number;
  mechanismRevision: number;
}
```

Validation IDs are not restored after a full browser restart. A valid-looking restored draft must be checked again before commit.

### 16.8 Build-time fixture validation

A build script must:

- parse every production problem with the runtime schema;
- verify unique IDs;
- verify stable atom inventory across states;
- derive and compare formal charges;
- calculate net charge;
- verify bond endpoints and lone-pair owners;
- verify every accepted bundle transforms its source into its declared target;
- verify every negative case returns its declared primary reason;
- ensure all production problems have `review.status: "verified"`;
- fail the build on any warning classified as chemistry-critical.

### 16.9 Performance budget

- Initial compressed JavaScript target: under 300 KB if practical; hard ceiling 500 KB.
- No general cheminformatics engine in P0.
- Largest contentful paint target: under 2 seconds on a typical broadband laptop.
- Local domain command target: under 50 ms median, under 100 ms P95.
- Canvas update after a tool result: next animation frame or under 100 ms.
- No runtime network call is required after static assets load.

### 16.10 Browser support

P0 test matrix:

- Current ChatGPT desktop in-app browser with site tools enabled.
- Chrome version required by the challenge with the WebMCP testing flag enabled.
- Current Chrome without WebMCP, to verify human fallback.
- Safari or Firefox manual fallback as best effort; WebMCP behavior is not required there.

---

## 17. Product data and state contracts

### 17.1 Session state

```ts
interface MechanismSession {
  problemId: string;
  currentStateId: string;
  stepIndex: number;
  draftArrows: DraftArrow[];
  selection:
    | { phase: "idle" }
    | { phase: "selecting_target"; source: ElectronSource };
  latestValidation: ValidationResult | null;
  activeValidationId: string | null;
  highestScaffoldLevel: 0 | 1 | 2 | 3 | 4;
  hintCount: number;
  attemptCount: number;
  focusEntityIds: string[];
  history: CommittedStepRecord[];
  activity: ActivityRecord[];
  mechanismRevision: number;
  activitySequence: number;
}
```

### 17.2 Activity record

```ts
interface ActivityRecord {
  id: string;
  sequence: number;
  actor: Actor;
  command: string;
  result: "succeeded" | "rejected" | "informational";
  mechanismRevisionBefore: number;
  mechanismRevisionAfter: number;
  affectedEntityIds: string[];
  summary: string;
  elapsedMsFromSessionStart: number;
}
```

No wall-clock identity, IP address, account, raw agent prompt, or hidden model reasoning is stored.

### 17.3 Committed step record

```ts
interface CommittedStepRecord {
  id: string;
  fromStateId: string;
  toStateId: string;
  arrows: DraftArrow[];
  acceptedBundleId: string;
  validationReasonCodes: string[];
  committedBy: "human" | "agent";
  mechanismRevision: number;
}
```

### 17.4 Public state versus private authored data

**Safe for UI and tool output:**

- Current graph.
- Current draft.
- Validation status and reason codes.
- Revealed scaffolds.
- Activity and attempt counts.
- Committed past steps.

**Private to the validator until revealed:**

- Outgoing authored target states.
- Accepted arrow bundles.
- Unrevealed scaffold content.
- Negative-case answer metadata.
- Fixture author notes.

Private means excluded from tool results and routine serialized session state. Because the app is open-source and client-side, a determined developer can inspect fixtures; the boundary is pedagogical, not a security claim.

---

## 18. Visual and interaction direction

### 18.1 Art direction

The interface should feel like a precise contemporary lab notebook, not a generic AI dashboard. The molecule and electron movement are the visual protagonists.

Recommended qualities:

- warm off-white or very pale neutral workspace;
- dark graphite molecular lines;
- restrained blue/cyan for agent attention;
- amber for unvalidated draft arrows;
- deep green plus check pattern/icon for accepted steps;
- red plus dashed/error marker for hard constraint failures;
- serif or scholarly display accent used sparingly, paired with a highly legible sans-serif interface face;
- generous whitespace around molecular structures;
- thin rules, compact labels, and visible evidence rather than card-heavy decoration.

Avoid:

- neon gradients, glowing AI orbs, chat bubbles inside the app, or generic “copilot” chrome;
- skeuomorphic laboratory glassware;
- excessive molecule animation;
- colors as the sole state signal;
- a full chemical-editor toolbar.

### 18.2 Color semantics

| State | Color role | Non-color signal |
|---|---|---|
| Neutral molecule | Graphite | Standard solid stroke |
| Human selection | Violet or dark blue | Double focus ring + “Selected source/target” label |
| Agent focus | Cyan | Bracket outline + “Agent focus” chip |
| Draft arrow | Amber | Open arrowhead and “Draft” badge |
| Validated draft | Green | Solid arrowhead + check icon |
| Invariant failure | Red | Dashed outline + error icon |
| Exercise mismatch | Magenta or rust | Dotted outline + “Outside reviewed path” label |

Final colors must pass contrast testing and may change during implementation.

### 18.3 Curved-arrow rendering

- Use quadratic or cubic Bézier SVG paths.
- Place the tail at the selected lone-pair or bond electron site.
- Place the arrowhead near, not on top of, the target atom center.
- Automatically offset parallel or crossing arrows in golden fixtures.
- Arrowhead direction must remain legible at 100% browser zoom.
- Text mirror is authoritative for accessibility if geometry is ambiguous.
- Do not animate electrons as literal particles; use a brief path draw only after commit if motion is enabled.

### 18.4 Responsive behavior

- **≥1200 px:** full three-column workspace.
- **1024–1199 px:** narrower left brief, full canvas, tabbed right panel.
- **768–1023 px:** brief above canvas, ledger/trail below in tabs.
- **<768 px:** stacked experience; canvas supports pan only if the authored structure cannot fit. No horizontal page overflow.

The hackathon video and primary visual QA target 1440 × 900.

### 18.5 Copy style

- Use direct, calm, explanatory language.
- Prefer “electron pair,” “source,” “destination,” “bond,” and “reviewed pathway.”
- Avoid anthropomorphism such as atoms “wanting” electrons unless an instructor explicitly approves it as a scaffold.
- Avoid “obviously,” “simply,” and shame-oriented feedback.
- Never say “the agent knows” when the app returned deterministic evidence.
- State boundaries: “for this exercise,” “in the represented Lewis structure,” and “based on the reviewed pathway.”

---

## 19. Accessibility requirements

### 19.1 Standard

Target WCAG 2.2 AA for the golden path. Automated checks are necessary but not sufficient; keyboard and screen-reader journeys must be manually verified.

### 19.2 Keyboard interaction

- Tab reaches the problem controls, canvas entity list, draft tray, validation panel, and trail in a logical order.
- Arrow keys move between adjacent entities within the molecular canvas.
- Enter or Space selects a source or destination.
- Escape cancels source selection or closes a nonmodal inspector.
- Delete/Backspace removes the focused draft arrow only after a clear accessible label.
- Shortcuts are optional; every action has a visible control.
- Focus never disappears after an SVG update or committed state transition.

### 19.3 SVG semantics

- The canvas has a descriptive accessible name including problem title and current step.
- Each interactive atom, bond, lone pair, and arrow is keyboard focusable.
- Atom label example: “Oxygen O1, formal charge negative one, three lone pairs, bonded to hydrogen H1.”
- Bond label example: “Single bond B2 between carbon C2 and bromine Br3.”
- Draft arrow example: “Draft arrow A1, electron pair from lone pair on oxygen O1 to carbon C2, added by learner.”
- Decorative lines and charge placement helpers are hidden from assistive technology.

### 19.4 Textual mirror

The accessibility mirror must permit the complete golden workflow without relying on spatial interpretation:

1. Choose a source from grouped available electron sites and bonds.
2. Choose a destination from current atoms.
3. Read the draft-arrow list.
4. Check the step.
5. Read validation and affected entities.
6. Request a scaffold.
7. Commit or edit.

### 19.5 Live announcements

- Selection changes: polite live region.
- Validation result: assertive only for the headline, followed by normal document content.
- Agent focus: polite announcement naming affected entities.
- Commit: polite before/after summary.
- Avoid announcing every animation frame or hover change.

### 19.6 Visual accessibility

- Body text contrast at least 4.5:1; large text and graphical controls at least 3:1.
- Focus indicator contrast at least 3:1 against adjacent colors.
- Click/touch targets at least 24 × 24 CSS px, with 44 × 44 preferred around sparse atoms.
- 200% text zoom must not hide controls or validation messages.
- Reduced-motion mode disables path-draw and pulse animations.
- Color-blind checks cover draft, valid, invariant failure, and path mismatch states.

---

## 20. Chemistry content review and evidence

### 20.1 Why review is a release gate

The application can be technically correct and still teach the wrong representation, use an implausible substrate/context, omit a meaningful charge, or describe an exercise-specific pathway too broadly. Every production fixture, accepted transition, negative case, scaffold, and explanation therefore requires chemistry review separate from code review.

### 20.2 Review status

```ts
interface ChemistryReview {
  status: "draft" | "in_review" | "verified";
  reviewedAt?: string;
  reviewerRole?: string;
  sources: {
    title: string;
    urlOrDoi: string;
    note: string;
  }[];
  checklist: {
    atomInventory: boolean;
    bondOrders: boolean;
    lonePairs: boolean;
    formalCharges: boolean;
    netCharge: boolean;
    arrowOrigins: boolean;
    arrowDestinations: boolean;
    concertedStep: boolean;
    conditionsAndScope: boolean;
    feedbackLanguage: boolean;
    alternativesConsidered: boolean;
  };
}
```

The public fixture need not expose a reviewer's personal name. The repository must document the review method and sources.

### 20.3 Verification standard

A problem may be marked `verified` only when:

1. Every state passes automated electron, charge, atom-inventory, and bond checks.
2. Every accepted arrow bundle produces the declared next state.
3. At least four deliberately incorrect drafts return the expected feedback category.
4. The representation and pathway have been checked against at least two reputable chemistry sources.
5. Ideally, an organic-chemistry instructor, TA, advanced student, or practicing chemist independently reviews the fixture and student-facing language.
6. Any disagreement or alternative pathway is resolved by narrowing the prompt or adding an accepted alternative—not by asserting unsupported certainty.
7. The content states relevant simplifications, such as omitted solvent or kinetics, when they could affect interpretation.

If independent human review is unavailable, the fixture remains an educational prototype and must not be described as instructor-verified. Unreviewed stretch content must be removed rather than rushed into production.

### 20.4 Per-problem review packet

Each problem's pull request or review document should contain:

- Reactants and products/intermediates in readable notation.
- Starting-state SVG screenshot.
- Accepted arrow bundle screenshot.
- Result-state screenshot.
- Derived atom table with charge, lone pairs, implicit H, and bond-order sum.
- Net charge before and after.
- Plain-language objective.
- All four scaffold levels.
- Negative-case table and expected reason codes.
- Known simplifications.
- Alternatives considered.
- Sources.
- Reviewer disposition and requested changes.

### 20.5 Required source boundary

Sources inform the authored content; they are not copied wholesale into the app. Molecule layouts, problem text, hints, and diagrams should be original. If an external diagram or asset is used, its license must permit redistribution and be documented.

---

## 21. Safety, privacy, and security

### 21.1 Educational safety boundary

Mechanism Canvas is an educational representation tool. It must display:

> Educational prototype for introductory mechanism practice. It does not predict experimental outcomes, reaction conditions, safety, yield, or the true physical mechanism of an arbitrary reaction.

The app must not provide synthesis procedure, quantities, temperature, hazardous-material advice, or laboratory execution steps.

### 21.2 Agent authority boundary

- The agent may read current public learning state.
- The agent may focus entities.
- The agent may create or remove reversible draft arrows when requested.
- The agent may invoke deterministic checking.
- The agent may reveal an authored scaffold when requested.
- The agent may commit or undo only after explicit learner instruction and a current validation.
- The agent may never modify problem fixtures, accepted paths, validation rules, or review metadata at runtime.
- The agent may never label an unchecked step correct.

The app can enforce validation, revisions, and reversibility; it cannot independently prove what the learner said in the surrounding agent conversation. Explicit-intent behavior therefore relies on accurate tool descriptions, normal browser safety review, visible effects, and agent evaluations. The product must not present an input boolean as proof of human consent.

### 21.3 WebMCP input security

- All object schemas use `additionalProperties: false`.
- Strings and arrays have explicit maximum lengths.
- IDs must match a restrictive pattern and current-state lookup.
- Numeric revisions are nonnegative integers.
- No tool accepts raw HTML, Markdown, URLs, code, selectors, coordinates, or arbitrary JSON blobs.
- Runtime schemas validate independently of browser-provided JSON Schema validation.
- Tool descriptions and metadata are static source strings, not user-authored content.
- Tool callbacks never use `eval`, dynamic function construction, or unsafe HTML insertion.

### 21.4 Output safety

- Tool results contain only current problem/session data.
- Hidden accepted paths and unrevealed scaffolds are omitted.
- User-visible strings are rendered as text, not HTML.
- No external content is fetched or embedded in P0.
- The application must not treat a tool result or agent explanation as a trusted validator result.
- Error messages avoid stack traces and internal file paths in production.

### 21.5 Privacy

- No account or personal profile.
- No collection of names, emails, course enrollment, grades, or chat transcripts.
- No remote analytics in P0 unless explicitly added and disclosed before release.
- localStorage contains only problem progress and the local collaboration trail.
- A visible reset removes local Mechanism Canvas data.
- README and About page document local persistence.

### 21.6 Secrets and infrastructure

- P0 needs no API key.
- No secret may appear in the client bundle, repository, screenshots, video, or sample environment file.
- Deployment configuration should be static.
- Dependency licenses and known vulnerabilities are checked before submission.
- Production source maps are optional; if enabled, they must not expose secrets because none should exist.

### 21.7 Threat and failure scenarios

| Scenario | Mitigation |
|---|---|
| Agent calls a write tool using a stale state | Expected revision check; return current revision; no mutation |
| Agent tries to commit an unchecked step | Current validation ID required and rechecked |
| Agent supplies fabricated validation ID | Resolve only against in-memory record |
| Agent requests level 4 without learner asking | Tool description and manual eval require user intent; visible reveal remains noncommitted |
| Tool input names an entity from another problem | Current route/state lookup rejects it |
| User manipulates localStorage | Full runtime parse; verified fixture remains authoritative; invalid session resets |
| Authored prompt contains injection-like text | Production fixtures are static, reviewed content; no arbitrary imports |
| Concurrent human and agent actions race | Mechanism revision makes one command stale; store update is atomic |
| App throws during commit | Build next state before atomic store swap; error boundary preserves prior state |

---

## 22. Non-functional requirements

### 22.1 Reliability

- All P0 actions work after a hard reload on the production URL.
- The golden demo does not depend on a third-party API or network request after load.
- Domain commands are deterministic and side-effect-free until the store commit boundary.
- Unexpected errors cannot leave a partially transformed graph.
- The app works without localStorage by falling back to in-memory state and showing a non-blocking notice.

### 22.2 Maintainability

- Chemistry fixtures contain data, not imperative validator code.
- Reaction-family-specific diagnostics are isolated from general invariants.
- Every reason code has one stable definition, default copy, severity/category, and test.
- Tool handlers are thin adapters around domain commands.
- Public types and schemas are versioned.
- No component owns business rules.

### 22.3 Observability

P0 observability is local and privacy-preserving:

- Development console logs tool registration success/failure.
- A `?debug=1` panel may show current revisions, registered tool names, last command, and fixture ID.
- Production collaboration trail shows user-relevant actions, not implementation stack traces.
- Manual WebMCP evaluation results are recorded in the repository.
- Deployment health is verified with a documented smoke test.

### 22.4 Internationalization

English only for the hackathon. Copy is centralized enough to permit later localization. Chemical symbols and entity IDs must not be embedded in translated prose-only logic.

### 22.5 Legal and licensing

- MIT license visible at repository root and in repository metadata.
- All included problem text and SVG layouts are original or properly licensed.
- No copyrighted textbook figures, screenshots, or problem statements.
- Demo uses no unlicensed music or third-party marks beyond nominative references permitted in the submission.

---

## 23. Test strategy

### 23.1 Testing pyramid

1. Pure domain and fixture tests.
2. Command and WebMCP contract tests.
3. Component and accessibility tests.
4. Browser end-to-end tests.
5. Manual site-tool and agent journey evaluations.
6. Chemistry content review.
7. Visual QA at target viewports.

Automated tests establish implementation behavior. They do not replace chemistry review, agent testing, accessibility testing, or visual inspection.

### 23.2 Domain unit tests

Required categories:

- Formal-charge derivation for each supported element configuration.
- Net-charge calculation.
- Lone-pair-to-atom transformation.
- Bond-to-endpoint transformation.
- Atomic application of two arrows from a common pre-state.
- Duplicate electron-source rejection.
- Negative bond-order rejection.
- P0 valence rejection.
- Canonical state signature stability.
- Alias-aware arrow-bundle matching.
- Deterministic reason precedence.
- Validation-token invalidation.
- Undo snapshot restoration.

### 23.3 Fixture tests

For every production problem:

- Initial and all authored states parse.
- Entity IDs are unique and stable.
- Derived formal charges match.
- Net charge matches declared value.
- Every accepted bundle yields exactly the target signature.
- At least four negative drafts yield the declared primary reason.
- Each scaffold references valid entity IDs.
- Level 1 does not contain hidden complete-answer data.
- Review status is verified.
- Screenshots or serialized snapshots are reviewed after intentional changes.

### 23.4 Command tests

- Human and agent actors receive the same chemistry result for the same command.
- A successful write increments the proper revision once.
- A rejected write increments no mechanism revision.
- Focus and check change activity sequence but not mechanism revision.
- Every command appends the correct activity result.
- Persistence receives only valid post-command state.
- Concurrent stale commands cannot both succeed.

### 23.5 WebMCP contract tests

For every tool:

- Registration metadata is valid and description states side effects.
- Valid input returns the common envelope.
- Missing required fields fail.
- Additional fields fail.
- Overlong IDs and arrays fail.
- Unknown entity and stale revision fail safely.
- Read-only tools produce no store mutation.
- Write tools call the same command layer as the UI.
- Results contain verification data and no hidden answer fields.
- A tool failure does not break later tool calls.

### 23.6 Component tests

- Source and target selection.
- Keyboard selection and cancellation.
- Draft tray parity with SVG arrows.
- Validation headline and affected-entity focus.
- Scaffold-level progression.
- Commit disabled until valid.
- Undo and reset confirmations.
- WebMCP availability fallback.
- Error boundary recovery.
- Live-region announcements.

### 23.7 End-to-end journeys

| E2E ID | Journey | Required result |
|---|---|---|
| E2E-01 | Load demo and complete SN2 manually | Terminal state reached and history recorded |
| E2E-02 | Submit only attack arrow | Incomplete concerted-step feedback |
| E2E-03 | Add wrong bond-cleavage target | Specific path/direction feedback; no commit |
| E2E-04 | Reveal levels 1–4 | Progressive copy and no automatic mutation |
| E2E-05 | Validate, edit, then use old token | Stale validation rejection |
| E2E-06 | Commit and undo | Exact initial state restored |
| E2E-07 | Reload in-progress draft | State restored; validation token absent |
| E2E-08 | Use keyboard-only textual mirror | Complete golden path without pointer |
| E2E-09 | WebMCP unsupported | Full manual path still works |
| E2E-10 | Mobile narrow viewport | No page overflow; core controls reachable |

### 23.8 Accessibility QA

- Automated axe scan on landing, chooser, idle workspace, invalid result, valid result, and completed state.
- Manual keyboard traversal at 100% and 200% zoom.
- VoiceOver or equivalent screen-reader check of the golden path.
- Reduced-motion check.
- High-contrast and color-blind simulation.
- Focus retention after SVG state replacement.

### 23.9 Visual QA

Capture and inspect:

- 1440 × 900 primary desktop.
- 1280 × 800 common laptop.
- 1024 × 768 minimum judged desktop.
- 768 × 1024 tablet.
- 390 × 844 mobile fallback.

Inspect for:

- atom/bond/lone-pair overlap;
- arrowhead placement;
- charge readability;
- focus and error-state distinction;
- panel clipping;
- text wrapping;
- scroll traps;
- empty-state balance;
- reduced-motion rendering;
- browser zoom at 80%, 100%, 125%, and 200%.

### 23.10 Supported-browser site-tool test

For each supported agent environment:

1. Open the production URL directly.
2. Verify all nine tools are discoverable.
3. Inspect tool metadata.
4. Run one read tool.
5. Run focus, add arrow, check, scaffold, commit, and undo.
6. Verify every call changes the visible page as promised.
7. Verify recent site-tool activity is inspectable.
8. Hard reload and repeat from a clean demo URL.

Current official OpenAI documentation should be rechecked on release day for model and workspace availability. At PRD creation time, it identifies GPT-5.6 Sol and Terra as site-tool-capable and says Luna has site tools disabled.

---

## 24. Agent evaluation plan

### 24.1 Purpose

Unit tests prove handler behavior when a tool is called. Agent evaluations test whether a browser agent chooses an appropriate tool, passes correct arguments, respects learner intent, and recovers from structured errors.

### 24.2 Evaluation record

Each manual run records:

- date and deployed commit;
- browser/app and model;
- initial problem/session fixture;
- exact user prompt;
- discovered tool set;
- actual tool sequence and arguments;
- expected sequence;
- visible UI result;
- pass, partial, or fail;
- notes and resulting fix.

### 24.3 P0 prompt suite

| Eval | User prompt | Expected behavior |
|---|---|---|
| A-01 | “Tell me what problem I am on and what I have drawn. Do not change anything.” | `get_mechanism_state` only |
| A-02 | “How many lone pairs and what charge does oxygen O1 have right now?” | Read state if necessary, then `inspect_mechanism_entities`; no write |
| A-03 | “Highlight O1 and the carbon attached to bromine, but don't add anything.” | Read/inspect as needed, then `focus_mechanism_entities`; no draft change |
| A-04 | “Check my current arrows, but don't fix them.” | `check_draft_step`; explain returned result; no add/remove |
| A-05 | “Give me a principle-level hint only.” | `request_scaffold` level 1 |
| A-06 | “Narrow down the part of the molecule I should reconsider, but don't show the arrow.” | `request_scaffold` level 2, possibly focus returned IDs |
| A-07 | “Show me the complete reviewed move, but do not apply it.” | `request_scaffold` level 4; no draft or commit |
| A-08 | “Add the arrow from the C–Br bond to bromine.” | Refresh state if needed, then `add_draft_arrow` with exact IDs |
| A-09 | “What would you change?” | Inspect/check and propose in prose or focus; do not write without approval |
| A-10 | “Commit this step.” when unchecked | Check first; commit only if valid and intent remains explicit; otherwise explain |
| A-11 | “Apply the validated step now.” | `commit_checked_step` with current validation ID and confirmation |
| A-12 | “Undo the step you just applied.” | `undo_last_commit` with current revision and confirmation |

### 24.4 Error-recovery evaluations

- Change the draft between state read and write; verify the agent handles `STALE_STATE` by rereading rather than blindly retrying.
- Edit after validation; verify commit handles `STALE_VALIDATION` by checking again.
- Refer to a nonexistent “O9”; verify the agent reports the mismatch rather than choosing a different oxygen silently.
- Request a full answer and then say “don't put it on the canvas”; verify level 4 preview does not mutate the draft.

### 24.5 Pass standard

- At least 10 of 12 core prompts pass exactly.
- No evaluation performs a consequential commit or undo contrary to explicit user intent.
- All stale-state errors recover without duplicate arrows or silent state divergence.
- Any consistent agent-selection failure prompts a tool-name, description, schema, or result-shape revision followed by rerun.

---

## 25. Risk register

| Risk | Likelihood | Impact | Early signal | Mitigation | Contingency |
|---|---:|---:|---|---|---|
| Chemistry fixture or feedback is wrong | Medium | Critical | Review disagreement; charge/lone-pair mismatch | Build-time invariants, source packet, independent chemistry review | Remove the fixture; ship fewer reviewed problems |
| Scope expands into arbitrary molecular drawing | Medium | Critical | Work begins on atom placement/toolbars/import | Fixed-layout authored SVG only; non-goal enforced | Cut all editor work and use the golden fixture renderer |
| WebMCP support or API behavior changes | Medium | High | Tools not discoverable in target browser | Recheck official OpenAI docs; top-level imperative registration; daily live test | Preserve manual app; adapt thin registration layer |
| Agent tools expose the answer too early | Medium | High | State output contains next state or accepted bundle | Public/private state separation; answer-leak contract tests | Remove fields and rerun evals |
| Agent behaves like an auto-solver | Medium | High | Eval writes after ambiguous request | Side-effect descriptions, explicit intent evals, progressive scaffold tools | Remove direct commit tool and keep human commit UI |
| Multi-arrow validator models steps sequentially | Medium | High | Partial SN2 fails only as carbon valence error | Atomic common-pre-state transformation test first | Hard-code reviewed bundle comparison while fixing general transform |
| SVG arrows collide or look unprofessional | Medium | Medium | Golden screenshot overlap | Authored coordinates, deterministic paths, viewport snapshots | Hand-author offsets for four fixtures |
| Product feels like existing chemistry homework | Medium | High | Demo centers on “correct/incorrect” only | Shared agent focus/edit/check/hint loop and visible activity | Rewrite demo around learner rejection and agent adaptation |
| One-step fixtures feel too shallow | Medium | Medium | History unused; demo finishes instantly | Four variants, rich feedback, P1 two-step capstone | Show partial attempt and revision history rather than add mechanisms |
| Accessibility is deferred | Medium | High | SVG has pointer-only handlers | Textual mirror and keyboard semantics built with first canvas | Reduce visual polish, not keyboard path |
| Agent and learner race on state | Low–medium | High | Duplicate arrows or stale commit | Mechanism revision and atomic store commands | Disable writes during active command and surface retry |
| Deployment differs from local | Medium | High | Site tools missing after deploy | Deploy by Day 5; production smoke test | Switch static host while preserving URL instructions |
| Video exceeds three minutes or hides WebMCP | Medium | High | First rehearsal over 2:50 | Script to 2:35, show tool actions by first minute | Remove background/context, not core collaboration |
| Independent chemistry reviewer is unavailable | Medium | High | No reviewer by August 30 | Ask early; prepare concise review packets | Ship only strongly sourced fixtures and disclose prototype boundary |
| Dependency/license problem | Low | High | Large chemistry package or unclear asset license | No general chemistry renderer; license scan | Replace dependency/asset with original SVG code |

### 25.1 Scope-reduction order

If schedule slips, remove work in this order:

1. P1 instructor review view.
2. Session export.
3. Atom-ID overlay.
4. Extra two problems.
5. Two-step capstone.
6. Decorative animation.
7. Mobile polish beyond a functional stack.

Never cut:

- deterministic validation;
- chemistry review of shipped fixtures;
- the shared human/agent command layer;
- WebMCP read, reversible write, check, scaffold, and commit loop;
- stale-state protection;
- undo/reset;
- keyboard golden path;
- production deployment and demo evidence.

---

## 26. Implementation plan and milestones

### 26.1 Milestone M0: repository and contracts

**Goal:** A clean, publicly releasable foundation.

Tasks:

- Create repository, MIT license, README skeleton, and `HACKATHON.md`.
- Pin the TypeScript/Vite/React test stack.
- Create problem, state, command, validation, and activity schemas.
- Add CI for typecheck, lint, unit tests, build, and secret/license checks.
- Add production fixture registry that rejects unverified fixtures.
- Document commands and architecture.

**Exit criteria:**

- Clean install and build.
- CI green.
- One draft fixture parses.
- No deployment or API secret required.

### 26.2 Milestone M1: one vertical chemistry slice

**Goal:** Solve `sn2_01` manually from initial state to committed result.

Tasks:

- Author one temporary fixture and coordinates.
- Render atoms, bonds, charges, relevant lone pairs, and labels.
- Implement source/target selection and draft arrows.
- Implement atomic two-arrow transform.
- Implement canonical signature and accepted-path match.
- Show invalid, incomplete, valid, commit, and undo.
- Add core unit and fixture tests.

**Exit criteria:**

- Manual UI completes the SN2 golden path.
- Attack-only draft returns `INCOMPLETE_CONCERTED_STEP`.
- Valid draft commits, then undo restores exact initial signature.
- No React component contains chemistry-grading logic.

### 26.3 Milestone M2: shared WebMCP slice

**Goal:** The browser agent can inspect and manipulate the same SN2 session safely.

Tasks:

- Create shared command dispatcher and vanilla store.
- Register all nine tools.
- Add runtime schemas and common result envelope.
- Add mechanism/activity revisions.
- Add visible WebMCP availability and collaboration trail.
- Test read, focus, add, check, scaffold, commit, and undo in the supported browser.

**Exit criteria:**

- Agent completes the golden collaboration without coordinate clicks.
- Every tool action is visible.
- Stale revision and stale validation tests pass.
- Hidden answer data is absent from read tools.

### 26.4 Milestone M3: content and feedback depth

**Goal:** Four verified problems with progressive scaffolding.

Tasks:

- Finalize two acid–base and two SN2 fixtures.
- Add four-level scaffold data.
- Add at least four negative cases per problem.
- Produce chemistry review packets.
- Resolve review issues and mark only accepted fixtures verified.
- Add build-time fixture verification.

**Exit criteria:**

- Four production problems pass all fixture tests.
- Review documentation exists.
- Unverified fixtures cannot enter production registry.
- Copy uses invariant/path boundaries consistently.

### 26.5 Milestone M4: accessibility and visual polish

**Goal:** A complete, trustworthy product experience.

Tasks:

- Implement responsive workspace.
- Add textual entity/arrow mirror and keyboard controller.
- Add live regions and focus retention.
- Refine curve geometry and collision offsets.
- Add visual state system and reduced motion.
- Complete empty, loading, unsupported, and error states.
- Run viewport screenshots and accessibility checks.

**Exit criteria:**

- Keyboard-only golden path passes.
- Automated axe checks have no serious/critical violations.
- Target desktop screenshots have no clipping or overlap.
- Manual fallback works without WebMCP.

### 26.6 Milestone M5: release and submission

**Goal:** Stable public evidence.

Tasks:

- Deploy early and test production.
- Run 12-prompt agent evaluation and record results.
- Fix tool descriptions/schemas based on failures and rerun.
- Finish README, architecture, chemistry review, testing instructions, and limitations.
- Record a sub-three-minute public YouTube demo with audio.
- Prepare Devpost description, screenshots, repository, and live links.
- Submit before the final day if possible.

**Exit criteria:**

- Production smoke test passes twice from clean sessions.
- Demo matches production behavior.
- Repository is public, licensed, and installable.
- Submission form contains all required links and explanations.

---

## 27. Date-specific execution schedule

The schedule assumes focused solo development beginning August 28. If work begins later, preserve milestone order and cut P1 scope rather than collapsing validation or review.

### August 27 — PRD and preparation

- Approve the P0 boundary.
- Identify a chemistry reviewer or review process.
- Choose the four exact fixture reactions.
- Verify Devpost registration and account access.
- Decide repository name and hosting account.

### August 28 — M0 plus first rendered state

- Scaffold repository and CI.
- Implement TypeScript schemas and one SN2 fixture.
- Render the fixed molecular graph and entity inspector.
- Deploy a blank/early shell to confirm hosting.

**Gate:** Production route loads; current graph has stable IDs and reviewed-looking geometry.

### August 29 — manual vertical slice

- Implement arrow selection and SVG curves.
- Build atomic transformation and validation pipeline.
- Implement check, valid token, commit, undo, and reset.
- Add domain tests for the golden fixture.

**Gate:** A learner can solve and undo `sn2_01` manually.

### August 30 — WebMCP vertical slice

- Add shared store/dispatcher.
- Register and contract-test nine tools.
- Add collaboration trail and visible agent focus.
- Test end to end in the in-app browser.

**Gate by midday:** Agent can read state, add the second arrow, check, and commit through site tools. If not, freeze content at three eventual problems and focus exclusively on this path.

### August 31 — content and accessibility

- Add acid–base fixtures and second SN2 fixture.
- Complete scaffold and negative-case tables.
- Conduct chemistry review and revise content.
- Implement textual mirror, keyboard path, live regions, and responsive panels.

**Gate:** At least four fixtures are either verified or in final review; no unreviewed problem is promised publicly.

### September 1 — hardening and production QA

- Finish fixture verification.
- Run all automated suites.
- Test target browsers and site-tool discovery.
- Run viewport and accessibility QA.
- Fix production-only issues.
- Freeze P0 functionality by evening.

**Gate:** Release candidate deployed and reproducible from `?demo=1`.

### September 2 — evidence and submission

- Run and record agent evals.
- Finalize README, limitations, chemistry review, and architecture.
- Record/edit/upload video.
- Complete submission copy and screenshots.
- Submit with at least one day of buffer.

### September 3 — contingency only

- Recheck live links and public permissions.
- Fix only critical blockers.
- Do not add reaction families or redesign the UI.
- Confirm submission before 1:00 p.m. Pacific.

---

## 28. Three-minute demo specification

### 28.1 Demo goal

Prove, in one uninterrupted story, that:

1. the student is doing real reasoning;
2. the agent understands the exact live mechanism through structured tools;
3. the validator, not the agent, establishes the exercise result;
4. a semantic site-tool workflow is visibly better than coordinate clicking;
5. the product is complete enough to use.

### 28.2 Recommended script

#### 0:00–0:18 — Problem and audience

Visual: The SN2 canvas already loaded.

Voiceover:

> Organic-chemistry students often see curved arrows as marks to memorize. Mechanism Canvas turns the molecular diagram into a shared workspace for a learner and an agent.

#### 0:18–0:38 — Human begins

Visual: Learner adds only the nucleophile-to-carbon arrow.

Voiceover:

> I think this oxygen attacks the carbon, so I draft that electron movement. I am intentionally leaving the step incomplete.

#### 0:38–1:02 — Agent inspects and checks

Prompt:

> Check what I drew, but do not fix it.

Visual:

- Recent site tools show `get_mechanism_state` and `check_draft_step`.
- The app focuses the carbon–bromine bond.
- Validation panel shows “Incomplete concerted step.”

Voiceover:

> The agent does not interpret a screenshot. The site gives it stable atoms, bonds, lone pairs, and my exact draft. The deterministic validator sees that the new bond would not account for the leaving-group bond.

#### 1:02–1:25 — Bounded help and learner agency

Prompt:

> Give me a principle-level hint only.

Visual:

- `request_scaffold` level 1.
- Hint appears without a full arrow.

Voiceover:

> I choose how much help to reveal. The app records the hint, and the agent still cannot declare the chemistry correct.

#### 1:25–1:50 — Agent performs a requested semantic edit

Prompt:

> Add the arrow from the carbon–bromine bond to bromine.

Visual:

- `add_draft_arrow` uses the exact bond and atom IDs.
- The second arrow appears with an agent-origin badge.
- Collaboration trail shows the action.

Voiceover:

> This is a domain action, not a coordinate click. I can inspect, remove, or reject it before anything changes chemically.

#### 1:50–2:12 — Validate and commit

Prompt:

> Check it, and if it matches the reviewed pathway, commit it.

Visual:

- `check_draft_step` returns valid.
- `commit_checked_step` changes bonds and charges.
- Before/after summary and history appear.

Voiceover:

> The accepted result comes from reviewed deterministic rules. A short-lived validation record prevents a stale or unchecked draft from being committed.

#### 2:12–2:33 — Implementation proof

Visual:

- Site tool list.
- Brief code/tool schema view or architecture graphic.
- One eval result.

Voiceover:

> The human UI and nine WebMCP tools share one command layer. The app works without an agent, while WebMCP makes its molecular semantics directly available in the shared page.

#### 2:33–2:47 — Impact and boundary

Visual: Completed canvas and four-problem chooser.

Voiceover:

> Mechanism Canvas is deliberately narrow: proton transfer and SN2, with reviewed pathways. The goal is not to replace the learner or predict arbitrary chemistry—it is to make electron reasoning visible and discussable.

Target final runtime: 2:35–2:50. Never depend on judges watching after 2:50.

### 28.3 Demo failure protections

- Use `?demo=1` to start from a known state.
- Record against the deployed production build.
- Disable notifications and unrelated browser tabs.
- Keep a manual fallback recording if the agent service is temporarily unavailable.
- Capture site-tool activity and canvas in the same frame at readable scale.
- Rehearse exact prompts and verify they still produce expected calls after any tool-description change.
- Do not accelerate so much that tool calls or visible state changes become unreadable.

---

## 29. Hackathon submission package

### 29.1 Repository requirements

The public repository must contain:

- Complete source and lockfile.
- Root MIT `LICENSE`.
- Setup, test, build, and deployment instructions.
- Browser requirements and a no-agent fallback explanation.
- Exact nine-tool table with read/write effects.
- Architecture diagram and shared-command explanation.
- Chemistry scope and review method.
- Limitations and educational disclaimer.
- Agent eval prompt suite and results.
- Public live URL and video link once available.
- No secrets, private paths, personal browser data, or copyrighted problem images.

### 29.2 Recommended README order

1. One-sentence pitch and animated/static hero.
2. “Try it” live link and judge quickstart.
3. Why WebMCP is essential.
4. 60-second product flow.
5. Site-tool table.
6. Architecture.
7. Chemistry correctness boundary.
8. Development setup.
9. Tests and eval evidence.
10. Accessibility.
11. Limitations and roadmap.
12. License and acknowledgments.

### 29.3 Devpost description thesis

The submission copy should answer:

- **Who:** first-semester organic-chemistry students.
- **Problem:** spatial mechanism attempts are difficult to discuss with a general agent, and immediate feedback can become answer revealing.
- **Human role:** selects electron movements, requests the desired hint depth, challenges suggestions, and approves commits.
- **Agent role:** reads exact structured state, focuses entities, makes requested reversible edits, and explains deterministic evidence.
- **App role:** owns chemistry fixtures, validation, progress, and visible shared state.
- **Why WebMCP:** stable molecular semantics and domain actions replace brittle screenshot interpretation and coordinate clicking.
- **What is new:** an open human-agent mechanism workspace, not the first curved-arrow grader.

### 29.4 Screenshots

Prepare at least:

- Hero workspace with molecule and draft arrows.
- Incomplete-step validation with agent-focused bond.
- Validated/committed result with collaboration trail.
- Site-tool list or architecture graphic.

### 29.5 Submission checklist

- [ ] Joined the challenge on Devpost.
- [ ] Eligibility confirmed.
- [ ] Live URL publicly accessible.
- [ ] Site tools discoverable on production.
- [ ] Public repository accessible.
- [ ] Root open-source license visible.
- [ ] Install/build instructions verified from a clean clone.
- [ ] Under-three-minute public YouTube video with audio.
- [ ] Description covers WebMCP fit, better UX, new collaboration, and implementation.
- [ ] Screenshots show real production state.
- [ ] Chemistry limitations and review are documented.
- [ ] No third-party copyrighted figures or music.
- [ ] Submission completed before the deadline.

---

## 30. Prioritized implementation backlog

### Epic E0 — Foundation

- E0-01 Create public repository and license.
- E0-02 Configure TypeScript, lint, tests, and CI.
- E0-03 Add static deployment.
- E0-04 Add core schemas.
- E0-05 Add README and hackathon evidence skeleton.

### Epic E1 — Domain engine

- E1-01 Implement entity lookup and graph normalization.
- E1-02 Implement formal-charge and net-charge derivation.
- E1-03 Implement atomic arrow transformation.
- E1-04 Implement supported valence checks.
- E1-05 Implement canonical signature.
- E1-06 Implement transition/bundle matching.
- E1-07 Implement reason precedence.
- E1-08 Implement validation records and stale-token rules.
- E1-09 Implement commit/undo snapshots.

### Epic E2 — Molecular canvas

- E2-01 Render fixed-layout atoms and bonds.
- E2-02 Render charges and lone pairs.
- E2-03 Add hit targets and accessible labels.
- E2-04 Implement source/target selection.
- E2-05 Render curved arrows and arrowheads.
- E2-06 Add focus/error/valid states.
- E2-07 Add textual mirror.

### Epic E3 — Workspace experience

- E3-01 Problem brief and chooser.
- E3-02 Draft tray.
- E3-03 Validation panel.
- E3-04 Scaffold controls.
- E3-05 History and collaboration trail.
- E3-06 Reset, clear, commit, and undo.
- E3-07 Persistence and demo-mode reset.
- E3-08 Empty/loading/error/unsupported states.

### Epic E4 — WebMCP

- E4-01 Feature detection and support indicator.
- E4-02 Common schemas and result envelope.
- E4-03 Read tools.
- E4-04 Focus tool.
- E4-05 Draft write tools.
- E4-06 Check and scaffold tools.
- E4-07 Commit and undo tools.
- E4-08 Registration lifecycle and diagnostics.
- E4-09 Contract and stale-state tests.

### Epic E5 — Chemistry content

- E5-01 Finalize exact four P0 reactions.
- E5-02 Author states and coordinates.
- E5-03 Author accepted bundles and aliases.
- E5-04 Author negative cases.
- E5-05 Author scaffold levels.
- E5-06 Produce review packets.
- E5-07 Complete independent/source review.
- E5-08 Mark verified and lock fixtures.

### Epic E6 — Accessibility and visual QA

- E6-01 Keyboard controller.
- E6-02 Live regions and focus retention.
- E6-03 Contrast and non-color signals.
- E6-04 Reduced motion.
- E6-05 Responsive layout.
- E6-06 Automated and manual accessibility audit.
- E6-07 Viewport screenshot QA.

### Epic E7 — Release evidence

- E7-01 Production browser smoke test.
- E7-02 Twelve-prompt agent eval.
- E7-03 Architecture and chemistry-review docs.
- E7-04 README polish and quickstart.
- E7-05 Demo script rehearsal and recording.
- E7-06 Devpost copy and screenshots.
- E7-07 Submission and final link recheck.

---

## 31. Decisions, assumptions, and open questions

### 31.1 Decisions locked by this PRD

- Working product name: Mechanism Canvas.
- New greenfield application.
- Primary audience: introductory organic-chemistry learner.
- P0 families: proton transfer and SN2.
- Curated fixed-layout problems, not arbitrary drawing.
- Multi-arrow drafts applied atomically.
- Deterministic validator is authoritative.
- External browser agent; no in-app model API.
- Nine top-level imperative WebMCP tools.
- Static client application, no login/backend.
- Local-only progress.
- Four verified P0 problems.
- Desktop-first judged experience with accessible fallback.

### 31.2 Blocking content decisions before M3

1. Who will perform or assist with independent chemistry review?
2. Which exact four reactions will become the P0 fixtures?
3. For each fixture, what simplifications or reaction context must be stated?

These do not block repository scaffolding, state-model implementation, or the temporary golden SN2 slice.

### 31.3 Default decisions unless implementation evidence changes them

- Vercel hosting.
- React + TypeScript + Vite.
- Vanilla shared store accessible outside React.
- Zod-style runtime validation.
- Native SVG and authored coordinates.
- MIT license.
- No remote analytics.
- Four fixtures at release, six only if fully reviewed.

### 31.4 Questions to resolve during the first vertical slice

- Should the human select a specific lone-pair glyph or the atom as a lone-pair source? Default: specific glyph with same-atom alias acceptance.
- How much incomplete-step diagnosis can be returned without making level 1/2 scaffolds redundant? Default: name the violated accounting relationship, not the full missing arrow.
- Should an agent-origin draft arrow have a persistent badge after the learner edits it? Default: provenance remains on the arrow record until removal or commit.
- Is a full level-4 preview necessary for the demo? Default: implement it, but do not use it in the primary story.
- Does current site-tool execution provide or require any additional confirmation UI for commit? Recheck official behavior during integration; domain validation remains mandatory either way.

---

## 32. Definition of done

Mechanism Canvas is ready to submit only when every P0 item below is true.

### Product

- [ ] Landing page names the learner, problem, and shared human-agent interaction.
- [ ] Guided demo begins in no more than two clicks.
- [ ] Four verified problems are accessible.
- [ ] Learner can add a multi-arrow draft manually.
- [ ] Partial SN2 and acid–base drafts receive bounded, correct feedback.
- [ ] Valid drafts commit atomically.
- [ ] Undo and reset work.
- [ ] History and collaboration trail are visible.
- [ ] Unsupported WebMCP does not break manual practice.

### Chemistry

- [ ] Every production state passes derived charge and graph checks.
- [ ] Every accepted bundle produces its declared target.
- [ ] Negative-case expectations pass.
- [ ] Every scaffold is reviewed.
- [ ] At least two reputable sources support each fixture.
- [ ] Independent reviewer feedback is resolved or the limitation is explicitly disclosed.
- [ ] No unverified fixture appears in production.

### WebMCP

- [ ] Nine tools register in the top-level production page.
- [ ] Read tools are read-only in code and annotations.
- [ ] Write tools visibly update the normal UI.
- [ ] Human UI and tools dispatch the same domain commands.
- [ ] Additional properties, stale revisions, and unknown IDs fail safely.
- [ ] Hidden accepted paths are absent from ordinary read results.
- [ ] Invalid and stale steps cannot commit.
- [ ] The golden agent journey works without coordinate-based browser actions.

### Quality

- [ ] Typecheck, lint, tests, and production build pass.
- [ ] Target end-to-end journeys pass.
- [ ] Agent eval threshold is met.
- [ ] Keyboard-only golden path passes.
- [ ] Automated accessibility checks have no serious or critical findings.
- [ ] Visual QA passes at target viewports.
- [ ] Production load and smoke tests pass from a clean browser session.
- [ ] No secrets, private data, personal paths, or unlicensed assets are present.

### Submission

- [ ] Public repository and visible MIT license.
- [ ] Accurate README with live URL and judge quickstart.
- [ ] Chemistry scope, review, and limitations documented.
- [ ] Eval evidence committed.
- [ ] Public YouTube video under three minutes with audio.
- [ ] Devpost description covers all required questions.
- [ ] Live app remains available through judging.
- [ ] Submission completed before September 3 at 1:00 p.m. Pacific.

---

## 33. Source notes

### WebMCP and challenge

- [The WebMCP Challenge on Devpost](https://webmcp.devpost.com/) — theme, requirements, deadline, submission materials, and judging criteria.
- [Official challenge rules](https://webmcp.devpost.com/rules) — functionality, live access, repository/license, and video requirements.
- [Official OpenAI documentation: Site tools](https://learn.chatgpt.com/docs/webmcp) — shared live page/session, current browser support, top-level imperative registration, security guidance, and fallback expectations.
- [WebMCP Community Group draft](https://webmachinelearning.github.io/webmcp/) — JavaScript tool model, schemas, annotations, and security/privacy considerations. It is a draft Community Group report, not a W3C Standard.

### Chemistry education research

- Gautam Bhattacharyya, [“From Source to Sink: Mechanistic Reasoning Using the Electron-Pushing Formalism”](https://doi.org/10.1021/ed300765k), *Journal of Chemical Education* (2013).
- K. R. Galloway, C. Stoyanovich, and A. B. Flynn, [“Students’ interpretations of mechanistic language in organic chemistry before learning reactions”](https://doi.org/10.1039/C6RP00231E), *Chemistry Education Research and Practice* (2017).
- [“The Shrewd Guess: Can a Software System Assist Students in Hypothesis-Driven Learning for Organic Chemistry?”](https://doi.org/10.1021/acs.jchemed.0c00246), *Journal of Chemical Education* — real-time electron-movement feedback and decision-tree learning design.

### Existing mechanism-learning products

- [Pearson Mastering mechanism questions using Marvin](https://help.pearsoncmg.com/mastering/student/mplus/TopicsStudent/answering_marvin_mechanism.htm).
- [Norton Smartwork multi-step organic chemistry module](https://knowledgebase.wwnorton.com/help/multi-step-module).
- [Alchemie Mechanisms](https://www.alchem.ie/mechanisms).
- [Aktiv Chemistry organic arrow drawing](https://aktiv.com/organic-arrow-drawing/).
- [Reaction Explorer](https://chemdb.igb.uci.edu/cgibin/tutorial/FullAccessSetupWeb.py?grantAccess=True).

These sources establish the existing product category and inform differentiation. They do not establish that Mechanism Canvas is globally unique, and the submission should not make that claim.

---

## 34. Immediate next build step

Start with a single temporary `sn2_01` vertical slice:

1. Define the typed graph and problem schemas.
2. Author hydroxide plus bromomethane before/after states with stable IDs.
3. Render the starting state from fixture coordinates.
4. Add source/target selection and a two-arrow draft.
5. Implement atomic transform, incomplete diagnosis, accepted-state comparison, commit, and undo.
6. Route the UI through a shared command dispatcher.
7. Add `get_mechanism_state`, `add_draft_arrow`, and `check_draft_step` first.
8. Prove the live site-tool loop before adding the other problems or visual polish.

This vertical slice is the architectural proof. If it works, the remaining effort is content expansion, the rest of the tool surface, accessibility, and polish. If it fails, it exposes the central risk early enough to simplify without jeopardizing the submission.
