import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { describeArrow } from "../domain/chemistry";
import {
  availableStepComparisons,
  compareReachedStep,
  type AtomComparisonChange,
  type BondComparisonChange,
} from "../domain/mechanism-comparison";
import {
  REPLAY_REACHED_STEP_EVENT,
  type ReachedStepReplayRequest,
} from "../domain/reaction-replay";
import type { MechanismState, ProblemDefinition } from "../domain/types";
import { comparisonMoleculeLayout } from "./comparison-molecule-layout";
import { MoleculeSnapshot } from "./MoleculeSnapshot";
import { ReplayIcon } from "./ReplayIcon";

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
  const [queuedReplayCommitId, setQueuedReplayCommitId] = useState<string | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const previousComparisonCount = useRef(0);
  const replayTimerRef = useRef<number | null>(null);
  const replayFrameRef = useRef<number | null>(null);

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

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const selected =
    comparisons.find((candidate) => candidate.commitId === selectedCommitId) ??
    comparisons.at(-1);
  const result = selected
    ? compareReachedStep(problem, state, selected.beforeStateId, selected.afterStateId)
    : null;
  const comparisonLayout = result
    ? comparisonMoleculeLayout([
        problem.states[result.beforeStateId],
        problem.states[result.afterStateId],
      ])
    : null;
  const comparisonStates = comparisonLayout?.states ?? null;

  const stopReplay = useCallback(() => {
    if (replayTimerRef.current !== null) window.clearTimeout(replayTimerRef.current);
    if (replayFrameRef.current !== null) window.cancelAnimationFrame(replayFrameRef.current);
    replayTimerRef.current = null;
    replayFrameRef.current = null;
    setReplaying(false);
  }, []);

  const startReplay = useCallback(() => {
    if (replayTimerRef.current !== null) window.clearTimeout(replayTimerRef.current);
    if (replayFrameRef.current !== null) window.cancelAnimationFrame(replayFrameRef.current);
    setReplaying(false);
    replayFrameRef.current = window.requestAnimationFrame(() => {
      setReplayKey((current) => current + 1);
      setReplaying(true);
      replayFrameRef.current = null;
      replayTimerRef.current = window.setTimeout(() => {
        setReplaying(false);
        replayTimerRef.current = null;
      }, reducedMotion ? 1400 : 2400);
    });
  }, [reducedMotion]);

  const openComparison = useCallback(() => {
    if (!dialogRef.current) return;
    dialogRef.current.showModal();
    window.requestAnimationFrame(() => {
      if (dialogRef.current) dialogRef.current.scrollTop = 0;
      closeRef.current?.focus();
    });
  }, []);

  const closeComparison = () => {
    stopReplay();
    dialogRef.current?.close();
  };

  useEffect(() => {
    const handleReplayRequest = (event: Event) => {
      const request = (event as CustomEvent<ReachedStepReplayRequest>).detail;
      if (!request) return;
      const comparison = comparisons.find(
        (candidate) =>
          candidate.commitId === request.commitId &&
          candidate.beforeStateId === request.beforeStateId &&
          candidate.afterStateId === request.afterStateId,
      );
      if (!comparison) return;
      setSelectedCommitId(comparison.commitId);
      setQueuedReplayCommitId(comparison.commitId);
    };
    document.addEventListener(REPLAY_REACHED_STEP_EVENT, handleReplayRequest);
    return () => document.removeEventListener(REPLAY_REACHED_STEP_EVENT, handleReplayRequest);
  }, [comparisons]);

  useEffect(() => {
    if (!queuedReplayCommitId || result?.commitId !== queuedReplayCommitId) return;
    if (!dialogRef.current?.open) openComparison();
    startReplay();
    setQueuedReplayCommitId(null);
  }, [openComparison, queuedReplayCommitId, result?.commitId, startReplay]);

  useEffect(() => () => stopReplay(), [stopReplay]);

  return (
    <section className="reaction-diff" aria-labelledby="reaction-diff-title">
      <div className="reaction-diff__intro">
        <div>
          <p className="section-kicker">Reaction Diff</p>
          <h2 id="reaction-diff-title">Compare and replay a reached step</h2>
          <p>
            Revisit the performed electron flow, then read the exact bond, charge, lone-pair, and
            hydrogen changes without altering your mechanism.
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
              Open step evidence
            </button>
          </div>
        ) : (
          <p className="reaction-diff__empty">
            Commit a checked step to unlock its comparison and electron-flow replay.
          </p>
        )}
      </div>

      <dialog
        className="reaction-diff-dialog"
        ref={dialogRef}
        aria-labelledby="reaction-diff-dialog-title"
        aria-describedby="reaction-diff-dialog-description"
        onClose={() => {
          stopReplay();
          triggerRef.current?.focus();
        }}
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
              <h2 id="reaction-diff-dialog-title">Reached step evidence</h2>
              <p id="reaction-diff-dialog-description">
                Compare the reached structures, replay the performed arrows, and inspect the exact
                graph changes used by validation.
              </p>
            </div>
            <button
              type="button"
              className="reaction-diff-dialog__close"
              ref={closeRef}
              onClick={closeComparison}
              aria-label="Close comparison"
            >
              Close
            </button>
          </header>

          {result ? (
            <>
              <div className="reaction-diff-toolbar">
                <div className="reaction-diff-picker">
                  <label htmlFor="reaction-diff-step">Reached step</label>
                  <select
                    id="reaction-diff-step"
                    value={result.commitId}
                    onChange={(event) => {
                      stopReplay();
                      setSelectedCommitId(event.target.value);
                    }}
                  >
                    {comparisons.map((candidate) => (
                      <option value={candidate.commitId} key={candidate.commitId}>
                        Step {candidate.stepIndex}: {candidate.stepTitle}
                      </option>
                    ))}
                  </select>
                  <span>
                    Committed by {result.actor === "human" ? "learner" : "agent"}. Viewing and
                    replay leave chemistry revision {state.mechanismRevision} unchanged.
                  </span>
                </div>
                <button
                  type="button"
                  className="button reaction-diff-replay-button"
                  onClick={startReplay}
                >
                  <ReplayIcon />
                  {replaying ? "Replay again" : "Replay electron flow"}
                </button>
              </div>

              <div className={`reaction-diff-structures ${replaying ? "is-replaying" : ""}`}>
                <article className="reaction-diff-state reaction-diff-state--before">
                  <div className="reaction-diff-state__heading">
                    <span><i aria-hidden="true" />Before</span>
                    <h3>{result.beforeStateLabel}</h3>
                  </div>
                  <MoleculeSnapshot
                    molecule={comparisonStates![0]}
                    labelStates={comparisonStates!}
                    comparison={result.comparison}
                    side="before"
                    viewBox={comparisonLayout!.viewBox}
                    replayArrows={replaying ? result.arrowBundle : []}
                    replayKey={replayKey}
                  />
                </article>
                <article className="reaction-diff-state reaction-diff-state--after">
                  <div className="reaction-diff-state__heading">
                    <span><i aria-hidden="true" />After</span>
                    <h3>{result.afterStateLabel}</h3>
                  </div>
                  <MoleculeSnapshot
                    molecule={comparisonStates![1]}
                    labelStates={comparisonStates!}
                    comparison={result.comparison}
                    side="after"
                    viewBox={comparisonLayout!.viewBox}
                  />
                </article>
                <div className="reaction-diff-replay-status" role="status" aria-live="polite">
                  <span className="reaction-diff-replay-status__line" aria-hidden="true" />
                  <p>
                    <strong>
                      {replaying
                        ? reducedMotion
                          ? "Performed arrows shown"
                          : "Replaying performed arrows"
                        : `Step ${result.stepIndex}: ${result.stepTitle}`}
                    </strong>
                    <span>
                      {replaying
                        ? reducedMotion
                          ? " Motion is reduced, so the complete arrow bundle appears as a static overlay."
                          : " The trace shows electron bookkeeping, not a physical transition state."
                        : " Replay is available only because both states have already been reached."}
                    </span>
                  </p>
                </div>
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
                    Only active committed transitions are comparable or replayable. Undo relocks
                    that after-state; unreached future structures are never exposed here.
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
