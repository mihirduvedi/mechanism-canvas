# Collaboration Contract

The Collaboration Contract is Mechanism Canvas's learner-owned WebMCP permission layer. It turns “help me without taking over” from a prompt preference into an application-enforced contract.

## Product problem

Visual AI tutors usually fail in one of two ways:

1. They remain outside the learner's exact work and infer state from prose, screenshots, or coordinates.
2. They gain enough control to finish the work, but the learner has no reliable way to bound hints, preserve productive struggle, or reserve consequential steps.

Prompt instructions do not solve the second failure because the same model being constrained is also asked to interpret and follow the constraint. Mechanism Canvas instead puts the policy in the page that owns the semantic graph and domain commands.

This is supported by a real educational risk, not only a demo preference. A field experiment with nearly 1,000 high-school mathematics students found that unguarded GPT access improved assisted practice but reduced later unassisted performance; a purpose-built tutoring interface largely mitigated the negative effect. See [Bastani et al., “Generative AI Without Guardrails Can Harm Learning,” PNAS 122(26), 2025](https://doi.org/10.1073/pnas.2422633122).

## Why this is a WebMCP-native feature

Only the open application knows all three inputs required to enforce a useful tutoring boundary:

- the learner's current permission contract;
- the exact semantic objects and revision the agent would act on; and
- the domain validator that decides whether the result is accepted.

WebMCP lets the page expose a tool surface derived from those inputs. Screenshot automation cannot discover a closed-world capability set or carry a mechanism revision. A generic chatbot cannot remove its own commands from the browser host. A second agent-only API would split the human and agent states.

Mechanism Canvas therefore uses two enforcement layers:

1. **Capability discovery:** the browser registers only the tools enabled by the current contract. Changing the contract aborts the prior registrations and publishes a new surface.
2. **Command authorization:** the shared `MechanismStore` independently rejects a forbidden agent call with `LEARNER_CONTROLLED`, even if an old host view or direct caller still holds a stale tool definition.

The learner changes the contract through native page controls. There is deliberately no `set_collaboration_contract` Site Tool.

## Modes and exact tool surfaces

| Mode | Default count | Agent role | Enabled additions |
|---|---:|---|---|
| Observe | 9 | Read and present evidence without changing the exercise or learning record | State, contract, profile, entity inspection, activity, reached-history view, comparison, replay, focus |
| Coach | 14 | Check learner work and prepare bounded handoffs | Practice plan, arrow proposal, deterministic check, hint request, problem switch |
| Collaborate | 18–19 | Make revision-bound draft edits and reversible state changes | Add/remove arrow, undo, reset; commit only with separate learner opt-in |

Coach is the default. It permits an agent to check a learner's draft and stage a structured suggestion, but the agent cannot place arrows directly or commit chemistry.

The hint ceiling changes Coach and Collaborate behavior:

- level 0 removes `request_scaffold` from discovery;
- levels 1–4 expose the tool with a schema maximum equal to the learner's ceiling;
- the store repeats the same maximum check at execution time;
- human hint controls remain available at all four authored levels.

The learner-only commit switch applies in Collaborate mode. When enabled, `commit_checked_step` is absent and the store refuses agent commits. The agent may still run the deterministic check; the visible learner action consumes the resulting current validation token.

## State and persistence

```ts
interface CollaborationContract {
  mode: "observe" | "coach" | "collaborate";
  maxAgentScaffoldLevel: 0 | 1 | 2 | 3 | 4;
  learnerCommitsOnly: boolean;
  revision: number;
}
```

Saved practice uses `mechanism-canvas:workspace:v6`. The v6 catalog stores the contract next to per-problem workspaces and the optional practice-plan proposal. v5, v4, v3, v2, and v1 records still load and receive the safe default contract. The `?demo=1` route keeps the contract in memory and resets it to Coach on refresh.

Changing the contract:

- increments only `CollaborationContract.revision`;
- appends a human `collaboration_contract_changed` activity event;
- does not change `mechanismRevision`, validation, draft arrows, progress, checks, or the Practice Compass profile revision;
- does not erase pending proposals that the learner may still accept or dismiss.

## Transfer beyond chemistry

Chemistry is the flagship implementation because it is a demanding semantic canvas: dots, bonds, arrows, charges, coupled moves, and transient revisions cannot be inferred safely from coordinates. The contract itself is domain-independent. The same pattern can govern:

- whether an agent may edit or only inspect a circuit diagram;
- whether it may reveal a geometric construction step or only test a learner's construction;
- whether it may change a data-flow graph or only explain a failing edge;
- whether it may modify a CAD assembly or only stage a reviewable operation.

Mechanism Canvas does not claim these additional editors are implemented. It demonstrates the reusable policy architecture in a complete, chemistry-reviewed product rather than presenting a framework without a real domain.

## Judge proof

1. Open the clean demo. Coach mode reports 14 of 19 tools.
2. Read `get_collaboration_contract`; its response names the current surface and states that no Site Tool can change it.
3. Select Collaborate while leaving learner-only commits enabled. The page reports 18 of 19 tools and the browser's Site Tools menu updates.
4. Let the agent add and check an intentionally incomplete arrow, then stage the missing arrow through `propose_draft_arrows`.
5. Accept the proposal in the page, ask the agent to check again, and observe that `commit_checked_step` remains unavailable.
6. Select **Commit checked step** as the learner. The deterministic validator—not the contract or model—authorizes the chemistry transition.

This sequence demonstrates WebMCP leverage, a complete human-agent experience, a credible learning safeguard, and an interaction that is difficult to reproduce with screenshot or DOM automation.

## Verification

Automated tests cover:

- default Coach policy and exact counts;
- Observe, Coach-with-no-hints, Collaborate-with-learner-commit, and full Collaborate surfaces;
- abort-signal removal and adaptive re-registration;
- store-level denial of hidden or stale agent actions;
- hint-ceiling enforcement;
- learner-only and shared commit boundaries;
- contract revision independence from chemistry revision;
- v6 persistence and safe defaults for older records.

Rendered QA separately covers the three native radio controls, hint select, commit checkbox, contract receipt, authority stack, responsive reflow, keyboard semantics, and zero horizontal overflow.

## Source map

- Policy and defaults: `src/domain/collaboration-contract.ts`
- Types and activity event: `src/domain/types.ts`
- Store authorization and v6 persistence: `src/store/mechanism-store.ts`
- Adaptive WebMCP registration: `src/webmcp/register-tools.ts`
- Learner interface: `src/components/CollaborationContract.tsx`
- Responsive visual system: `src/index.css`
- Store and tool contracts: `src/store/mechanism-store.test.ts`, `src/webmcp/register-tools.test.ts`
