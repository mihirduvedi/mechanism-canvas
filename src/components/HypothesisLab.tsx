import { useMemo, useState } from "react";
import { describeArrow } from "../domain/chemistry";
import { compareMoleculeStates } from "../domain/mechanism-comparison";
import type { ArrowDraft } from "../domain/types";
import type { MechanismStore } from "../store/mechanism-store";
import type { DelegationSession } from "../webmcp/delegation-session";
import type {
  HypothesisLab as HypothesisLabState,
  HypothesisLabManager,
} from "../webmcp/hypothesis-lab";
import { comparisonMoleculeLayout } from "./comparison-molecule-layout";
import { MoleculeSnapshot } from "./MoleculeSnapshot";

interface HypothesisLabProps {
  store: MechanismStore;
  manager: HypothesisLabManager;
  lab: HypothesisLabState | null;
  delegationSession: DelegationSession | null;
}

const validationLabels = {
  valid: "Validator approved",
  incomplete: "Incomplete path",
  invalid_invariant: "Invariant rejected",
  not_accepted_path: "Outside reviewed path",
  invalid_input: "Invalid input",
} as const;

function branchDraftArrows(lab: HypothesisLabState, branchIndex: number): ArrowDraft[] {
  const branch = lab.branches[branchIndex];
  return [
    ...lab.baseDraftArrows,
    ...branch.arrows.map((arrow, index) => ({
      id: `${branch.id}_preview_${index + 1}`,
      source: arrow.source,
      target: arrow.target,
      actor: "agent" as const,
    })),
  ];
}

