import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { MechanismStore } from "../store/mechanism-store";
import { useMechanismState } from "../store/use-mechanism";
import type { DelegationSessionManager } from "../webmcp/delegation-session";
import {
  DELEGATION_ACTION_BUDGETS,
  DELEGATION_CONTROL_TOOL_NAMES,
  DELEGATION_PRESETS,
  delegationPresetToolNames,
  type DelegationPresetId,
} from "../webmcp/delegation-session";
import {
  enabledToolNames,
  MECHANISM_TOOL_COUNT,
} from "../webmcp/register-tools";
import type { HypothesisLab } from "../webmcp/hypothesis-lab";

interface DelegationSessionProps {
  store: MechanismStore;
  manager: DelegationSessionManager;
  hypothesisLab: HypothesisLab | null;
}

const statusLabels = {
  active: "Bounded session active",
  exhausted: "Action budget spent",
  drifted: "Scope changed",
} as const;

export function DelegationSession({ store, manager, hypothesisLab }: DelegationSessionProps) {
  const state = useMechanismState(store);
  const session = useSyncExternalStore(
    manager.subscribe,
    manager.getSnapshot,
    manager.getSnapshot,
  );
  const [presetId, setPresetId] = useState<DelegationPresetId>("coauthor");
  const [maxActions, setMaxActions] = useState<(typeof DELEGATION_ACTION_BUDGETS)[number]>(6);
  const [status, setStatus] = useState("");
  const contract = store.getCollaborationContract();
  const contractTools = enabledToolNames(contract, null, hypothesisLab);
  const activeTools = enabledToolNames(contract, session, hypothesisLab);
  useEffect(() => {
    if (!session && presetId === "explore" && hypothesisLab?.status !== "active") {
      setPresetId("coauthor");
    }
  }, [hypothesisLab?.status, presetId, session]);
  const previewTools = useMemo(() => {
    const presetNames = new Set(delegationPresetToolNames(presetId));
    return contractTools.filter((name) => presetNames.has(name));
  }, [contractTools.join("|"), presetId]);
  const previewWorkCount = previewTools.filter(
    (name) => !DELEGATION_CONTROL_TOOL_NAMES.includes(
      name as (typeof DELEGATION_CONTROL_TOOL_NAMES)[number],
    ),
  ).length;
  const previewControlCount = previewTools.length - previewWorkCount;

  const startSession = () => {
    try {
      const started = manager.start({ presetId, maxActions, contractToolNames: contractTools });
      setStatus(
        `${started.presetLabel} session started with ${started.grantedToolNames.length} tools and ${started.maxActions} metered actions.`,
      );
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  const endSession = () => {
    const ended = manager.end();
    if (!ended) return;
    setStatus(
      `${ended.presetLabel} session ended. The ${contractTools.length}-tool Collaboration Contract surface is restored.`,
    );
  };

  const evidenceControlCount = activeTools.filter((name) =>
    DELEGATION_CONTROL_TOOL_NAMES.includes(
      name as (typeof DELEGATION_CONTROL_TOOL_NAMES)[number],
    )
  ).length;
  const sessionMessage = session?.status === "exhausted"
    ? `The work budget is closed. ${evidenceControlCount} evidence controls remain discoverable until you restore the full contract surface.`
    : session?.status === "drifted"
      ? session.driftReason ?? "The scoped state changed outside this delegation session."
      : "Every non-control Site Tool call spends one action. Calls may advance the scoped revision, but they cannot switch exercises, commit, reset, or widen this grant.";

  return (
    <section className="delegation-session" aria-labelledby="delegation-session-heading">
      <div className="delegation-session__masthead">
        <div>
          <p className="section-kicker">One bounded job</p>
          <h2 id="delegation-session-heading">Give the agent a clear finish line.</h2>
          <p>
            Fix the purpose, reaction, and action budget before it starts. The grant can expire,
            but it cannot expand itself.
          </p>
        </div>
        <div
          className={`delegation-session__seal${session ? ` delegation-session__seal--${session.status}` : ""}`}
          aria-label="Delegation session status"
        >
          <span>{session ? statusLabels[session.status] : "No active session"}</span>
          <strong>{activeTools.length}<small> / {MECHANISM_TOOL_COUNT} tools</small></strong>
          <small>{session ? `${session.usedActions} / ${session.maxActions} actions` : "Full contract surface"}</small>
        </div>
      </div>

      {!session ? (
        <div className="delegation-session__setup">
          <fieldset className="delegation-presets">
            <legend>Purpose</legend>
            {DELEGATION_PRESETS.map((preset, index) => {
              const permittedCount = contractTools.filter((name) =>
                delegationPresetToolNames(preset.id).includes(name),
              ).length;
              const unavailable = preset.id === "explore" && hypothesisLab?.status !== "active";
              return (
                <label
                  className={`${presetId === preset.id ? "delegation-preset is-selected" : "delegation-preset"}${unavailable ? " is-disabled" : ""}`}
                  key={preset.id}
                >
                  <input
                    type="radio"
                    name="delegation-purpose"
                    value={preset.id}
                    checked={presetId === preset.id}
                    disabled={unavailable}
                    onChange={() => setPresetId(preset.id)}
                  />
                  <span className="delegation-preset__number">0{index + 1}</span>
                  <span>
                    <strong>{preset.label}</strong>
                    <small>{preset.description}</small>
                    <em>{unavailable ? "Open a Counterfactual Lab first" : `${permittedCount} tools under the current contract`}</em>
                  </span>
                </label>
              );
            })}
          </fieldset>

          <div className="delegation-session__grant">
            <label>
              <span>Action budget</span>
              <select
                value={maxActions}
                onChange={(event) =>
                  setMaxActions(Number(event.target.value) as (typeof DELEGATION_ACTION_BUDGETS)[number])}
              >
                {DELEGATION_ACTION_BUDGETS.map((budget) => (
                  <option value={budget} key={budget}>{budget} metered actions</option>
                ))}
              </select>
              <small>Contract, session, and receipt reads stay available without spending the budget.</small>
            </label>
            <div className="delegation-session__preview" aria-live="polite">
              <span>Grant preview</span>
              <strong>{previewWorkCount} work tools + {previewControlCount} evidence controls</strong>
              <small>Bound to {store.getProblem().title} · {store.getProblem().states[state.currentStateId].label} · revision {state.mechanismRevision}</small>
            </div>
            <button className="button" type="button" onClick={startSession}>
              Start bounded session
            </button>
          </div>
        </div>
      ) : (
        <div className="delegation-session__active">
          <div className="delegation-session__scope">
            <span>Frozen purpose</span>
            <strong>{session.presetLabel}</strong>
            <small>{session.problemTitle}</small>
          </div>
          <div className="delegation-session__scope">
            <span>Exact scope</span>
            <strong>{session.stateLabel}</strong>
            <small>revision {session.expectedMechanismRevision} · {session.problemId}</small>
          </div>
          <div className="delegation-session__budget">
            <span>Agent action budget</span>
            <div>
              <strong>{session.usedActions}</strong>
              <small> of {session.maxActions} spent</small>
            </div>
            <progress value={session.usedActions} max={session.maxActions}>
              {session.usedActions} of {session.maxActions}
            </progress>
          </div>
          <div className="delegation-session__surface">
            <span>Discoverable now</span>
            <strong>{activeTools.length} Site Tools</strong>
            <details>
              <summary>Inspect exact surface</summary>
              <ul>
                {activeTools.map((toolName) => <li key={toolName}><code>{toolName}</code></li>)}
              </ul>
            </details>
          </div>
          <div className={`delegation-session__message delegation-session__message--${session.status}`}>
            <strong>{statusLabels[session.status]}</strong>
            <p>{sessionMessage}</p>
          </div>
          <button className="button button--secondary" type="button" onClick={endSession}>
            End session · restore contract surface
          </button>
        </div>
      )}

      <div className="delegation-session__chain" aria-label="Delegation evidence chain">
        <span><strong>Intent</strong> fixed purpose</span>
        <span><strong>Capability</strong> frozen Site Tools</span>
        <span><strong>Execution</strong> metered receipts</span>
      </div>
      <p className="delegation-session__status" role="status" aria-live="polite">{status}</p>
    </section>
  );
}
