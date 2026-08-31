# Mechanism Canvas — Intent-Bound Delegation Impact-Complete Handoff

**Date:** 2026-08-30

**Workspace:** `/Users/mihirduvedi/Desktop/mechanism-canvas`

**Branch / starting HEAD:** `main` / `1691ead`

**Status:** Highest-impact WebMCP feature is implemented and verified locally. It is intentionally uncommitted, unpushed, and undeployed pending fresh approval.

**Deadline context:** WebMCP Challenge submissions close September 3, 2026 at 1:00 PM PDT.
**Authoritative predecessor:** `/Users/mihirduvedi/Downloads/2026-08-30-agent-proof-ledger-live-release-complete-handoff.md` (byte-identical workspace copy under `handoffs/`).

## Executive outcome

The next high-impact feature was **Intent-Bound Delegation Sessions**.

A learner can now convert the broad Collaboration Contract into one temporary, tab-local WebMCP job with:

- a fixed purpose: Inspect, Diagnose, or Coauthor;
- the exact active exercise, committed state, and mechanism revision;
- a frozen Site Tool grant that can shrink but never widen itself;
- a learner-selected action budget of four, six, or eight metered calls;
- automatic collapse to three evidence controls when the budget is spent or the learner changes scope; and
- proof receipts that bind each page execution to the session, preset, scope, and action ordinal.

Only the visible page can start or end a session. No Site Tool can create, expand, renew, or restore one.

This makes the hackathon's core technology legible to a judge: learner intent changes WebMCP capability discovery, page execution spends a visible budget, and the page closes its own work surface without relying on the model to stop voluntarily.

## Why this was the highest-impact choice

The official challenge rubric emphasizes WebMCP leverage, execution, impact, and creativity. The WebMCP draft also identifies misrepresentation of user intent as a trust problem. Mechanism Canvas already had adaptive Site Tools, deterministic chemistry, a visible Collaboration Contract, and an Agent Proof Ledger. The missing link was an explicit, inspectable relationship between:

`learner intent → discoverable capability → verified page execution`

Intent-Bound Delegation completes that chain while deepening the existing product instead of adding a disconnected demo feature.

Current sources checked on 2026-08-30:

- Challenge page and judging criteria: https://webmcp.devpost.com/
- WebMCP draft specification: https://webmachinelearning.github.io/webmcp/
- OpenAI Site Tools documentation: https://learn.chatgpt.com/docs/webmcp

## Current tool surfaces

The top-level imperative catalog now contains **21 Site Tools**.

| State | Discoverable tools |
|---|---:|
| Observe | 11 |
| Coach, normal hint ceiling | 16 |
| Coach, hints disabled | 15 |
| Collaborate, learner-only commit | 20 |
| Collaborate, shared commit authority | 21 |
| Inspect session under learner-only Collaborate | 10 |
| Diagnose session under learner-only Collaborate | 12 |
| Coauthor session under learner-only Collaborate | 15 |
| Exhausted or drifted session | 3 |

The three unmetered session controls are:

- `get_collaboration_contract`;
- `get_delegation_session`; and
- `get_agent_action_receipts`.

Every other call consumes one action once page execution begins. A callback canceled before execution consumes nothing.

## Product contract

### Presets

**Inspect this step**

Reads current state and evidence and may present reached history, comparison, replay, activity, entity inspection, or focus. It cannot draft, check, request hints, switch exercises, commit, undo, reset, read the learning profile, or stage a practice plan.

**Diagnose my draft**

Adds deterministic draft checking and contract-capped scaffold requests to Inspect. It still cannot propose or directly edit arrows.

**Coauthor this step**

Adds reviewable arrow proposals plus direct add/remove only when the Collaboration Contract already permits those actions.

All presets deliberately exclude commit, problem switching, reset, undo, learning-profile reads, and practice-plan staging.

### Freeze and drift rules

