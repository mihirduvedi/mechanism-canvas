# WebMCP Challenge submission brief

Mechanism Canvas is a proof-carrying organic chemistry workspace where a learner and a WebMCP agent work on the same semantic molecular canvas. The learner decides the available authority. The page exposes only the matching tools, validates chemistry with deterministic code, and leaves consequential choices visible and reversible.

## Submission facts

| Field | Value |
|---|---|
| Project | Mechanism Canvas |
| Event | The WebMCP Challenge |
| Live judge URL | <https://mihirduvedi.github.io/mechanism-canvas/?demo=1> |
| Public source | <https://github.com/mihirduvedi/mechanism-canvas> |
| License | [MIT](LICENSE) |
| Primary judge instructions | [docs/JUDGE_GUIDE.md](docs/JUDGE_GUIDE.md) |
| Copy-ready Devpost story | [docs/DEVPOST_SUBMISSION.md](docs/DEVPOST_SUBMISSION.md) |
| Requirement-by-requirement status | [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) |
| Local verification | `npm ci && npm run verify:submission` |
| Post-deploy verification | `npm run verify:release` |

The clean demo is memory-only. It starts from the same reviewed SN2 fixture every time and never reads or changes saved practice.

## The WebMCP case

A curved-arrow mechanism is visually compact but semantically dense. An agent operating pixels cannot reliably tell which lone pair supplied electrons, which bond broke, whether two arrows belong to one elementary step, or whether the learner changed the draft after the agent inspected it.

Mechanism Canvas exposes those facts through 26 imperative Site Tools backed by the same store and commands as the human interface. Tool discovery changes with the learner's contract, page state, temporary intent, and remaining action budget. Every callback re-reads current state, checks exact revisions and scope, and records a privacy-minimized receipt.

The central demo gives the agent an isolated place to be wrong. In a two-path Counterfactual Mechanism Lab, it can build one incomplete SN2 hypothesis, observe the real validator's rejection, construct a complete alternative, compare both branches, and recommend only the checked path. The recommendation stays outside the learner's draft until the learner adopts it.

## Fast judge path

1. Open the [clean demo](https://mihirduvedi.github.io/mechanism-canvas/?demo=1) in ChatGPT's in-app browser or Chrome 149+ with WebMCP enabled.
2. Keep **Coach**, open a two-path **Counterfactual Mechanism Lab**, and start **Compare hypotheses** with six actions.
3. Paste the prompt from [docs/JUDGE_GUIDE.md](docs/JUDGE_GUIDE.md).
4. Watch Path A fail as incomplete and Path B pass the validator.
5. Confirm the recommendation remains outside the main draft, the action budget closes, and the Observatory reaches **7 / 7** with lab revision **0 → 6** and main revision **0 → 0**.
6. Inspect the host-accepted surface history **16 → 21 → 15 → 4** and the six matching proof receipts.
7. End the session and adopt the recommendation through the visible learner gate. The agent may check the main draft; the learner commits it.

If the page says **Manual mode**, the host did not expose `document.modelContext`. The human interface still works, but that browser is not evidence of live WebMCP registration.

## Judging evidence

| Criterion | Concrete evidence |
|---|---|
| WebMCP Leverage | Twenty-six closed-schema tools; dynamic registration and withdrawal; intent-bound tool grants; stale-revision and scope guards; host-accepted surface recording; callback receipts; a six-call workflow that passes structured evidence between tools. |
| Execution | A deployed, responsive React application with six reviewed exercises, deterministic validation, local persistence, reversible commits, proposals, history, comparison, replay, 3D inspection, and failure states. |
| Potential Impact | Learners can ask for help on their exact diagram without handing an agent unlimited authority or accepting model prose as chemical correctness. The same contract can apply to circuit editors, geometry canvases, CAD, and other visual workspaces. |
| Creativity and Ambition | The agent receives a temporary experimental layer with competing branches, finite work, automatic capability expiry, and a learner-only handoff. The page also proves its own WebMCP journey without reading the chat transcript. |

## Build-period provenance

This is a new project created during the official submission period. The repository was created on August 28, 2026. All fourteen commits through the current Reaction Garden release were authored from August 28 through August 31, 2026. The table highlights the product milestones; documentation-only history remains visible in Git.

| Date (PDT) | Commit | Milestone |
|---|---|---|
| Aug 28 | `c57fa93` | Release-candidate canvas and deterministic mechanism engine |
| Aug 28 | `4a19c1d` | Clear Lab reaction relay |
| Aug 28 | `d3c997c` | Local learning records |
| Aug 28 | `cf44b1c` | Reached-state reaction diffs |
| Aug 29 | `6d583e2` | Electron-flow replay and finished visual system |
| Aug 29 | `9cf2597` | Reviewable agent proposals |
| Aug 29 | `59c2f44` | Six-exercise problem library |
| Aug 30 | `764cf18` | Practice Compass |
| Aug 30 | `eb50421` | Learner-owned Collaboration Contract |
| Aug 30 | `1691ead` | Agent Proof Ledger |
| Aug 30 | `ef69a61` | Intent-Bound Delegation Sessions |
| Aug 31 | `2a20d3f` | Counterfactual Lab and Live Run Observatory |
| Aug 31 | `d42a3d0` | First judge-facing opening and submission experience |
| Aug 31 | Git tip | Reaction Garden redesign, progressive disclosure, and final submission polish |

The Git history is the timestamped source of truth. No pre-hackathon codebase is included.

## Trust, privacy, and rights

- Chemistry correctness comes from six reviewed fixtures and a deterministic, fixture-bound validator. The app does not claim to predict arbitrary reactions, kinetics, conformers, or learning outcomes.
- Saved practice stays in browser local storage. The clean demo, Lab, delegation, Observatory, and proof receipts are tab-local or memory-only.
- Receipt exports omit prompts, rationales, raw tool inputs and outputs, validation tokens, authored answer bundles, and learner identity.
- Network traffic is limited to same-origin static assets, including the lazy-loaded 3D bundle. The application does not call an external API or send learner data; there is no account, backend, telemetry, cloud sync, or model API call.
- Project code, interface copy, chemistry fixtures, icon, and submission artwork are original project content released under MIT. Dependency licenses are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Reproduce the release checks

```bash
npm ci
npm run verify:submission
```

The command runs 132 contract tests across 23 files, TypeScript compilation, the production Vite build, and submission-package checks for required files, public metadata, image dimensions, repository hygiene, and the 140-character tagline limit.

After the reviewed commit is pushed and GitHub Pages finishes deploying, run `npm run verify:release`. That stricter gate requires every release artifact to be tracked, a clean non-ignored worktree, exact local/remote commit parity, live metadata, and byte-identical JavaScript, CSS, and social-card assets.

Rendered/browser QA and a real compatible-host run remain separate evidence layers. See [docs/JUDGE_GUIDE.md](docs/JUDGE_GUIDE.md) for the exact live test.
