import { useEffect, useMemo, useRef, useState } from "react";
import { describeArrow } from "../domain/chemistry";
import {
  availableStepComparisons,
  compareReachedStep,
  type AtomComparisonChange,
  type BondComparisonChange,
} from "../domain/mechanism-comparison";
import type { MechanismState, ProblemDefinition } from "../domain/types";
import { MoleculeSnapshot } from "./MoleculeSnapshot";

interface ReactionDiffProps {
  problem: ProblemDefinition;
  state: MechanismState;
}

function countLabel(count: number): string {
  return `${count} committed step${count === 1 ? "" : "s"} available`;
}

function bondOrderLabel(order: number): string {
  if (order === 0) return "no bond";
  if (order === 1) return "single bond";
  if (order === 2) return "double bond";
  return "triple bond";
}

function bondChangeCopy(change: BondComparisonChange): { title: string; detail: string } {
  const pair = change.atomLabels.join("–");
  if (change.change === "formed") {
    return { title: `${pair} forms`, detail: `No bond → ${bondOrderLabel(change.afterOrder)}.` };
  }
  if (change.change === "broken") {
    return { title: `${pair} breaks`, detail: `${bondOrderLabel(change.beforeOrder)} → no bond.` };
  }
  return {
    title: `${pair} changes order`,
    detail: `${bondOrderLabel(change.beforeOrder)} → ${bondOrderLabel(change.afterOrder)}.`,
  };
}

function signedValue(value: number): string {
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}

function atomChangeCopy(change: AtomComparisonChange): { title: string; detail: string } {
  const atom = `${change.element} (${change.atomLabel})`;
  if (change.property === "formalCharge") {
    return {
      title: `${atom} formal charge changes`,
      detail: `${signedValue(change.before)} → ${signedValue(change.after)}.`,
    };
  }
  if (change.property === "lonePairCount") {
    return {
      title: `${atom} lone-pair count changes`,
      detail: `${change.before} → ${change.after}.`,
    };
  }
  return {
    title: `${atom} implicit-hydrogen count changes`,
    detail: `${change.before} → ${change.after}.`,
  };
}

