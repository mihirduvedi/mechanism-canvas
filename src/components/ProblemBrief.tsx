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
      <div className="rail-index" aria-hidden="true">
        {String(problemIndex + 1).padStart(2, "0")} / {String(problems.length).padStart(2, "0")}
      </div>
      <div className="problem-picker">
        <label htmlFor="problem-select">Exercise</label>
        <select
          id="problem-select"
          value={problem.id}
          onChange={(event) => onProblemChange(event.target.value)}
        >
          {problems.map((candidate, index) => (
            <option value={candidate.id} key={candidate.id}>
              {String(index + 1).padStart(2, "0")} · {familyLabel(candidate.reactionFamily)}
            </option>
          ))}
        </select>
      </div>
      <p className="section-kicker">Current reaction</p>
      <h1 id="problem-title">{problem.title}</h1>
      <div className="family-stamp">
        <span className="family-stamp__label">Family</span>
        <strong>{familyLabel(problem.reactionFamily)}</strong>
      </div>

      <div className={`review-stamp review-stamp--${problem.review.status}`}>
        <span aria-hidden="true" />
        {reviewLabel(problem.review.status)}
      </div>

      <p className="problem-prompt">{problem.prompt}</p>
      <details className="context-note">
        <summary>
          <span>What this exercise models</span>
          <span className="context-note__toggle" aria-hidden="true" />
        </summary>
        <p>{problem.contextNote}</p>
      </details>

      <section className="objective-block" aria-labelledby="objective-heading">
        <h2 id="objective-heading">Goal</h2>
        <p>{problem.objective}</p>
      </section>

      <section className="progress-block" aria-labelledby="progress-heading">
        <h2 id="progress-heading">Progress</h2>
        <dl className="compact-stats">
          <div>
            <dt>State</dt>
            <dd>
              {complete ? "Products" : currentStepIndex === 0 ? "Reactants" : "Intermediate"}
            </dd>
          </div>
          <div>
            <dt>Checks made</dt>
            <dd>{state.attemptCount}</dd>
          </div>
          <div>
            <dt>Hints opened</dt>
            <dd>{state.hintCount}</dd>
          </div>
          <div>
            <dt>Revision</dt>
            <dd>{state.mechanismRevision}</dd>
          </div>
          <div>
            <dt>Step</dt>
            <dd>{complete ? `${problem.stepCount} / ${problem.stepCount}` : `${currentStepIndex + 1} / ${problem.stepCount}`}</dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd>{problem.difficulty}</dd>
          </div>
        </dl>
      </section>

      <div className="storage-note">
        <span className="storage-note__mark" aria-hidden="true" />
        <p>
          {demoMode
            ? "This demo resets on refresh. Your saved practice is untouched."
            : "Your work stays in this browser. A refresh keeps the draft but clears check approval."}
        </p>
      </div>

      <button className="text-button text-button--danger" type="button" onClick={onReset}>
        Reset exercise
      </button>
    </aside>
  );
}
