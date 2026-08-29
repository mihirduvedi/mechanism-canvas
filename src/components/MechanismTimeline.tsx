import {
  problemStepIndex,
  reachableHistoryStateIds,
  visibleStateId,
} from "../domain/problem-steps";
import type { MechanismState, ProblemDefinition } from "../domain/types";
import type { MechanismStore } from "../store/mechanism-store";

interface MechanismTimelineProps {
  problem: ProblemDefinition;
  state: MechanismState;
  store: MechanismStore;
}

function stageLabel(problem: ProblemDefinition, stateId: string): string {
  if (stateId === problem.currentStateId) return "Reactants";
  if (stateId === problem.completedStateId) return "Products";
  return "Intermediate";
}

export function MechanismTimeline({ problem, state, store }: MechanismTimelineProps) {
  const path = [problem.currentStateId, ...problem.steps.map((step) => step.toStateId)];
  const reachable = new Set(reachableHistoryStateIds(problem, state.history));
  const visibleId = visibleStateId(state);
  const currentStep = problemStepIndex(problem, state.currentStateId);
  const complete = state.currentStateId === problem.completedStateId;

  return (
    <nav className="mechanism-timeline" aria-label="Mechanism step history">
      <div className="mechanism-timeline__summary">
        <span>Reaction path</span>
        <strong>
          {complete ? "All steps committed" : `Step ${currentStep + 1} of ${problem.stepCount}`}
        </strong>
      </div>
      <ol>
        {path.map((stateId, index) => {
          const available = reachable.has(stateId);
          const current = stateId === state.currentStateId;
          const viewed = stateId === visibleId;
          const molecule = problem.states[stateId];
          const stateAction = current
            ? complete
              ? ", current committed state"
              : ", current editable state"
            : available
              ? ", view committed history"
              : ", not reached";
          return (
            <li
              className={[
                available ? "is-reached" : "is-locked",
                current ? "is-current" : "",
                viewed ? "is-viewed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={stateId}
            >
              <button
                type="button"
                disabled={!available}
                aria-current={viewed ? "step" : undefined}
                aria-label={`${stageLabel(problem, stateId)}: ${molecule.label}${stateAction}`}
                onClick={() => store.viewHistoryState(stateId, "human")}
              >
                <span className="mechanism-timeline__node" aria-hidden="true">
                  {available ? (index === 0 ? "R" : String(index)) : ""}
                </span>
                <span className="mechanism-timeline__copy">
                  <span>{stageLabel(problem, stateId)}</span>
                  <strong>{molecule.label}</strong>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