- The initial grant is `preset ∩ current Collaboration Contract`.
- The grant is frozen at start.
- Later contract restrictions shrink the effective intersection.
- Later contract expansion cannot add a tool to the frozen session.
- A cached callback outside the active purpose is rejected with `DELEGATION_TOOL_BLOCKED`.
- A human change to problem, committed state, or mechanism revision immediately sets the session to `drifted`.
- An authorized agent edit advances the session's expected revision and does not invalidate its own session.
- Spending the final action sets the session to `exhausted`.
- Drifted and exhausted sessions republish only the three evidence controls.
- A second session cannot replace an active grant programmatically; the learner must end the current session first.
- Reload clears the session and restores the full learner-owned Collaboration Contract surface.

### Persistence and privacy

The delegation session is memory-only and tab-local. It does not enter saved practice, the learning record, local storage, or workspace schema v6.

Agent Proof Ledger schema version 2 adds only fixed delegation evidence:

- session ID;
- preset ID and fixed label;
- status at call start;
- problem ID;
- state ID;
- one-based action number or `null` for a control read; and
- action budget.

No freeform intent, prompt, rationale, raw input, raw output, validation token, or learner identity is persisted or exported.

## Implementation map

### New files

- `src/webmcp/delegation-session.ts`
  - Presets, budgets, control-tool list, capability intersection, surface signature, lifecycle manager, drift detection, central call authorization, action metering, and receipt evidence.
- `src/webmcp/active-delegation-session.ts`
  - One tab-local manager bound to the active mechanism store.
- `src/webmcp/delegation-session.test.ts`
  - Six domain tests for non-widening, agent revision following, human drift, controls/exhaustion, restoration, and replacement prevention.
- `src/components/DelegationSession.tsx`
  - Learner-only setup and active-session interface.
- `docs/INTENT_BOUND_DELEGATION.md`
  - Complete product, security, WebMCP, privacy, judge, and verification contract.

### Modified runtime files

- `src/webmcp/register-tools.ts`
  - Catalog count increased to 21.
  - Added `get_delegation_session`.
  - `enabledToolNames` now accepts an optional delegation session.
  - Registration signature now combines Collaboration Contract and delegation state.
  - Registration refreshes when either boundary changes.
  - Central instrumentation honors pre-cancellation, asks the delegation manager before domain execution, rejects stale cached calls, appends delegation-aware receipts, and closes the in-flight execution.
  - `get_mechanism_state` includes the current delegation summary.
- `src/webmcp/tool-receipt-ledger.ts`
  - Receipt schema increased from 1 to 2.
  - Added optional fixed `delegation` evidence and privacy language.
- `src/components/AgentProofLedger.tsx`
  - Shows the session label and action ordinal for metered work, or marks an unmetered evidence control.
- `src/components/CollaborationContract.tsx`
  - Counts reflect the effective delegation surface while a session exists.
- `src/App.tsx`
  - Places the new full-width delegation panel between the Collaboration Contract and proof ledger.
- `src/components/DemoNotice.tsx` and `src/demo/judge-prompt.ts`
  - Updated the clean judge path.
- `src/index.css`
  - Added the complete responsive, forced-colors-aware visual system for setup, active, drifted/exhausted, exact surface, budget, and evidence-chain states.

### Modified documentation

- `README.md`
- `DESIGN.md`
- `docs/AGENT_PROOF_LEDGER.md`
- `docs/COLLABORATION_CONTRACT.md`
- `docs/DEMO_SCRIPT.md`
- `docs/ELECTRON_FLOW_REPLAY.md`
- `docs/JUDGE_GUIDE.md`
- `docs/PRACTICE_COMPASS.md`
- `docs/REACTION_DIFF.md`
- `docs/mechanism-canvas-prd.md`

Historical handoffs were preserved rather than rewritten.

## Central execution order

The Site Tool wrapper now performs this sequence:

