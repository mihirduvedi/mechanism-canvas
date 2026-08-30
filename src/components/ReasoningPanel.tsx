import { describeArrow } from "../domain/chemistry";
import type { MechanismState, ProblemDefinition, ValidationClass } from "../domain/types";
import { problemStepForState } from "../domain/problem-steps";
import type { MechanismStore } from "../store/mechanism-store";

interface ReasoningPanelProps {
  problem: ProblemDefinition;
  state: MechanismState;
  store: MechanismStore;
}

const validationLabels: Record<ValidationClass, string> = {
  valid: "Accepted step",
  incomplete: "Incomplete bundle",
  invalid_invariant: "Chemistry conflict",
  not_accepted_path: "Different pathway",
  invalid_input: "Nothing to check",
};

function actorInitial(actor: MechanismState["activity"][number]["actor"]): string {
  if (actor === "human") return "Y";
  if (actor === "agent") return "A";
  if (actor === "validator") return "V";
  return "S";
}

function actorLabel(actor: MechanismState["activity"][number]["actor"]): string {
  if (actor === "human") return "you";
  if (actor === "validator") return "check";
  return actor;
}

function activityTone(
  event: MechanismState["activity"][number],
): NonNullable<MechanismState["activity"][number]["outcome"]> {
  if (event.outcome) return event.outcome;
  if (event.kind === "step_committed") return "success";
  if (event.kind !== "step_checked") return "neutral";
  const summary = event.summary.toLowerCase();
  if (summary.startsWith("accepted") || /\bvalid\b/.test(summary)) return "success";
  if (summary.includes("incomplete")) return "warning";
  return "error";
}

function activitySymbol(event: MechanismState["activity"][number]): string {
  const tone = activityTone(event);
  if (tone === "success") return "✓";
  if (tone === "warning") return "!";
  if (tone === "error") return "×";
  return actorInitial(event.actor);
}

function formatEventTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