export function HypothesisLab({
  store,
  manager,
  lab,
  delegationSession,
}: HypothesisLabProps) {
  const [branchCount, setBranchCount] = useState<2 | 3>(2);
  const [status, setStatus] = useState("");
  const problem = store.getProblem();
  const state = store.getState();
  const scopedProblem = lab
    ? store.getProblems().find((candidate) => candidate.id === lab.problemId) ?? problem
    : problem;
  const molecule = lab
    ? scopedProblem.states[lab.stateId]
    : problem.states[state.currentStateId];
  const previewLayout = useMemo(
    () => comparisonMoleculeLayout([molecule, molecule]),
    [molecule],
  );
  const comparison = useMemo(
    () => compareMoleculeStates(previewLayout.states[0], previewLayout.states[1]),
    [previewLayout.states],
  );
  const activeSession = delegationSession?.status === "active";
  const proposalPending = Boolean(
    lab?.agentProposalId && state.agentProposal?.id === lab.agentProposalId,
  );

  const startLab = () => {
    try {
      const started = manager.start(branchCount);
      setStatus(
        `${started.branches.length}-path lab opened at mechanism revision ${started.baseMechanismRevision}. The main draft is sealed.`,
      );
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const endLab = () => {
    const ended = manager.end();
    if (!ended) return;
    setStatus(`Ended ${ended.id}. Its isolated branches were discarded; the main draft is unchanged.`);
  };

  return (
    <section className="hypothesis-lab" aria-labelledby="hypothesis-lab-heading">
      <div className="hypothesis-lab__masthead">
        <div>
          <p className="section-kicker">Isolated path test</p>
          <h2 id="hypothesis-lab-heading">Test paths without touching your draft.</h2>
          <p>
            Open two or three branches. The agent can build and check each one; you decide
            whether anything comes back.
          </p>
        </div>
        <div className={`hypothesis-lab__seal${lab ? ` hypothesis-lab__seal--${lab.status}` : ""}`}>
          <span>{lab ? `${lab.status} lab` : "Lab closed"}</span>
          <strong>{lab ? lab.branches.length : 0}<small> paths</small></strong>
          <small>{lab ? `lab:${lab.labRevision} · main:${lab.baseMechanismRevision}` : "No isolated state"}</small>
        </div>
      </div>

      {!lab ? (
        <div className="hypothesis-lab__setup">
          <div>
            <span>You control the boundary</span>
            <strong>How many paths should it try?</strong>
            <p>The paths stay in this tab. The agent cannot open, close, or adopt them.</p>
          </div>
          <fieldset>
            <legend>Choose a comparison</legend>
            {[2, 3].map((count) => (
              <label key={count}>
                <input
                  type="radio"
                  name="hypothesis-branch-count"
                  value={count}
                  checked={branchCount === count}
                  disabled={activeSession}
                  onChange={() => setBranchCount(count as 2 | 3)}
                />
                <span><strong>{count} paths</strong><small>{count === 2 ? "A clear side-by-side" : "One more alternative"}</small></span>
              </label>
            ))}
          </fieldset>
          <button className="button" type="button" disabled={activeSession} onClick={startLab}>
            Open isolated lab
          </button>
          {activeSession && (
            <p className="hypothesis-lab__setup-note">End the current delegation session before opening a new lab.</p>
          )}
        </div>
      ) : (
        <>
          <div className="hypothesis-lab__scope">
            <div><span>Exact scope</span><strong>{lab.stateLabel}</strong><small>{lab.problemTitle}</small></div>
            <div><span>Main seal</span><strong>Revision {lab.baseMechanismRevision}</strong><small>{lab.baseDraftArrows.length} learner draft arrows protected</small></div>
            <div><span>Lab state</span><strong>Revision {lab.labRevision}</strong><small>{lab.status === "active" ? "Agent work tools discoverable" : "Agent work tools withdrawn"}</small></div>
            <div><span>Handoff gate</span><strong>{proposalPending ? "Proposal staged" : lab.recommendedBranchId ? "Learner decision recorded" : "Learner review required"}</strong><small>{lab.agentProposalId ?? "No recommendation yet"}</small></div>
          </div>

          {lab.status === "drifted" && (
            <div className="hypothesis-lab__notice hypothesis-lab__notice--drifted">
              <strong>Scope seal broken</strong>
              <p>{lab.driftReason} The lab is now read-only; end it and reopen against current state.</p>
            </div>
          )}
          {lab.status === "recommended" && (
            <div className="hypothesis-lab__notice hypothesis-lab__notice--recommended">
              <strong>{proposalPending ? "Checked branch staged—not adopted" : "Learner reviewed the checked recommendation"}</strong>
              {proposalPending ? (
                <p>
                  The recommendation is waiting in <a href="#agent-proposal-heading">Agent Proposal</a>.
                  Only the learner can accept those arrows into the main draft.
                </p>
              ) : (
                <p>
                  The proposal is no longer pending. Any draft change came from the learner-facing
                  decision gate, not from a lab Site Tool. The branch evidence remains read-only.
                </p>
              )}
            </div>
          )}

          <div className={`hypothesis-lab__branches hypothesis-lab__branches--${lab.branches.length}`}>
            {lab.branches.map((branch, branchIndex) => {
              const previewArrows = branchDraftArrows(lab, branchIndex);
              return (
                <article className="hypothesis-branch" key={branch.id}>
                  <header>
                    <div><span>{branch.id.replace("hypothesis_", "Hypothesis ").toUpperCase()}</span><h3>{branch.label}</h3></div>
                    <span className={`hypothesis-branch__status${branch.validation ? ` hypothesis-branch__status--${branch.validation.classification}` : ""}`}>
                      {branch.validation ? validationLabels[branch.validation.classification] : branch.arrows.length ? "Awaiting check" : "Awaiting agent"}
                    </span>
                  </header>
                  <div className="hypothesis-branch__molecule">
                    <MoleculeSnapshot
                      molecule={previewLayout.states[0]}
                      labelStates={previewLayout.states}
                      comparison={comparison}
                      side="before"
                      viewBox={previewLayout.viewBox}
                      replayArrows={previewArrows}
                      replayKey={lab.labRevision}
                    />
                  </div>
                  {branch.arrows.length > 0 ? (
                    <ol className="hypothesis-branch__arrows">
                      {branch.arrows.map((arrow, index) => (
                        <li key={`${arrow.source.kind}-${arrow.source.entityId}-${arrow.target.entityId}`}>
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          {describeArrow(molecule, { ...arrow, id: `${branch.id}_${index}`, actor: "agent" })}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="hypothesis-branch__empty">An agent can populate this branch through the dynamically registered lab tools.</p>
                  )}
                  {branch.rationale && <p className="hypothesis-branch__rationale">{branch.rationale}</p>}
                  {branch.validation && (
                    <div className="hypothesis-branch__evidence">
                      <strong>{branch.validation.summary}</strong>
                      {branch.validation.issues.length > 0 && (
                        <ul>{branch.validation.issues.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {lab.comparison && (
            <div className="hypothesis-lab__comparison">
              <span>Agent comparison · deterministic evidence</span>
              <strong>{lab.comparison.summary}</strong>
              <small>{lab.comparison.sharedArrows.length} shared · {lab.comparison.leftOnlyArrows.length} left-only · {lab.comparison.rightOnlyArrows.length} right-only arrows</small>
            </div>
          )}

          <div className="hypothesis-lab__footer">
            <div>
              <strong>Main mechanism protected</strong>
              <span>Lab changes advance only the lab revision and receive separate proof-ledger stamps.</span>
            </div>
            <button className="button button--secondary" type="button" disabled={activeSession} onClick={endLab}>
              End lab · discard branches
            </button>
          </div>
          {activeSession && <p className="hypothesis-lab__setup-note">End the bounded session before closing its lab scope.</p>}
        </>
      )}

      <p className="hypothesis-lab__status" role="status" aria-live="polite">{status}</p>
    </section>
  );
}