1. capture the before state and contract stamp;
2. honor pre-execution cancellation;
3. ask the delegation manager whether this named tool may start;
4. reject an exhausted, drifted, or out-of-purpose cached call before domain execution;
5. spend one action for an allowed non-control call;
6. execute the existing shared-store tool implementation;
7. append a privacy-minimized receipt containing fixed delegation evidence; and
8. finish the in-flight execution, follow any authorized revision, and republish the resulting surface.

This keeps enforcement centralized instead of relying on 21 individual handlers.

## Judge path

Use `?demo=1` and follow this sequence:

1. Confirm Coach exposes 16 of 21 tools.
2. Select Collaborate while leaving learner-only commit enabled: 20 of 21.
3. Select exercise `ammonia_alkylation_01`.
4. Choose **Coauthor this step** and a four-action budget.
5. Start the session: 15 of 21.
6. Call `get_delegation_session`; it is unmetered.
7. Use four metered calls:
   - `get_mechanism_state`;
   - add the N lone-pair attack on methyl carbon;
   - `check_draft_step`;
   - stage the missing C–Br bond cleavage as a reviewable proposal.
8. The fourth call exhausts the session and the surface collapses to 3 of 21.
9. Call `get_agent_action_receipts`; it remains unmetered and shows one session ID with action ordinals 1–4.
10. End the session in the page; the 20-tool learner-only Collaborate surface returns.

The rewritten `docs/DEMO_SCRIPT.md` targets a 2:50–2:59 public YouTube recording with live audio.

## Verification evidence

### Automated

Final command:

`npm run verify`

Result:

- 19 test files passed;
- 114 tests passed;
- TypeScript project build passed;
- Vite production build passed;
- 77 modules transformed.

Production assets from the final build:

- `dist/assets/index-CbVrs6W3.css`
- `dist/assets/index-CWQdjFxv.js`
- `dist/assets/MolecularModel-BhjfHrh1.js`

Integration coverage includes:

- exact 21-tool catalog;
- active 15-tool Coauthor registration;
- cached blocked tool rejection without budget consumption;
- unmetered session and receipt reads;
- pre-canceled non-consumption;
- four-call exhaustion and three-control republishing;
- receipt action ordinals;
- learner restoration of the full surface;
- contract/session signature refresh;
- schema-v2 export behavior; and
- all prior chemistry, geometry, persistence, demo, replay, comparison, contract, and proof-ledger behavior.

### Static and structural

Command:

`python3 /Users/mihirduvedi/.codex/plugins/cache/personal/ui-design-studio/1.0.1/skills/ui-qa/scripts/ui_static_check.py . --json --strict`

Result:

- 75 files scanned;
- 0 errors;
- 0 warnings.

`git diff --check` also passes.

Current-document count and privacy scans found no stale 20-tool catalog claim and confirmed the fixed evidence boundary. Historical handoffs retain their original counts by design.

### Rendered browser QA

Local demo tested at `http://127.0.0.1:5173/?demo=1`.

Desktop at 1280×720:

- no horizontal overflow;
- setup state visually correct;
- Collaborate + Coauthor active state showed 15 of 21 and 0 of 4;
- exact surface contained the intended 15 tools;
- switching exercises as the learner produced immediate drift and a 3-of-21 control surface;
- ending the session restored 20 of 21;
- active, drifted, and restored layouts were visually inspected.

Phone at 390×844:

- setup, active, expanded exact-surface, and restoration states inspected;
- no horizontal overflow;
- no delegation child crossed the viewport;
- exact tool names stack legibly in one column;
- controls remain at usable sizes.

The browser console contained no warnings or errors.

Native `fieldset`, radio inputs, select, buttons, `details`, progress, headings, status regions, and labels are present. The browser automation adapter did not reliably dispatch arrow-key changes to radio inputs even after strict locator correction, so a real assistive-technology session and enlarged-text/forced-colors visual pass remain separate manual QA boundaries. CSS includes forced-colors handling and the static checker reported no accessibility findings.

### Live-host boundary

The controlled local browser reported Manual mode because it did not expose `document.modelContext`. Automated registration tests prove the page integration and dynamic surface behavior, but they do not prove current Site Tool discovery in a particular ChatGPT account or deployed host.

