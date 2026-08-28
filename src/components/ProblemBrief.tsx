import type { MechanismState, ProblemDefinition } from "../domain/types";

interface ProblemBriefProps {
  problem: ProblemDefinition;
  problems: readonly ProblemDefinition[];
  state: MechanismState;
  onProblemChange: (problemId: string) => void;
  onReset: () => void;
}

function reviewLabel(status: ProblemDefinition["review"]["status"]): string {
  if (status === "verified") return "Chemistry reviewed";
  if (status === "in_review") return "Chemistry review in progress";
  return "Prototype · review pending";
}

function familyLabel(family: ProblemDefinition["reactionFamily"]): string {
  return family === "SN2" ? "SN2 substitution" : "Proton transfer";
}

export function ProblemBrief({
  problem,
  problems,
  state,
  onProblemChange,
  onReset,
}: ProblemBriefProps) {
  const complete = state.currentStateId === problem.completedStateId;
  const problemIndex = problems.findIndex((candidate) => candidate.id === problem.id);

  return (
    <aside className="problem-rail" aria-labelledby="problem-title">
      <div className="rail-index" aria-hidden="true">
        {String(problemIndex + 1).padStart(2, "0")} / {String(problems.length).padStart(2, "0")}
      </div>
      <div className="problem-picker">
        <label htmlFor="problem-select">Problem station</label>
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
      <p className="section-kicker">Reaction brief</p>
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
      <p className="context-note">{problem.contextNote}</p>

      <section className="objective-block" aria-labelledby="objective-heading">
        <h2 id="objective-heading">Reasoning target</h2>
        <p>{problem.objective}</p>
      </section>

      <section className="progress-block" aria-labelledby="progress-heading">
        <h2 id="progress-heading">Workspace record</h2>
        <dl className="compact-stats">
          <div>
            <dt>State</dt>
            <dd>{complete ? "Products" : "Reactants"}</dd>
          </div>
          <div>
            <dt>Checks</dt>
            <dd>{state.attemptCount}</dd>
          </div>
          <div>
            <dt>Hints</dt>
            <dd>{state.hintCount}</dd>
          </div>
          <div>
            <dt>Revision</dt>
            <dd>{state.mechanismRevision}</dd>
          </div>
          <div>
            <dt>Difficulty / steps</dt>
            <dd>{problem.difficulty} / {problem.stepCount}</dd>
          </div>
        </dl>
      </section>

      <div className="storage-note">
        <span className="storage-note__mark" aria-hidden="true" />
        <p>
          Saved in this browser. Validation approval is never restored after a refresh.
        </p>
      </div>

      <button className="text-button text-button--danger" type="button" onClick={onReset}>
        Reset exercise
      </button>
    </aside>
  );
}
