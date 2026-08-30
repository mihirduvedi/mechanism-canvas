import { useState } from "react";
import type { MechanismState, PracticeEvidenceStatus } from "../domain/types";
import type { MechanismStore } from "../store/mechanism-store";

interface PracticeCompassProps {
  state: MechanismState;
  store: MechanismStore;
  sessionMode: "saved" | "demo";
}

const statusLabels: Record<PracticeEvidenceStatus, string> = {
  not_started: "Not started",
  building: "Building evidence",
  demonstrated: "Demonstrated",
};

function familyLabel(family: string): string {
  if (family === "SN2_proton_transfer") return "SN2 + proton transfer";
  if (family === "proton_transfer") return "Proton transfer";
  return "SN2";
}

export function PracticeCompass({ state, store, sessionMode }: PracticeCompassProps) {
  void state;
  const profile = store.getLearningProfile();
  const proposal = store.getPracticePlanProposal();
  const proposalStale = Boolean(
    proposal && proposal.baseProfileRevision !== profile.profileRevision,
  );
  const [actionMessage, setActionMessage] = useState("");
  const progressPercent =
    profile.totalSteps === 0 ? 0 : Math.round((profile.completedSteps / profile.totalSteps) * 100);

  const acceptPlan = () => {
    if (!proposal) return;
    const result = store.acceptPracticePlan(proposal.id);
    setActionMessage(
      result.ok
        ? "Plan started. The first exercise is open."
        : result.error?.message ?? "The plan could not be started.",
    );
  };

  const dismissPlan = () => {
    if (!proposal) return;
    const result = store.declinePracticePlan(proposal.id);
    setActionMessage(
      result.ok ? "Plan dismissed. Your progress is unchanged." : result.error?.message ?? "The plan could not be dismissed.",
    );
  };

  return (
    <section className="practice-compass" aria-labelledby="practice-compass-heading">
      <div className="practice-compass__header">
        <div>
          <p className="section-kicker">Cross-exercise evidence</p>
          <h2 id="practice-compass-heading">Practice Compass</h2>
          <p>
            Deterministic checks become a local learning map—never a hidden score or a claim
            of mastery.
          </p>
        </div>
        <span className="practice-compass__privacy">
          <span aria-hidden="true">⌂</span>
          {sessionMode === "demo" ? "Memory only" : "Stored on this device"}
        </span>
      </div>

      <div className="practice-compass__overview">
        <div className="practice-compass__progress">
          <span>Library progress</span>
          <strong>
            {profile.completedSteps}<small> / {profile.totalSteps} steps</small>
          </strong>
          <div
            className="practice-compass__progress-track"
            role="progressbar"
            aria-label="Library steps completed"
            aria-valuemin={0}
            aria-valuemax={profile.totalSteps}
            aria-valuenow={profile.completedSteps}
          >
            <span style={{ inlineSize: `${progressPercent}%` }} />
          </div>
          <p>{profile.completedProblems} of {profile.totalProblems} exercises complete</p>
        </div>

        <div className="practice-compass__skills" aria-label="Skill evidence">
          {profile.skills.map((skill) => (
            <article key={skill.id} className={`practice-skill practice-skill--${skill.status}`}>
              <div>
                <span className="practice-skill__mark" aria-hidden="true">
                  {skill.status === "demonstrated" ? "✓" : skill.status === "building" ? "↗" : "·"}
                </span>
                <strong>{skill.label}</strong>
              </div>
              <span>{statusLabels[skill.status]}</span>
              <p>{skill.description}</p>
              <small>
                {skill.completedSteps}/{skill.relevantSteps} relevant steps · {skill.checkCount} checks
                {skill.issueCount > 0 ? ` · ${skill.issueCount} signals to revisit` : ""}
              </small>
            </article>
          ))}
        </div>
      </div>

      <div className="practice-compass__lower">
        <section className="practice-recommendations" aria-labelledby="practice-next-heading">
          <div className="practice-compass__subheading">
            <div>
              <span>Deterministic ranking</span>
              <h3 id="practice-next-heading">Next practice</h3>
            </div>
            <code>{profile.profileRevision}</code>
          </div>
          {profile.recommendations.length > 0 ? (
            <ol>
              {profile.recommendations.map((item, index) => (
                <li key={item.problemId}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{familyLabel(item.reactionFamily)} · Level {item.difficulty}</small>
                    <p>{item.reason}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="practice-recommendations__complete">
              Every reviewed exercise is complete. Reopen any exercise to test the pathway again.
            </p>
          )}
        </section>

        <section
          className={proposalStale ? "practice-plan is-stale" : "practice-plan"}
          aria-labelledby="practice-plan-heading"
          aria-live="polite"
        >
          <div className="practice-compass__subheading">
            <div>
              <span>Human-controlled handoff</span>
              <h3 id="practice-plan-heading">Agent practice plan</h3>
            </div>
            <span className="practice-plan__status">
              {proposal ? (proposalStale ? "Outdated" : "Your decision") : "Waiting"}
            </span>
          </div>
          {proposal ? (
            <div className="practice-plan__content">
              <p>{proposal.rationale}</p>
              <ol>
                {proposal.problemIds.map((problemId) => {
                  const planned = profile.problems.find((item) => item.problemId === problemId);
                  return <li key={problemId}>{planned?.title ?? problemId}</li>;
                })}
              </ol>
              {proposalStale && (
                <p className="practice-plan__warning">
                  New learning evidence arrived after this plan was staged. Dismiss it and ask
                  for a current plan.
                </p>
              )}
              <div className="practice-plan__actions">
                <button
                  className="button button--primary"
                  type="button"
                  disabled={proposalStale}
                  onClick={acceptPlan}
                >
                  Start this plan
                </button>
                <button className="text-button" type="button" onClick={dismissPlan}>
                  {proposalStale ? "Dismiss outdated plan" : "Dismiss"}
                </button>
              </div>
              <small>
                ChatGPT can stage this order. Only you can start it; starting changes the open
                exercise, not chemistry or evidence.
              </small>
            </div>
          ) : (
            <div className="practice-plan__empty">
              <span aria-hidden="true">A→Y</span>
              <p>
                A site-tools agent can read this evidence and suggest up to three exercises.
                Nothing starts without your approval.
              </p>
            </div>
          )}
          <p className="sr-only" role="status">{actionMessage}</p>
        </section>
      </div>
    </section>
  );
}