The previous live release did verify deployed Site Tools. This new feature still requires one live ChatGPT smoke test after deployment.

## Git and release state

No commit, push, deployment, external message, or PR action was performed.

The repository is on `main` at starting HEAD `1691ead`. Pushing `main` can auto-deploy GitHub Pages, so release requires fresh explicit approval.

The worktree already contained user-owned untracked handoff files. They were preserved. The new implementation adds its own untracked source/doc files alongside tracked modifications.

Do not reset, clean, stash wholesale, or stage every untracked file.

## Exact release batch if approved

Stage only these implementation paths plus the new handoff:

- `DESIGN.md`
- `README.md`
- `docs/AGENT_PROOF_LEDGER.md`
- `docs/COLLABORATION_CONTRACT.md`
- `docs/DEMO_SCRIPT.md`
- `docs/ELECTRON_FLOW_REPLAY.md`
- `docs/INTENT_BOUND_DELEGATION.md`
- `docs/JUDGE_GUIDE.md`
- `docs/PRACTICE_COMPASS.md`
- `docs/REACTION_DIFF.md`
- `docs/mechanism-canvas-prd.md`
- `handoffs/2026-08-30-intent-bound-delegation-impact-complete-handoff.md`
- `src/App.tsx`
- `src/components/AgentProofLedger.tsx`
- `src/components/CollaborationContract.tsx`
- `src/components/DelegationSession.tsx`
- `src/components/DemoNotice.tsx`
- `src/demo/judge-prompt.ts`
- `src/index.css`
- `src/webmcp/active-delegation-session.ts`
- `src/webmcp/delegation-session.test.ts`
- `src/webmcp/delegation-session.ts`
- `src/webmcp/register-tools.test.ts`
- `src/webmcp/register-tools.ts`
- `src/webmcp/tool-receipt-ledger.test.ts`
- `src/webmcp/tool-receipt-ledger.ts`

Do not stage the older untracked handoffs unless the user separately approves them.

Recommended commit message:

`feat: add intent-bound WebMCP delegation sessions`

After fresh approval:

1. stage the exact paths above;
2. inspect `git diff --cached --stat` and `git diff --cached --check`;
3. commit with the approved message;
4. ask again before pushing if push was not included in the approval;
5. push `main` only when explicitly approved;
6. wait for GitHub Pages deployment;
7. open the deployed `?demo=1` URL in ChatGPT's built-in browser;
8. run the full four-action judge path;
9. verify dynamic counts 16 → 20 → 15 → 3 → 20;
10. verify receipt action ordinals and that only the visible page restores the session;
11. check the deployed console and narrow viewport; and
12. update the release handoff with commit SHA, remote SHA, deployment evidence, and live-host evidence.

## Remaining risks

1. **Live ChatGPT discovery is not yet tested for this new surface.** Local automated tests cannot prove host/account support.
2. **Judge time pressure.** The complete path fits under three minutes only with a rehearsed prompt and preselected demo state.
3. **Keyboard/manual accessibility.** Native semantics and static checks are strong, but a real keyboard plus VoiceOver session is still advisable before submission.
4. **Release scope.** The dirty tree includes older user-owned handoffs that must not be swept into the feature commit.
5. **Deadline operations.** Leave time for Pages propagation, a live tool-discovery smoke test, video recording, and Devpost submission.

## Immediate next action

Ask the user for fresh approval to stage and commit the exact batch above. If they also explicitly approve pushing `main`, disclose that it can auto-deploy GitHub Pages and proceed through live verification. If approval is only for a commit, stop before push.

## Working style and safety

This project is a direct-edit hackathon build. Continue autonomously through coherent implementation and verification slices, but preserve the approval boundary for commit, push, deployment, external messages, and submission. Keep updates decision-first and evidence-backed. Distinguish automated, local rendered, deployed, and live Site Tool verification; never imply that one proves another.
