# Devpost submission package

This file is the copy source for the WebMCP Challenge entry.

## Project overview

**Project name:** Mechanism Canvas

**Tagline:** An organic chemistry canvas where WebMCP agents test competing mechanisms, show their evidence, and leave the final move to the learner.

**Thumbnail:** `public/mechanism-canvas-social-card.png` (1800 × 1200 PNG, 3:2)

**Built with tags:** WebMCP, React, TypeScript, Vite, Three.js, Vitest, GitHub Pages, HTML, CSS, SVG

**Try it out:** <https://mihirduvedi.github.io/mechanism-canvas/?demo=1>

**Public repository:** <https://github.com/mihirduvedi/mechanism-canvas>

**Video demo link:** <https://youtu.be/UXbloTA5bqU>

## Project story

### Why this problem

Organic chemistry students learn reaction mechanisms by moving electron pairs through a diagram. Most AI tutoring happens in a separate chat window, so the model has to guess what is on the canvas or ask the student to translate a visual structure into prose. Giving an agent broad control creates a different problem: it can finish the exercise before the student has done the reasoning.

Mechanism Canvas makes the page responsible for both meaning and authority. The molecular graph, current draft, learner permissions, and deterministic validator all live in one place. An agent can help with that exact state without becoming the grader or the owner of the work.

### Why WebMCP fits

Pixels do not tell an agent which oxygen lone pair is the electron source, which carbon is electrophilic, whether two arrows belong to the same elementary step, or whether a draft changed after inspection. WebMCP lets the page expose stable atom, bond, and lone-pair IDs together with revisioned commands.

The tool surface also carries intent. In Coach mode, the page exposes 16 of 26 possible tools. Opening a two-path Counterfactual Mechanism Lab publishes five branch tools. Starting a six-action Compare hypotheses job narrows discovery to the 15 tools needed for that purpose. When the budget is spent, the surface closes to four evidence controls. The agent cannot restore its old access by calling a cached tool.

### What people and agents can do together

The learner can give the agent a safe place to test competing mechanisms without changing the real draft. In the judge path, the agent builds one incomplete SN2 branch and checks it. The production validator rejects that branch because bond formation and leaving-group cleavage must happen together. The agent then builds a complete alternative, checks it, compares the evidence, and recommends only the valid branch.

That recommendation appears in a visible proposal gate. It does not alter the main mechanism. The learner decides whether to add it, asks for a fresh check on the main draft, and owns the final commit. This creates a useful division of labor: the agent explores and organizes evidence; the page enforces chemistry and policy; the learner makes the consequential choice.

### How the experience is better

The student no longer has to copy a diagram into chat, describe coordinates, or trust an answer that cannot see the current revision. Every agent action updates or focuses the same interface the student is using. Errors remain useful because a failed hypothesis is visible, isolated, and checked against the same validator as the learner's work.

The boundaries are visible too. A learner-owned Collaboration Contract sets the maximum role and hint ceiling. An Intent-Bound Delegation Session freezes one purpose, problem, state, revision, and action budget. The Live Run Observatory shows which capability batches the host accepted, while the Agent Proof Ledger records what each callback actually changed. Prompts and raw model output are not retained.

### How WebMCP is implemented

Mechanism Canvas registers 26 top-level imperative tools with `document.modelContext.registerTool`. Each tool has a closed JSON schema, stable semantic IDs, a precise description, and annotations for read-only or mutating behavior. Registration is adaptive: a new batch is published when the Collaboration Contract, Lab, delegation scope, or budget changes, and the prior batch is aborted.

The registration layer and the human interface call the same TypeScript store commands. Mutations re-read live state, validate exact revisions and scope, and return structured errors for stale or forbidden work. A central wrapper records privacy-minimized before/after receipts for every callback. The six-call Explore journey is evaluated from those receipts, not from the agent's narration.

The rest of the product is a React and TypeScript application with a deterministic chemistry engine, six reviewed fixtures, keyboard-operable SVG structures, local persistence, reversible commits, reached-state diffs, electron-flow replay, and a lazy-loaded Three.js inspector. It is deployed as a static GitHub Pages site with no backend or credentials.

### What was hard

The hardest part was keeping discovery honest as the page changed. A fixed list of 26 tools would have hidden the learner's intent inside descriptions. Re-registering on every store notification produced transient tool batches that were technically real but meaningless to a judge. The final registration layer coalesces related state changes, waits for the full batch to resolve, and records only accepted surfaces.

The second hard problem was proof. A model saying that it used a tool is not evidence that the page accepted the call or that the intended state changed. The proof ledger therefore wraps the real callback boundary, and the Observatory evaluates a closed set of seven claims from those receipts. Manual policy projections, unit tests, and live host acceptance remain labeled as different kinds of evidence.

### What we are proud of

The agent can be wrong without making the learner's work wrong. The page gives it real branch state, real validator feedback, and enough budget to correct itself, then removes work tools automatically. Lab revision moves from 0 to 6 while the main draft remains at revision 0. The handoff is reviewable, and no Site Tool can accept it for the learner.

The same product still works as a complete manual tutor when WebMCP is unavailable. WebMCP adds direct collaboration to an existing human experience instead of replacing the interface with an agent-only API.

### What comes next

The current chemistry engine is intentionally fixture-bound. A next version could add an instructor authoring workflow for reviewed mechanisms and test whether different permission contracts change how students explain their reasoning. The Collaboration Contract, temporary branch space, and proof receipts could also be applied to circuit design, geometry, and other visual STEM tools where an agent should explore without quietly taking ownership.

## Judge testing instructions

1. Use ChatGPT's in-app browser or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Open <https://mihirduvedi.github.io/mechanism-canvas/?demo=1>.
3. Keep Coach mode, open a two-path Counterfactual Mechanism Lab, choose Compare hypotheses, select six actions, and start the bounded session.
4. Paste the first agent prompt from <https://github.com/mihirduvedi/mechanism-canvas/blob/main/docs/JUDGE_GUIDE.md>.
5. Confirm Path A is incomplete, Path B is validator approved, the recommendation remains outside the draft, and the action budget closes.
6. Confirm the Observatory reports 7 / 7, Lab 0 → 6, Main 0 → 0, Actions 6 / 6, and accepted surfaces 16 → 21 → 15 → 4.
7. End the session in the page, add the recommendation to the draft, ask the agent to check it, and select Commit checked step yourself.

No login or judge credentials are required. If the page reports **Manual mode**, the browser did not expose `document.modelContext`; use one of the compatible hosts above.

## Additional submission answers

**New or existing project:** New project. The repository was created on August 28, 2026, and every commit was authored during the August 25 to September 3 submission period. The dated history is summarized in [HACKATHON.md](../HACKATHON.md).

**Submitter type:** `[MIHIR TO CONFIRM: individual or team]`

**Country of residence / eligibility:** `[MIHIR TO COMPLETE IN DEVPOST]`

**Third-party rights:** Project code, interface copy, chemistry fixtures, icon, and submission artwork are original and MIT-licensed. Runtime and development dependencies use MIT or Apache-2.0 licenses as recorded in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Mihir must make the final ownership and eligibility representations in Devpost.
