import { useEffect, useMemo, useRef, useState } from "react";
import { describeArrow } from "../domain/chemistry";
import {
  buildLearningRecord,
  learningRecordFilename,
  serializeLearningRecord,
  type LearningRecordSessionMode,
} from "../domain/learning-record";
import type { ActivityEvent, CommitRecord, MechanismState, ProblemDefinition } from "../domain/types";
import { MAX_REFLECTION_LENGTH, type MechanismStore } from "../store/mechanism-store";

interface LearningRecordProps {
  problem: ProblemDefinition;
  state: MechanismState;
  store: MechanismStore;
  sessionMode: LearningRecordSessionMode;
}

const reviewEventKinds = new Set<ActivityEvent["kind"]>([
  "step_checked",
  "scaffold_requested",
  "step_committed",
  "commit_undone",
  "reflection_saved",
  "reflection_removed",
]);

function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function commitStep(problem: ProblemDefinition, record: CommitRecord) {
  return problem.steps.find(
    (step) =>
      step.fromStateId === record.fromStateId && step.toStateId === record.toStateId,
  );
}

function downloadLearningRecord(
  problem: ProblemDefinition,
  state: MechanismState,
  sessionMode: LearningRecordSessionMode,
): string {
  const record = buildLearningRecord(problem, state, sessionMode);
  const filename = learningRecordFilename(problem.id, record.exportedAt);
  const objectUrl = URL.createObjectURL(
    new Blob([serializeLearningRecord(record)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return filename;
}

interface ReflectionEditorProps {
  problem: ProblemDefinition;
  record: CommitRecord;
  store: MechanismStore;
}

function ReflectionEditor({ problem, record, store }: ReflectionEditorProps) {
  const [draft, setDraft] = useState(record.reflection ?? "");
  const [status, setStatus] = useState("");
  const step = commitStep(problem, record);
  const savedReflection = record.reflection ?? "";
  const normalizedDraft = draft.trim();
  const canSave = normalizedDraft.length > 0 && normalizedDraft !== savedReflection;

  useEffect(() => {
    setStatus("");
  }, [record.undoneAt]);

  const save = () => {
    const result = store.saveCommitReflection(record.id, draft);
    if (!result.ok) {
      setStatus(result.error?.message ?? "The reflection could not be saved.");
      return;
    }
    setDraft(normalizedDraft);
    setStatus("Reflection saved in this exercise record.");
  };

  const remove = () => {
    const confirmed = window.confirm(
      `Remove the saved reflection for ${step?.title ?? "this committed step"}?`,
    );
    if (!confirmed) return;
    const result = store.saveCommitReflection(record.id, "");
    if (result.ok) {
      setDraft("");
      setStatus("Reflection removed from this exercise record.");
      return;
    }
    setStatus(result.error?.message ?? "The reflection could not be removed.");
  };

  return (
    <form
      className="reflection-form"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <label htmlFor={`reflection-${record.id}`}>
        What evidence convinced you this step belongs in the pathway?
      </label>
      <textarea
        id={`reflection-${record.id}`}
        name="commit-reflection"
        rows={4}
        maxLength={MAX_REFLECTION_LENGTH}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setStatus("");
        }}
      />
      <div className="reflection-form__meta">
        <span>{draft.length}/{MAX_REFLECTION_LENGTH}</span>
        <span>{record.undoneAt ? "Reversed commit" : "Committed step"}</span>
      </div>
      <div className="reflection-form__actions">
        <button className="button button--primary" type="submit" disabled={!canSave}>
          Save reflection
        </button>
        {record.reflection && (
          <button className="text-button text-button--danger" type="button" onClick={remove}>
            Remove saved reflection
          </button>
        )}
      </div>
      <p className="reflection-form__status" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  onCopy: () => void;
  exportStatus: string;
  problem: ProblemDefinition;
  state: MechanismState;
  sessionMode: LearningRecordSessionMode;
}

function ReviewDialog({
  open,
  onClose,
  onExport,
  onCopy,
  exportStatus,
  problem,
  state,
  sessionMode,
}: ReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activeCommits = state.history.filter((record) => record.undoneAt === null).length;
  const reviewEvents = state.activity.filter((event) => reviewEventKinds.has(event.kind));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      className="review-dialog"
      ref={dialogRef}
      aria-labelledby="review-dialog-title"
      onCancel={onClose}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        onClose();
      }}
    >
      <div className="review-dialog__header">
        <div>
          <p className="section-kicker">Local instructor view</p>
          <h2 id="review-dialog-title">Learning record</h2>
          <p>{problem.title}</p>
        </div>
        <button className="review-dialog__close" type="button" onClick={onClose}>
          Close review
        </button>
      </div>

      <div className="review-dialog__body">
        <section className="review-summary" aria-labelledby="review-summary-heading">
          <div className="review-section-heading">
            <div>
              <p className="section-kicker">Session evidence</p>
              <h3 id="review-summary-heading">At a glance</h3>
            </div>
            <span>{sessionMode === "demo" ? "Temporary demo" : "Saved locally"}</span>
          </div>
          <dl className="review-metrics">
            <div><dt>Checks</dt><dd>{state.attemptCount}</dd></div>
            <div><dt>Hints</dt><dd>{state.hintCount}</dd></div>
            <div><dt>Active commits</dt><dd>{activeCommits}</dd></div>
            <div><dt>Reversals</dt><dd>{state.history.length - activeCommits}</dd></div>
            <div>
              <dt>Reflections</dt>
              <dd>{state.history.filter((record) => Boolean(record.reflection)).length}</dd>
            </div>
          </dl>
          <p className="review-boundary">
            This view reports learner-visible actions from the active exercise. It does not
            re-grade chemistry or reveal unreached states.
          </p>
        </section>

        <section aria-labelledby="review-commits-heading">
          <div className="review-section-heading">
            <div>
              <p className="section-kicker">Reached pathway</p>
              <h3 id="review-commits-heading">Committed steps</h3>
            </div>
            <span>{state.history.length}</span>
          </div>
          {state.history.length === 0 ? (
            <p className="review-empty">No steps have been committed yet.</p>
          ) : (
            <ol className="review-commit-list">
              {state.history.map((record, index) => {
                const step = commitStep(problem, record);
                const molecule = problem.states[record.fromStateId];
                return (
                  <li key={record.id}>
                    <div className="review-commit-list__heading">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <strong>{step?.title ?? "Committed mechanism step"}</strong>
                        <span>{record.undoneAt ? "Reversed" : "Active"} · {record.actor}</span>
                      </div>
                      <time dateTime={record.committedAt}>{formatDateTime(record.committedAt)}</time>
                    </div>
                    <ul className="review-arrow-list">
                      {record.arrowBundle.map((arrow) => (
                        <li key={arrow.id}>{describeArrow(molecule, arrow)}</li>
                      ))}
                    </ul>
                    <div className="review-reflection">
                      <span>Learner reflection</span>
                      <p>{record.reflection ?? "No reflection recorded for this step."}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section aria-labelledby="review-evidence-heading">
          <div className="review-section-heading">
            <div>
              <p className="section-kicker">Checks, hints, and reversals</p>
              <h3 id="review-evidence-heading">Evidence timeline</h3>
            </div>
            <span>{reviewEvents.length}</span>
          </div>
          {reviewEvents.length === 0 ? (
            <p className="review-empty">No check or hint evidence has been recorded yet.</p>
          ) : (
            <ol className="review-evidence-list">
              {reviewEvents.map((event) => (
                <li key={event.id}>
                  <span className={`review-evidence-list__mark review-evidence-list__mark--${event.outcome ?? "neutral"}`} aria-hidden="true" />
                  <div>
                    <p>{event.summary}</p>
                    <span>{event.actor} · <time dateTime={event.timestamp}>{formatDateTime(event.timestamp)}</time></span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="review-export" aria-labelledby="review-export-heading">
          <div>
            <p className="section-kicker">Share deliberately</p>
            <h3 id="review-export-heading">Export this active exercise</h3>
            <p>
              The JSON is generated on this device. Its schema adds no identity fields,
              accepted-answer definitions, or unreached state graphs. Review freeform
              reflections before sharing.
            </p>
          </div>
          <div>
            <div className="review-export__actions">
              <button className="button button--secondary" type="button" onClick={onExport}>
                Download JSON
              </button>
              <button className="text-button" type="button" onClick={onCopy}>
                Copy JSON
              </button>
            </div>
            <p role="status" aria-live="polite">{exportStatus}</p>
          </div>
        </section>
      </div>
    </dialog>
  );
}

export function LearningRecord({ problem, state, store, sessionMode }: LearningRecordProps) {
  const [selectedCommitId, setSelectedCommitId] = useState(state.history.at(-1)?.id ?? "");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const latestCommitId = state.history.at(-1)?.id ?? "";

  useEffect(() => {
    if (latestCommitId) setSelectedCommitId(latestCommitId);
    if (!latestCommitId) setSelectedCommitId("");
  }, [latestCommitId]);

  useEffect(() => {
    setExportStatus("");
  }, [problem.id, state.activitySequence]);

  const selectedRecord = useMemo(
    () =>
      state.history.find((record) => record.id === selectedCommitId) ?? state.history.at(-1),
    [selectedCommitId, state.history],
  );

  const exportRecord = () => {
    try {
      const filename = downloadLearningRecord(problem, state, sessionMode);
      setExportStatus(`Prepared ${filename}. Check the browser's downloads.`);
    } catch {
      setExportStatus("The browser could not create the export. Your local exercise record is unchanged.");
    }
  };

  const copyRecord = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
      const record = buildLearningRecord(problem, state, sessionMode);
      await navigator.clipboard.writeText(serializeLearningRecord(record));
      setExportStatus("Copied the active exercise learning record as JSON.");
    } catch {
      setExportStatus("The browser could not copy the JSON. Your local exercise record is unchanged.");
    }
  };

  return (
    <section className="learning-record" aria-labelledby="learning-record-heading">
      <div className="learning-record__heading">
        <div>
          <p className="section-kicker">Reflect and review</p>
          <h2 id="learning-record-heading">Learning record</h2>
          <p>
            Keep a learner-authored explanation with each commit, then review or export the
            active exercise without uploading it.
          </p>
        </div>
        <div className="learning-record__actions">
          <button className="button button--secondary" type="button" onClick={() => setReviewOpen(true)}>
            Open instructor view
          </button>
          <button className="text-button" type="button" onClick={exportRecord}>
            Download JSON
          </button>
          <button className="text-button" type="button" onClick={copyRecord}>
            Copy JSON
          </button>
        </div>
      </div>

      {selectedRecord ? (
        <div className="learning-record__editor">
          <div className="reflection-step-picker">
            <label htmlFor="reflection-commit">Reflect on</label>
            <select
              id="reflection-commit"
              value={selectedRecord.id}
              onChange={(event) => setSelectedCommitId(event.target.value)}
            >
              {state.history.map((record, index) => {
                const step = commitStep(problem, record);
                return (
                  <option value={record.id} key={record.id}>
                    {index + 1}. {step?.title ?? "Committed mechanism step"}
                  </option>
                );
              })}
            </select>
            <p>
              Notes belong to the selected commit and remain in the local record if that step
              is later undone.
            </p>
          </div>
          <ReflectionEditor problem={problem} record={selectedRecord} store={store} key={selectedRecord.id} />
        </div>
      ) : (
        <div className="learning-record__empty">
          <span aria-hidden="true">R</span>
          <div>
            <strong>Reflection opens after the first commit.</strong>
            <p>Checks and hints already contribute to the instructor view and JSON export.</p>
          </div>
        </div>
      )}
      <p className="learning-record__export-status" role="status" aria-live="polite">
        {exportStatus}
      </p>

      <ReviewDialog
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onExport={exportRecord}
        onCopy={copyRecord}
        exportStatus={exportStatus}
        problem={problem}
        state={state}
        sessionMode={sessionMode}
      />
    </section>
  );
}