export function ReactionDiff({ problem, state }: ReactionDiffProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const comparisons = useMemo(
    () => availableStepComparisons(problem, state),
    [problem, state],
  );
  const [selectedCommitId, setSelectedCommitId] = useState<string>("");
  const previousComparisonCount = useRef(0);

  useEffect(() => {
    const selectedStillExists = comparisons.some(
      (candidate) => candidate.commitId === selectedCommitId,
    );
    if (comparisons.length > previousComparisonCount.current || !selectedStillExists) {
      setSelectedCommitId(comparisons.at(-1)?.commitId ?? "");
    }
    previousComparisonCount.current = comparisons.length;
  }, [comparisons, selectedCommitId]);

  useEffect(() => {
    if (comparisons.length === 0 && dialogRef.current?.open) dialogRef.current.close();
  }, [comparisons.length]);

  useEffect(() => {
    if (dialogRef.current?.open) dialogRef.current.close();
  }, [problem.id]);

  const selected =
    comparisons.find((candidate) => candidate.commitId === selectedCommitId) ??
    comparisons.at(-1);
  const result = selected
    ? compareReachedStep(problem, state, selected.beforeStateId, selected.afterStateId)
    : null;

  const openComparison = () => {
    if (!dialogRef.current) return;
    dialogRef.current.showModal();
    window.requestAnimationFrame(() => {
      if (dialogRef.current) dialogRef.current.scrollTop = 0;
      closeRef.current?.focus();
    });
  };

  const closeComparison = () => {
    dialogRef.current?.close();
  };

  return (
    <section className="reaction-diff" aria-labelledby="reaction-diff-title">
      <div className="reaction-diff__intro">
        <div>
          <p className="section-kicker">Reaction Diff</p>
          <h2 id="reaction-diff-title">See what one committed step changed</h2>
          <p>
            Compare reached structures and read the exact bond, charge, lone-pair, and hydrogen
            changes without altering your mechanism.
          </p>
        </div>
        {comparisons.length > 0 ? (
          <div className="reaction-diff__action">
            <span>{countLabel(comparisons.length)}</span>
            <button
              type="button"
              className="button button--secondary"
              ref={triggerRef}
              onClick={openComparison}
            >
              Compare committed steps
            </button>
          </div>
        ) : (
          <p className="reaction-diff__empty">
            Commit a checked step to unlock its before-and-after evidence.
          </p>
        )}
      </div>

      <dialog
        className="reaction-diff-dialog"
        ref={dialogRef}
        aria-labelledby="reaction-diff-dialog-title"
        aria-describedby="reaction-diff-dialog-description"
        onClose={() => triggerRef.current?.focus()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeComparison();
          }
        }}
      >
        <div className="reaction-diff-dialog__shell">
          <header className="reaction-diff-dialog__header">
            <div>
              <p className="section-kicker">Read-only reached evidence</p>
              <h2 id="reaction-diff-dialog-title">Before this step / after this step</h2>
              <p id="reaction-diff-dialog-description">
                Highlighted structures and the ledger below come from the same authored graph
                states used by validation.
              </p>
            </div>
            <button
              type="button"
              className="reaction-diff-dialog__close"
              ref={closeRef}
              onClick={closeComparison}
            >
              Close comparison
            </button>
          </header>

          {result ? (
            <>
              <div className="reaction-diff-picker">
                <label htmlFor="reaction-diff-step">Committed step</label>
                <select
                  id="reaction-diff-step"
                  value={result.commitId}
                  onChange={(event) => setSelectedCommitId(event.target.value)}
                >
                  {comparisons.map((candidate) => (
                    <option value={candidate.commitId} key={candidate.commitId}>
                      Step {candidate.stepIndex}: {candidate.stepTitle}
                    </option>
                  ))}
                </select>
                <span>
                  Committed by {result.actor === "human" ? "learner" : "agent"}; chemistry
                  revision unchanged by viewing.
                </span>
              </div>

              <div className="reaction-diff-structures">
                <article className="reaction-diff-state reaction-diff-state--before">
                  <div className="reaction-diff-state__heading">
                    <span>Before</span>
                    <h3>{result.beforeStateLabel}</h3>
                  </div>
                  <MoleculeSnapshot
                    molecule={problem.states[result.beforeStateId]}
                    comparison={result.comparison}
                    side="before"
                  />
                </article>
                <div className="reaction-diff-transition" aria-hidden="true">
                  <span />
                  <strong>Step {result.stepIndex}</strong>
                  <span />
                </div>
                <article className="reaction-diff-state reaction-diff-state--after">
                  <div className="reaction-diff-state__heading">
                    <span>After</span>
                    <h3>{result.afterStateLabel}</h3>
                  </div>
                  <MoleculeSnapshot
                    molecule={problem.states[result.afterStateId]}
                    comparison={result.comparison}
                    side="after"
                  />
                </article>
              </div>

              <div className="reaction-diff-evidence">
                <section aria-labelledby="reaction-diff-changes-title">
                  <div className="reaction-diff-evidence__heading">
                    <div>
                      <p className="section-kicker">Exact graph changes</p>
                      <h3 id="reaction-diff-changes-title">Electron bookkeeping</h3>
                    </div>
                    <span>{result.comparison.summary}</span>
                  </div>
                  <ol className="reaction-diff-change-list">
                    {result.comparison.bondChanges.map((change) => {
                      const copy = bondChangeCopy(change);
                      return (
                        <li className={`is-${change.change}`} key={`bond-${change.atomIds.join("-")}`}>
                          <span aria-hidden="true" />
                          <div>
                            <strong>{copy.title}</strong>
                            <p>{copy.detail}</p>
                          </div>
                        </li>
                      );
                    })}
                    {result.comparison.atomChanges.map((change) => {
                      const copy = atomChangeCopy(change);
                      return (
                        <li
                          className="is-atom-change"
                          key={`atom-${change.atomId}-${change.property}`}
                        >
                          <span aria-hidden="true" />
                          <div>
                            <strong>{copy.title}</strong>
                            <p>{copy.detail}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>

                <section className="reaction-diff-arrows" aria-labelledby="reaction-diff-arrows-title">
                  <p className="section-kicker">Performed bundle</p>
                  <h3 id="reaction-diff-arrows-title">Curved arrows used</h3>
                  <ol>
                    {result.arrowBundle.map((arrow) => (
                      <li key={arrow.id}>
                        {describeArrow(problem.states[result.beforeStateId], arrow)}
                      </li>
                    ))}
                  </ol>
                  <p className="reaction-diff-boundary">
                    Only active committed transitions are comparable. Undo relocks that after-state;
                    unreached future structures are never exposed here.
                  </p>
                </section>
              </div>
            </>
          ) : (
            <p className="reaction-diff-dialog__unavailable">
              That step is no longer active. Close this comparison and commit a checked step to
              create new reached evidence.
            </p>
          )}
        </div>
      </dialog>
    </section>
  );
}
