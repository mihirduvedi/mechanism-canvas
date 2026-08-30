# Practice Compass

Practice Compass is Mechanism Canvas's cross-exercise learning layer. It converts evidence the application already owns—deterministic checks, authored hint requests, and active committed steps—into a visible local profile and a bounded next-practice handoff.

It does not call a model, infer identity, upload learner data, expose authored accepted bundles, or claim mastery.

## Why it matters

The original shared canvas made one exercise legible to a learner and an agent. Practice Compass adds continuity across the reviewed six-exercise library:

1. A learner checks or commits a mechanism step through the normal interface or a Site Tool.
2. The store records a compact `LearningSignal` containing the problem, step, classification, and reason codes—not the accepted answer.
3. A pure deterministic function derives progress, five evidence areas, and up to three next-practice recommendations across all exercise workspaces.
4. `get_learning_profile` lets an agent read the same profile shown in the page.
5. `propose_practice_plan` may stage one to three existing exercise IDs against the exact profile revision.
6. Only the learner-facing **Start this plan** or **Dismiss** action can resolve the proposal.

The result uses WebMCP for something brittle DOM automation cannot provide reliably: exact learning evidence with a revisioned human-agent handoff in the same live session.

## Evidence model

The profile reports five deliberately narrow areas:

- tracing electron sources;
- completing concerted steps;
- directing bond electrons;
- recognizing SN2 pathways;
- mapping proton transfers.

Each area is labeled **Not started**, **Building evidence**, or **Demonstrated**. “Demonstrated” means the learner has active commits for the bounded relevant fixtures. It is not a psychometric mastery estimate, grade, or guarantee of unaided performance.

The profile revision is a stable hash of learning-relevant state only: active commits, attempt and hint counts, and exact check classifications/reason codes. Viewing history, focusing an atom, switching exercises, or staging a plan does not alter the evidence revision.

## Recommendation contract

Recommendations are deterministic and inspectable:

- completed exercises are omitted;
- an in-progress exercise ranks before an untouched exercise;
- prior check and hint load brings a started exercise forward;
- stable fixture order and difficulty break ties;
- no more than three recommendations are returned.

The recommendation copy explains whether the learner is continuing an exercise, revisiting prior check evidence, or starting a fresh reaction context.

## Human-control boundary

`propose_practice_plan` accepts exactly:

- `problemIds`: one to three unique IDs already present in the profile;
- `rationale`: 1–400 characters;
- `expectedProfileRevision`: the current `profileRevision`.

Staging a plan adds an agent activity event and a visible proposal. It does not change the open problem, mechanism revision, draft, check result, history, attempts, hints, learning signals, or profile revision.

Starting a plan is intentionally unavailable through Site Tools. The learner's visible action verifies the profile revision again, records human acceptance, opens the first exercise, and clears the proposal. New learning evidence makes a pending plan stale; it must be dismissed and regenerated. Dismissal clears only the proposal.

This mirrors the existing electron-flow proposal gate: agents can prepare a structured choice, while learner consent remains a separate first-class event.

## Persistence and privacy

Saved practice uses `mechanism-canvas:workspace:v6`. It retains per-problem signals, an optional practice-plan proposal, and the learner-owned Collaboration Contract in local browser storage, with migrations from v5, v4, v3, v2, and v1. `?demo=1` supplies no storage object, so profile evidence, plans, and contract choices reset on refresh and never touch saved practice.

The profile contains no dedicated identity field, model conversation, freeform reflection, accepted-answer definition, unreached state graph, validation token, or cloud identifier. A rationale is agent-authored display text and is bounded to 400 characters.

## Site Tools

### `get_learning_profile`

Read-only, idempotent, and closed-world. It returns:

- local persistence mode;
- the learner-control statement;
- aggregate progress;
- skill evidence;
- per-exercise progress;
- deterministic recommendations;
- an optional pending proposal with a computed stale flag.

### `propose_practice_plan`

Non-destructive, non-idempotent, and closed-world. It stages only a proposal and returns `awaitingLearnerApproval: true`. There is no matching acceptance tool.

## Verification

Automated coverage protects:

- honest empty evidence;
- exact reason-code aggregation;
- stable revision changes after a check;
- cross-exercise store derivation;
- v6 persistence and older-schema migration;
- proposal persistence without learner-side effects;
- learner-only acceptance;
- stale-plan rejection after new evidence;
- adaptive 9–19-tool registration, schemas, and annotations;
- no plan-acceptance Site Tool;
- reviewed production-catalog membership.

Rendered QA separately covers desktop and phone layouts, progress semantics, plan controls, stale/empty states, keyboard focus, and the surrounding chemistry workspace.

## Source map

- Pure evidence derivation: `src/domain/practice-compass.ts`
- Domain types: `src/domain/types.ts`
- Signals, persistence, and commands: `src/store/mechanism-store.ts`
- Learner interface: `src/components/PracticeCompass.tsx`
- Site Tools: `src/webmcp/register-tools.ts`
- Styling and responsive behavior: `src/index.css`
- Contract tests: `src/domain/practice-compass.test.ts`, `src/store/mechanism-store.test.ts`, and `src/webmcp/register-tools.test.ts`
