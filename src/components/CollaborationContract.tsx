import { COLLABORATION_MODE_LABELS } from "../domain/collaboration-contract";
import type { CollaborationMode } from "../domain/types";
import type { MechanismStore } from "../store/mechanism-store";
import { enabledToolCount, MECHANISM_TOOL_COUNT } from "../webmcp/register-tools";
import type { DelegationSession } from "../webmcp/delegation-session";
import type { HypothesisLab } from "../webmcp/hypothesis-lab";

interface CollaborationContractProps {
  store: MechanismStore;
  sessionMode: "saved" | "demo";
  delegationSession: DelegationSession | null;
  hypothesisLab: HypothesisLab | null;
}

const modes: Array<{
  id: CollaborationMode;
  number: string;
  title: string;
  summary: string;
}> = [
  {
    id: "observe",
    number: "01",
    title: "Observe",
    summary: "Read, inspect, focus, compare, and replay. Your work stays untouched.",
  },
  {
    id: "coach",
    number: "02",
    title: "Coach",
    summary: "Check your draft and stage bounded suggestions. You approve every arrow.",
  },
  {
    id: "collaborate",
    number: "03",
    title: "Collaborate",
    summary: "Allow direct revision-bound editing and undo while the validator stays authoritative.",
  },
];

const scaffoldLabels = [
  "No agent hints",
  "1 · Electron-source nudge",
  "2 · Reaction-center focus",
  "3 · Concerted-step cue",
  "4 · Complete-bundle preview",
] as const;

export function CollaborationContract({
  store,
  sessionMode,
  delegationSession,
  hypothesisLab,
}: CollaborationContractProps) {
  const contract = store.getCollaborationContract();
  const activeToolCount = enabledToolCount(contract, delegationSession, hypothesisLab);

  const update = (
    patch: Partial<{
      mode: CollaborationMode;
      maxAgentScaffoldLevel: 0 | 1 | 2 | 3 | 4;
      learnerCommitsOnly: boolean;
    }>,
  ) => {
    store.setCollaborationContract({
      mode: patch.mode ?? contract.mode,
      maxAgentScaffoldLevel:
        patch.maxAgentScaffoldLevel ?? contract.maxAgentScaffoldLevel,
      learnerCommitsOnly: patch.learnerCommitsOnly ?? contract.learnerCommitsOnly,
    });
  };

  return (
    <section className="collaboration-contract" aria-labelledby="collaboration-contract-heading">
      <div className="collaboration-contract__intro">
        <div>
          <p className="section-kicker">Your boundary</p>
          <h2 id="collaboration-contract-heading">Choose what the agent may do.</h2>
          <p>
            The page enforces this choice. The agent can work inside it, but it cannot widen it.
          </p>
        </div>
        <div className="collaboration-contract__receipt" aria-label="Current contract receipt">
          <span>{COLLABORATION_MODE_LABELS[contract.mode]} mode</span>
          <strong>{activeToolCount}<small> / {MECHANISM_TOOL_COUNT} tools</small></strong>
          <code>contract:{contract.revision}</code>
          <small>{sessionMode === "demo" ? "Memory only" : "Saved on this device"}</small>
        </div>
      </div>

      <fieldset className="collaboration-modes">
        <legend>Agent role</legend>
        {modes.map((mode) => (
          <label
            className={
              contract.mode === mode.id
                ? "collaboration-mode is-selected"
                : "collaboration-mode"
            }
            key={mode.id}
          >
            <input
              type="radio"
              name="collaboration-mode"
              value={mode.id}
              checked={contract.mode === mode.id}
              onChange={() => update({ mode: mode.id })}
            />
            <span className="collaboration-mode__number">{mode.number}</span>
            <span>
              <strong>{mode.title}</strong>
              <small>{mode.summary}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="collaboration-contract__controls">
        <label>
          <span>Agent hint ceiling</span>
          <select
            value={contract.maxAgentScaffoldLevel}
            disabled={contract.mode === "observe"}
            onChange={(event) =>
              update({
                maxAgentScaffoldLevel: Number(event.target.value) as 0 | 1 | 2 | 3 | 4,
              })
            }
          >
            {scaffoldLabels.map((label, level) => (
              <option key={label} value={level}>{label}</option>
            ))}
          </select>
          <small>
            {contract.mode === "observe"
              ? "Observe mode exposes no agent hint tool."
              : "The agent cannot request a more revealing scaffold than this level."}
          </small>
        </label>

        <label className={contract.mode === "collaborate" ? "commit-boundary" : "commit-boundary is-disabled"}>
          <input
            type="checkbox"
            checked={contract.learnerCommitsOnly}
            disabled={contract.mode !== "collaborate"}
            onChange={(event) => update({ learnerCommitsOnly: event.target.checked })}
          />
          <span>
            <strong>Only I can commit checked steps</strong>
            <small>
              {contract.mode === "collaborate"
                ? "Keep the final chemistry transition behind a visible learner action."
                : "Coach and Observe modes always keep commits learner-only."}
            </small>
          </span>
        </label>

        <div className="collaboration-contract__authority">
          <span>Who decides what</span>
          <ol>
            <li><strong>Learner</strong> sets agent permissions</li>
            <li><strong>WebMCP</strong> exposes only allowed actions</li>
            <li><strong>Validator</strong> decides chemical correctness</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
