import { describeArrow } from "../domain/chemistry";
import type { MechanismState, ProblemDefinition } from "../domain/types";
import type { MechanismStore } from "../store/mechanism-store";

interface DraftTrayProps {
  problem: ProblemDefinition;
  state: MechanismState;
  store: MechanismStore;
}

export function DraftTray({ problem, state, store }: DraftTrayProps) {
  const molecule = problem.states[state.currentStateId];
  const validation = state.latestValidation;
  const canCommit = validation?.classification === "valid";
  const canUndo = state.history.some((record) => record.undoneAt === null);
  const complete = state.currentStateId === problem.completedStateId;

  return (
    <section className="draft-tray" aria-labelledby="draft-heading">
      <div className="draft-tray__heading">
        <div>
          <p className="section-kicker">Atomic bundle</p>
          <h2 id="draft-heading">Draft arrows</h2>
        </div>
        <span className="revision-label">rev {state.mechanismRevision}</span>
      </div>

      {state.draftArrows.length === 0 ? (
        <div className="draft-empty">
          <span className="draft-empty__line" aria-hidden="true" />
          <p>{complete ? "No draft while the product is committed." : "Your selected electron movements will appear here before they change the structure."}</p>
        </div>
      ) : (
        <ol className="arrow-list">
          {state.draftArrows.map((arrow, index) => (
            <li key={arrow.id}>
              <span className="arrow-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{describeArrow(molecule, arrow)}</strong>
                <span className={`actor-mark actor-mark--${arrow.actor}`}>{arrow.actor}</span>
              </div>
              <button
                type="button"
                className="remove-arrow"
                aria-label={`Remove arrow ${index + 1}: ${describeArrow(molecule, arrow)}`}
                onClick={() => store.removeDraftArrow(arrow.id, "human")}
              >
                Remove
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="action-row" aria-label="Mechanism actions">
        <button
          className="button button--primary"
          type="button"
          disabled={state.draftArrows.length === 0 || complete}
          title={state.draftArrows.length === 0 ? "Add at least one arrow first" : undefined}
          onClick={() => store.checkDraftStep("human")}
        >
          Check step
        </button>
        <button
          className="button button--commit"
          type="button"
          disabled={!canCommit}
          title={!canCommit ? "A current valid check is required" : undefined}
          onClick={() => validation && store.commitCheckedStep(validation.validationId, "human")}
        >
          Commit checked step
        </button>
        <button
          className="button button--secondary"
          type="button"
          disabled={!canUndo}
          title={!canUndo ? "There is no committed step to undo" : undefined}
          onClick={() => store.undoLastCommit("human")}
        >
          Undo commit
        </button>
        <button
          className="text-button"
          type="button"
          disabled={state.draftArrows.length === 0}
          onClick={() => store.clearDraft("human")}
        >
          Clear draft
        </button>
      </div>
    </section>
  );
}
