import type { MechanismState, ProblemDefinition, ValidationClass } from "../domain/types";
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
  const activeScaffold = state.highestScaffoldLevel
    ? problem.scaffold.find((entry) => entry.level === state.highestScaffoldLevel)
    : null;

  return (
    <aside className="reasoning-rail" aria-label="Reasoning feedback and activity">
      <section className="feedback-section" aria-labelledby="feedback-heading" aria-live="polite">
        <p className="section-kicker">Deterministic check</p>
        <h2 id="feedback-heading">Reasoning feedback</h2>
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
        ) : complete ? (
          <div className="validation-note validation-note--valid validation-note--committed">
            <div className="validation-note__header">
              <span className="validation-symbol" aria-hidden="true">✓</span>
              <div>
                <span className="validation-label">Committed result</span>
                <strong>{problem.feedback.committedSummary}</strong>
              </div>
            </div>
            <ul>
              <li>
                <code>REVERSIBLE_COMMIT</code>
                <span>Use Undo commit to restore the reactants without deleting the earlier activity record.</span>
              </li>
            </ul>
          </div>
        ) : (
          <div className="feedback-empty">
            <span aria-hidden="true">↳</span>
            <p>Check a draft to compare the complete electron movement against the authored mechanism.</p>
          </div>
        )}
      </section>

      <section className="scaffold-section" aria-labelledby="scaffold-heading">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Optional help</p>
            <h2 id="scaffold-heading">Scaffold ladder</h2>
          </div>
          <span>{state.highestScaffoldLevel}/4</span>
        </div>
        <div className="scaffold-buttons" aria-label="Choose a scaffold level">
          {problem.scaffold.map((entry) => (
            <button
              type="button"
              className={state.highestScaffoldLevel >= entry.level ? "is-opened" : ""}
              aria-label={`Open scaffold ${entry.level}: ${entry.title}`}
              onClick={() => store.requestScaffold(entry.level, "human")}
              key={entry.level}
            >
              {entry.level}
            </button>
          ))}
        </div>
        {activeScaffold ? (
          <div className="scaffold-copy">
            <span>Level {activeScaffold.level}</span>
            <strong>{activeScaffold.title}</strong>
            <p>{activeScaffold.message}</p>
          </div>
        ) : (
          <p className="scaffold-empty">Open level 1 for a general principle. Later levels get more specific.</p>
        )}
      </section>

      <section className="activity-section" aria-labelledby="activity-heading">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">Shared provenance</p>
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
              <li key={event.id}>
                <span className={`activity-avatar activity-avatar--${event.actor}`} aria-hidden="true">
                  {actorInitial(event.actor)}
                </span>
                <div>
                  <p>{event.summary}</p>
                  <span>
                    {event.actor} · {formatEventTime(event.timestamp)}
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
