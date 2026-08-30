# Reviewable Agent Draft Proposals

Reviewable Agent Proposals make the human-agent handoff explicit. A WebMCP agent may stage a structured electron-flow idea on the shared page, but the proposal remains outside the learner's draft until the learner selects **Add to my draft**. There is intentionally no Site Tool that accepts or declines a proposal.

## Why this exists

Direct agent draft edits are still available for learner-requested actions, but they do not demonstrate the strongest collaborative pattern on their own. The proposal gate gives the learner a concrete decision:

1. The learner or agent creates and checks a partial draft.
2. The agent reads stable entity IDs and calls `propose_draft_arrows` with one to four compatible additions.
3. The page shows the agent's rationale and a plain-language mirror of every proposed arrow.
4. Staging changes neither `mechanismRevision` nor the visible draft.
5. The learner accepts or declines through the normal interface.
6. Acceptance adds agent-authored arrows in one revision, clears any old validation, and still requires a deterministic check.

This preserves the product rule that the app grades, the agent coaches, and the learner decides.

## Site Tool contract

`propose_draft_arrows` accepts:

- `arrows`: one to four objects containing `sourceType`, `sourceEntityId`, and `targetAtomId`;
- `rationale`: 1–400 characters of clearly labeled agent-authored explanation; and
- `expectedRevision`: the exact current `mechanismRevision`.

The tool validates only current structured IDs, revision freshness, source uniqueness, and compatibility with the existing draft. It does not compare the proposal with an authored accepted bundle or return correctness language. A successful result returns `awaitingLearnerApproval: true`, the proposal payload, the unchanged revision, and the unchanged draft count.

`get_mechanism_state` exposes the active proposal and a derived `stale` flag. A draft edit or committed-state change after staging makes the proposal outdated. The learner can dismiss it, but cannot apply it to a different revision.

## Store and persistence invariants

- `AgentDraftProposal` records problem ID, state ID, base revision, arrows, rationale, creation time, and proposal ID.
- Proposal staging appends `proposal_staged` with actor `agent`; it does not change chemistry revision.
- Learner acceptance appends `proposal_accepted` with actor `human`, while each added `ArrowDraft` retains actor `agent`.
- Learner decline appends `proposal_declined` with actor `human` and changes no revision or draft.
- Acceptance is atomic: all proposed arrows are added in one revision or none are.
- Existing draft sources cannot be proposed again, preventing ambiguous merge behavior.
- Saved practice persists the active proposal in local schema v4. The v3, v2, and v1 loaders remain supported; older workspaces restore with no pending proposal.
- Demo mode remains memory-only and resets the proposal on refresh with the rest of the clean workspace.

## User interface and accessibility

The proposal surface sits between deterministic feedback and authored hints. Empty state copy explains the capability even when Site Tools are unavailable. An active proposal provides:

- a visible **Agent note · not validation** label;
- an ordered, plain-language arrow list;
- an explicit revision boundary;
- a learner-only **Add to my draft** button;
- a **Decline proposal** action; and
- an outdated state with an explanation and a dismissal path.

Controls are native buttons with visible focus treatment and 44-pixel minimum action height. On narrow screens, the decision controls stack to full width. Status and newly staged proposal content are announced through the existing polite live region. Color is not the only stale-state signal: the surface also says **Outdated** and explains why acceptance is unavailable.

## Source map

| Concern | Source |
|---|---|
| Proposal, arrow, activity, and mechanism-state types | `src/domain/types.ts` |
| Validation, atomic acceptance, decline, and v4 persistence | `src/store/mechanism-store.ts` |
| Learner review surface | `src/components/ReasoningPanel.tsx` |
| Proposal styling and responsive states | `src/index.css` |
| WebMCP schema, execution, and state output | `src/webmcp/register-tools.ts` |
| Store behavior and persistence tests | `src/store/mechanism-store.test.ts` |
| Site Tool contract tests | `src/webmcp/register-tools.test.ts` |

## Verification boundary

Automated tests prove revision safety, draft separation, human-only approval at the tool catalog boundary, decline behavior, source-conflict rejection, v4 restore, WebMCP schemas, and shared provenance. Rendered QA must separately verify proposal appearance, keyboard operation, narrow reflow, enlarged text, stale messaging, live-region behavior, and console cleanliness in the exact running build. A browser test that invokes the store directly is not live WebMCP proof; live Site Tool verification still requires a supported ChatGPT in-app browser or WebMCP-enabled Chrome.
