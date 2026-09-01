import type { MechanismState, ProblemDefinition } from "../domain/types";
import { problemStepIndex } from "../domain/problem-steps";

interface ProblemBriefProps {
  problem: ProblemDefinition;
  problems: readonly ProblemDefinition[];
  state: MechanismState;
  demoMode: boolean;
  onProblemChange: (problemId: string) => void;
  onReset: () => void;
}

function reviewLabel(status: ProblemDefinition["review"]["status"]): string {
  if (status === "verified") return "Chemistry reviewed";
  if (status === "in_review") return "Chemistry review in progress";
  return "Prototype · review pending";
}

function familyLabel(family: ProblemDefinition["reactionFamily"]): string {
  if (family === "SN2") return "SN2 substitution";
  if (family === "proton_transfer") return "Proton transfer";
  return "SN2 + proton transfer";
}

export function ProblemBrief({
  problem,
  problems,
  state,
  demoMode,
  onProblemChange,
  onReset,
}: ProblemBriefProps) {
  const complete = state.currentStateId === problem.completedStateId;
  const currentStepIndex = problemStepIndex(problem, state.currentStateId);
  const problemIndex = problems.findIndex((candidate) => candidate.id === problem.id);

  return (
    <aside className="problem-rail" aria-labelledby="problem-title">
      <div className="problem-rail__topline">
        <div className="rail-index" aria-label={`Exercise ${problemIndex + 1} of ${problems.length}`}>
          {String(problemIndex + 1).padStart(2, "0")}
          <span aria-hidden="true">/</span>
          <small>{String(problems.length).padStart(2, "0")}</small>
        </div>
        <div className={`review-stamp review-stamp--${problem.review.status}`}>
          <span aria-hidden="true" />
          {reviewLabel(problem.review.status)}
        </div>
      </div>

      <div className="problem-picker">
        <label htmlFor="problem-select">Choose an exercise</label>
        <select
          id="problem-select"
          value={problem.id}
          onChange={(event) => onProblemChange(event.target.value)}
        >
          {problems.map((candidate, index) => (
            <option value={candidate.id} key={candidate.id}>
              {String(index + 1).padStart(2, "0")} · {candidate.title} · {familyLabel(candidate.reactionFamily)}
            </option>
          ))}
        </select>
      </div>

      <p className="section-kicker">Current reaction</p>
      <h2 id="problem-title">{problem.title}</h2>
      <p className="problem-family">{familyLabel(problem.reactionFamily)}</p>
      <p className="problem-prompt">{problem.prompt}</p>

      <section className="objective-block" aria-labelledby="objective-heading">
        <h3 id="objective-heading">Your job</h3>
        <p>{problem.objective}</p>
      </section>

      <dl className="compact-stats compact-stats--primary" aria-label="Current progress">
        <div>
          <dt>State</dt>
          <dd>{complete ? "Products" : currentStepIndex === 0 ? "Reactants" : "Intermediate"}</dd>
        </div>
        <div>
          <dt>Step</dt>
          <dd>{complete ? `${problem.stepCount}/${problem.stepCount}` : `${currentStepIndex + 1}/${problem.stepCount}`}</dd>
        </div>
        <div>
          <dt>Checks</dt>
          <dd>{state.attemptCount}</dd>
        </div>
      </dl>

      <details className="problem-rail__more">
        <summary>
          <span>More about this exercise</span>
          <span className="context-note__toggle" aria-hidden="true" />
        </summary>
        <div className="problem-rail__more-content">
          <p>{problem.contextNote}</p>
          <dl className="compact-stats compact-stats--secondary">
            <div>
              <dt>Hints opened</dt>
              <dd>{state.hintCount}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{state.mechanismRevision}</dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>{problem.difficulty}</dd>
            </div>
          </dl>
          <p className="storage-note">
            {demoMode
              ? "Refresh to reset this demo. Saved practice stays separate."
              : "This browser keeps your draft. Refreshing clears check approval."}
          </p>
          <button className="text-button text-button--danger" type="button" onClick={onReset}>
            Reset exercise
          </button>
        </div>
      </details>
    </aside>
  );
}