export function ReasoningPanel({ problem, state, store }: ReasoningPanelProps) {
  const validation = state.latestValidation;
  const complete = state.currentStateId === problem.completedStateId;
  const molecule = problem.states[state.currentStateId];
  const proposal = state.agentProposal;
  const proposalMolecule = proposal ? problem.states[proposal.stateId] ?? molecule : molecule;
  const proposalStale = Boolean(
    proposal &&
      (proposal.problemId !== problem.id ||
        proposal.stateId !== state.currentStateId ||
        proposal.baseRevision !== state.mechanismRevision),
  );
  const proposalAcceptBlocked = proposalStale || state.historyViewStateId !== null || complete;
  const proposalBlockedReason = proposalStale
    ? "The draft or committed state changed after this proposal was staged."
    : state.historyViewStateId !== null
      ? "Return to the current mechanism state before reviewing this proposal."
      : complete
        ? "This mechanism is already complete."
        : null;
  const activeStep = problemStepForState(problem, state.currentStateId);
  const latestActiveCommit = state.history.findLast((record) => record.undoneAt === null);
  const latestCommittedStep = latestActiveCommit
    ? problem.steps.find(
        (step) =>
          step.fromStateId === latestActiveCommit.fromStateId &&
          step.toStateId === latestActiveCommit.toStateId,
      )
    : null;
  const activeScaffold = state.visibleScaffoldLevel
    ? activeStep?.scaffold.find((entry) => entry.level === state.visibleScaffoldLevel)
    : null;

  return (
    <aside className="reasoning-rail" aria-label="Reasoning feedback and activity">
      <section className="feedback-section" aria-labelledby="feedback-heading" aria-live="polite">
        <p className="section-kicker">Deterministic check</p>
        <h2 id="feedback-heading">Check result</h2>
        {validation ? (
          <div className={`validation-note validation-note--${validation.classification}`}>
            <div className="validation-note__header">
              <span className="validation-symbol" aria-hidden="true">
                {validation.classification === "valid" ? "✓" : validation.classification === "incomplete" ? "…" : "!"}
              </span>
              <div>
                <span className="validation-label">{validationLabels[validation.classification]}</span>
                <strong>{validation.summary}</strong>
              </div>
            </div>
            <ul>
              {validation.issues.map((validationIssue) => (
                <li key={validationIssue.code}>
                  <code>{validationIssue.code}</code>
                  <span>{validationIssue.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : complete || latestCommittedStep ? (
          <div className="validation-note validation-note--valid validation-note--committed">
            <div className="validation-note__header">
              <span className="validation-symbol" aria-hidden="true">✓</span>
              <div>
                <span className="validation-label">
                  {complete ? "Committed mechanism" : "Previous step committed"}
                </span>
                <strong>
                  {latestCommittedStep?.feedback.committedSummary ??
                    "The authored mechanism is committed."}
                </strong>
              </div>
            </div>
            <ul>
              <li>
                <code>REVERSIBLE_COMMIT</code>
                <span>
                  {complete
                    ? "Use Undo commit to restore the last intermediate without deleting the earlier activity record."
                    : "The next authored step is ready. Undo remains available without deleting the earlier activity record."}
                </span>
              </li>
            </ul>
          </div>
        ) : (
          <div className="feedback-empty">
            <span aria-hidden="true">↳</span>
            <p>Check the draft when the complete electron movement is ready.</p>
          </div>
        )}
      </section>

      <section
        className="agent-proposal-section"
        aria-labelledby="agent-proposal-heading"
        aria-live="polite"
      >
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Human-in-the-loop handoff</p>
            <h2 id="agent-proposal-heading">Agent proposal</h2>
          </div>
          <span className={proposalStale ? "proposal-status is-stale" : "proposal-status"}>
            {proposal ? (proposalStale ? "Outdated" : "Your decision") : "Waiting"}
          </span>
        </div>
        {proposal ? (
          <div className={proposalStale ? "agent-proposal is-stale" : "agent-proposal"}>
            <div className="agent-proposal__note">
              <span>Agent note · not validation</span>
              <p>{proposal.rationale}</p>
            </div>
            <ol className="agent-proposal__arrows">
              {proposal.arrows.map((arrow, index) => (
                <li key={`${arrow.source.kind}:${arrow.source.entityId}:${arrow.target.entityId}`}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <strong>
                    {describeArrow(proposalMolecule, {
                      id: `${proposal.id}_arrow_${index + 1}`,
                      source: arrow.source,
                      target: arrow.target,
                      actor: "agent",
                    })}
                  </strong>
                </li>
              ))}
            </ol>
            {proposalBlockedReason && (
              <p className="agent-proposal__warning">{proposalBlockedReason}</p>
            )}
            <div className="agent-proposal__actions">
              <button
                className="button button--primary"
                type="button"
                disabled={proposalAcceptBlocked}
                onClick={() => store.acceptAgentProposal(proposal.id)}
              >
                Add to my draft
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() => store.declineAgentProposal(proposal.id)}
              >
                {proposalStale ? "Dismiss outdated proposal" : "Decline proposal"}
              </button>
            </div>
            <p className="agent-proposal__boundary">
              Bound to revision {proposal.baseRevision}. Accepting adds visible draft arrows;
              it never checks or commits chemistry.
            </p>
          </div>
        ) : (
          <div className="agent-proposal-empty">
            <span aria-hidden="true">A→Y</span>
            <p>
              A site-tools agent can stage an electron-flow idea here. Nothing enters your
              draft until you approve it.
            </p>
          </div>
        )}
      </section>

      <section className="scaffold-section" aria-labelledby="scaffold-heading">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Optional help</p>
            <h2 id="scaffold-heading">Hints</h2>
          </div>
          <span>{state.highestScaffoldLevel}/4</span>
        </div>
        <div className="scaffold-buttons" aria-label="Choose a scaffold level">
          {(activeStep?.scaffold ?? []).map((entry) => (
            <button
              type="button"
              className={[
                state.highestScaffoldLevel >= entry.level ? "is-opened" : "",
                state.visibleScaffoldLevel === entry.level ? "is-active" : "",
              ].filter(Boolean).join(" ")}
              aria-label={`Open scaffold ${entry.level}: ${entry.title}`}
              aria-pressed={state.visibleScaffoldLevel === entry.level}
              disabled={complete || state.historyViewStateId !== null}
              onClick={() => store.requestScaffold(entry.level, "human")}
              key={entry.level}
            >
              {entry.level}
            </button>
          ))}
        </div>
        {activeScaffold ? (
          <div className="scaffold-copy">
            <div className="scaffold-copy__heading">
              <span>Hint {activeScaffold.level}</span>
              <button type="button" onClick={store.dismissScaffold}>Hide hint</button>
            </div>
            <strong>{activeScaffold.title}</strong>
            <p>{activeScaffold.message}</p>
          </div>
        ) : (
          <p className="scaffold-empty">Open hint 1 for a small nudge. Later hints reveal more.</p>
        )}
      </section>

      <section className="activity-section" aria-labelledby="activity-heading">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Human and agent actions</p>
            <h2 id="activity-heading">Activity trail</h2>
          </div>
          <span>{state.activity.length}</span>
        </div>
        {state.activity.length === 0 ? (
          <div className="activity-empty">
            <p>No actions yet. Human and agent changes will appear in the same record.</p>
          </div>
        ) : (
          <ol className="activity-list">
            {[...state.activity].reverse().slice(0, 12).map((event) => (
              <li className={`activity-item activity-item--${activityTone(event)}`} key={event.id}>
                <span className={`activity-avatar activity-avatar--${event.actor}`} aria-hidden="true">
                  {activitySymbol(event)}
                </span>
                <div>
                  <p>{event.summary}</p>
                  <span className="activity-meta">
                    {actorLabel(event.actor)} · {formatEventTime(event.timestamp)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </aside>
  );
}
