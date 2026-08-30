import type {
  CollaborationContract,
  CollaborationMode,
  CommandResult,
} from "./types";

export type AgentCapability =
  | "navigate"
  | "focus"
  | "propose"
  | "check"
  | "scaffold"
  | "draft_write"
  | "commit"
  | "undo"
  | "reset";

export const DEFAULT_COLLABORATION_CONTRACT: CollaborationContract = {
  mode: "coach",
  maxAgentScaffoldLevel: 2,
  learnerCommitsOnly: true,
  revision: 0,
};

export const COLLABORATION_MODE_LABELS: Record<CollaborationMode, string> = {
  observe: "Observe",
  coach: "Coach",
  collaborate: "Collaborate",
};

export function isCollaborationContract(value: unknown): value is CollaborationContract {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CollaborationContract>;
  return (
    (candidate.mode === "observe" ||
      candidate.mode === "coach" ||
      candidate.mode === "collaborate") &&
    typeof candidate.maxAgentScaffoldLevel === "number" &&
    Number.isSafeInteger(candidate.maxAgentScaffoldLevel) &&
    candidate.maxAgentScaffoldLevel >= 0 &&
    candidate.maxAgentScaffoldLevel <= 4 &&
    typeof candidate.learnerCommitsOnly === "boolean" &&
    typeof candidate.revision === "number" &&
    Number.isSafeInteger(candidate.revision) &&
    candidate.revision >= 0
  );
}

export function cloneDefaultCollaborationContract(): CollaborationContract {
  return { ...DEFAULT_COLLABORATION_CONTRACT };
}

export function authorizeAgentCapability<T = undefined>(
  contract: CollaborationContract,
  capability: AgentCapability,
  requestedScaffoldLevel?: number,
): CommandResult<T> {
  const mode = contract.mode;
  const allowed =
    capability === "focus" ||
    (capability === "navigate" && mode !== "observe") ||
    ((capability === "propose" || capability === "check") && mode !== "observe") ||
    (capability === "scaffold" &&
      mode !== "observe" &&
      requestedScaffoldLevel !== undefined &&
      requestedScaffoldLevel <= contract.maxAgentScaffoldLevel) ||
    ((capability === "draft_write" || capability === "undo" || capability === "reset") &&
      mode === "collaborate") ||
    (capability === "commit" &&
      mode === "collaborate" &&
      !contract.learnerCommitsOnly);

  if (allowed) return { ok: true };

  const modeLabel = COLLABORATION_MODE_LABELS[mode];
  const message =
    capability === "scaffold"
      ? contract.maxAgentScaffoldLevel === 0
        ? `${modeLabel} mode does not permit an agent to open hints. The learner can still open any hint directly.`
        : `The learner limited agent hints to level ${contract.maxAgentScaffoldLevel}. Level ${requestedScaffoldLevel ?? "unknown"} remains learner-controlled.`
      : capability === "commit" && contract.learnerCommitsOnly
        ? "The learner kept final commits learner-only. The agent may check a draft, but only the learner can commit it."
        : `${modeLabel} mode keeps this action learner-controlled. Read the collaboration contract and use an enabled handoff instead.`;

  return {
    ok: false,
    error: {
      code: "LEARNER_CONTROLLED",
      message,
    },
  };
}
