import type { MechanismStore } from "../store/mechanism-store";

export type DelegationPresetId = "inspect" | "diagnose" | "coauthor";
export type DelegationSessionStatus = "active" | "exhausted" | "drifted";

export interface DelegationPreset {
  id: DelegationPresetId;
  label: string;
  shortLabel: string;
  description: string;
  workToolNames: readonly string[];
}

export interface DelegationSession {
  id: string;
  presetId: DelegationPresetId;
  presetLabel: string;
  status: DelegationSessionStatus;
  problemId: string;
  problemTitle: string;
  stateId: string;
  stateLabel: string;
  expectedMechanismRevision: number;
  contractRevisionAtStart: number;
  grantedToolNames: readonly string[];
  maxActions: number;
  usedActions: number;
  startedAt: string;
  lastActionAt: string | null;
  driftReason: string | null;
}

export interface DelegationReceiptEvidence {
  sessionId: string;
  presetId: DelegationPresetId;
  presetLabel: string;
  statusAtStart: DelegationSessionStatus;
  problemId: string;
  stateId: string;
  actionNumber: number | null;
  actionBudget: number;
}

export interface DelegationExecutionToken {
  sessionId: string;
  metered: boolean;
  evidence: DelegationReceiptEvidence;
}

export type DelegationExecutionDecision =
  | { allowed: true; token: DelegationExecutionToken | null }
  | {
      allowed: false;
      code:
        | "DELEGATION_SESSION_EXHAUSTED"
        | "DELEGATION_SCOPE_CHANGED"
        | "DELEGATION_TOOL_BLOCKED";
      message: string;
      evidence: DelegationReceiptEvidence;
    };

export interface StartDelegationSessionInput {
  presetId: DelegationPresetId;
  maxActions: number;
  contractToolNames: readonly string[];
}

export interface DelegationSessionManager {
  getSnapshot: () => DelegationSession | null;
  subscribe: (listener: () => void) => () => void;
  start: (input: StartDelegationSessionInput) => DelegationSession;
  end: () => DelegationSession | null;
  beginToolExecution: (toolName: string) => DelegationExecutionDecision;
  finishToolExecution: (token: DelegationExecutionToken | null) => void;
  receiptEvidence: () => DelegationReceiptEvidence | null;
  destroy: () => void;
}

export const DELEGATION_ACTION_BUDGETS = [4, 6, 8] as const;

export const DELEGATION_CONTROL_TOOL_NAMES = [
  "get_collaboration_contract",
  "get_delegation_session",
  "get_agent_action_receipts",
] as const;

const INSPECTION_TOOLS = [
  "get_mechanism_state",
  "inspect_mechanism_entities",
  "get_activity_trail",
  "view_mechanism_history_state",
  "compare_reached_step",
  "replay_reached_step",
  "focus_mechanism_entities",
] as const;

export const DELEGATION_PRESETS: readonly DelegationPreset[] = [
  {
    id: "inspect",
    label: "Inspect this step",
    shortLabel: "Inspect",
    description:
      "Read the active structure, point to evidence, and present reached history without drafting or checking.",
    workToolNames: INSPECTION_TOOLS,
  },
  {
    id: "diagnose",
    label: "Diagnose my draft",
    shortLabel: "Diagnose",
    description:
      "Inspect and check the current draft, with hints capped by the Collaboration Contract.",
    workToolNames: [...INSPECTION_TOOLS, "check_draft_step", "request_scaffold"],
  },
  {
    id: "coauthor",
    label: "Coauthor this step",
    shortLabel: "Coauthor",
    description:
      "Inspect, diagnose, and propose or edit arrows when the Collaboration Contract already permits it.",
    workToolNames: [
      ...INSPECTION_TOOLS,
      "check_draft_step",
      "request_scaffold",
      "propose_draft_arrows",
      "add_draft_arrow",
      "remove_draft_arrow",
    ],
  },
] as const;

const CONTROL_TOOL_SET = new Set<string>(DELEGATION_CONTROL_TOOL_NAMES);

export function delegationPreset(presetId: DelegationPresetId): DelegationPreset {
  const preset = DELEGATION_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) throw new Error(`Unknown delegation preset: ${presetId}.`);
  return preset;
}

export function delegationPresetToolNames(presetId: DelegationPresetId): string[] {
  const preset = delegationPreset(presetId);
  return [...DELEGATION_CONTROL_TOOL_NAMES, ...preset.workToolNames];
}

export function effectiveDelegationToolNames(
  session: DelegationSession | null,
  contractToolNames: readonly string[],
): string[] {
  if (!session) return [...contractToolNames];
  const contractNames = new Set(contractToolNames);
  if (session.status !== "active") {
    return DELEGATION_CONTROL_TOOL_NAMES.filter((name) => contractNames.has(name));
  }
  const grantedNames = new Set(session.grantedToolNames);
  return contractToolNames.filter((name) => grantedNames.has(name));
}

export function delegationSurfaceSignature(session: DelegationSession | null): string {
  if (!session) return "no_delegation";
  return [
    session.id,
    session.status,
    session.grantedToolNames.join(","),
  ].join(":");
}

function makeReceiptEvidence(
  session: DelegationSession,
  actionNumber: number | null,
): DelegationReceiptEvidence {
  return {
    sessionId: session.id,
    presetId: session.presetId,
    presetLabel: session.presetLabel,
    statusAtStart: session.status,
    problemId: session.problemId,
    stateId: session.stateId,
    actionNumber,
    actionBudget: session.maxActions,
  };
}

function scopeMatches(store: MechanismStore, session: DelegationSession): boolean {
  const state = store.getState();
  return (
    state.problemId === session.problemId &&
    state.currentStateId === session.stateId &&
    state.mechanismRevision === session.expectedMechanismRevision
  );
}

function driftMessage(store: MechanismStore, session: DelegationSession): string {
  const state = store.getState();
  if (state.problemId !== session.problemId) {
    return "The learner opened a different exercise after granting this session.";
  }
  if (state.currentStateId !== session.stateId) {
    return "The committed mechanism moved to a different state after this session was granted.";
  }
  return "The draft or mechanism revision changed outside this session's authorized tool call.";
}

export function createDelegationSessionManager(
  store: MechanismStore,
): DelegationSessionManager {
  let session: DelegationSession | null = null;
  let nextSessionSequence = 1;
  let inFlightExecutions = 0;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const markDriftedIfNeeded = () => {
    if (!session || session.status !== "active" || inFlightExecutions > 0) return;
    if (scopeMatches(store, session)) return;
    session = {
      ...session,
      status: "drifted",
      driftReason: driftMessage(store, session),
    };
    notify();
  };

  const unsubscribeStore = store.subscribe(markDriftedIfNeeded);

  return {
    getSnapshot: () => session,

    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    start: ({ presetId, maxActions, contractToolNames }) => {
      if (session) {
        throw new Error("End the current delegation session before starting another.");
      }
      if (!DELEGATION_ACTION_BUDGETS.includes(maxActions as 4 | 6 | 8)) {
        throw new Error("Delegation action budget must be 4, 6, or 8.");
      }
      const preset = delegationPreset(presetId);
      const permittedByPreset = new Set(delegationPresetToolNames(presetId));
      const grantedToolNames = contractToolNames.filter((name) => permittedByPreset.has(name));
      const state = store.getState();
      const problem = store.getProblem();
      const molecule = problem.states[state.currentStateId];
      session = {
        id: `delegation_session_${nextSessionSequence}`,
        presetId,
        presetLabel: preset.shortLabel,
        status: "active",
        problemId: state.problemId,
        problemTitle: problem.title,
        stateId: state.currentStateId,
        stateLabel: molecule.label,
        expectedMechanismRevision: state.mechanismRevision,
        contractRevisionAtStart: store.getCollaborationContract().revision,
        grantedToolNames,
        maxActions,
        usedActions: 0,
        startedAt: new Date().toISOString(),
        lastActionAt: null,
        driftReason: null,
      };
      nextSessionSequence += 1;
      notify();
      return session;
    },

    end: () => {
      const ended = session;
      session = null;
      inFlightExecutions = 0;
      notify();
      return ended;
    },

    beginToolExecution: (toolName) => {
      if (!session) return { allowed: true, token: null };
      markDriftedIfNeeded();
      if (!session) return { allowed: true, token: null };

      const isControlTool = CONTROL_TOOL_SET.has(toolName);
      if (isControlTool) {
        return {
          allowed: true,
          token: {
            sessionId: session.id,
            metered: false,
            evidence: makeReceiptEvidence(session, null),
          },
        };
      }

      if (session.status === "exhausted") {
        return {
          allowed: false,
          code: "DELEGATION_SESSION_EXHAUSTED",
          message:
            "This learner-granted delegation session has spent its action budget. Only its evidence controls remain available until the learner ends it.",
          evidence: makeReceiptEvidence(session, null),
        };
      }
      if (session.status === "drifted") {
        return {
          allowed: false,
          code: "DELEGATION_SCOPE_CHANGED",
          message:
            "The problem, state, or revision changed outside this delegation session. The learner must end it and grant a new scope.",
          evidence: makeReceiptEvidence(session, null),
        };
      }
      if (!session.grantedToolNames.includes(toolName)) {
        return {
          allowed: false,
          code: "DELEGATION_TOOL_BLOCKED",
          message:
            "This Site Tool is outside the learner-granted purpose and frozen tool surface for the active delegation session.",
          evidence: makeReceiptEvidence(session, null),
        };
      }
      if (session.usedActions >= session.maxActions) {
        session = { ...session, status: "exhausted" };
        notify();
        return {
          allowed: false,
          code: "DELEGATION_SESSION_EXHAUSTED",
          message:
            "This learner-granted delegation session has spent its action budget. Only its evidence controls remain available until the learner ends it.",
          evidence: makeReceiptEvidence(session, null),
        };
      }

      const actionNumber = session.usedActions + 1;
      session = {
        ...session,
        usedActions: actionNumber,
        lastActionAt: new Date().toISOString(),
      };
      inFlightExecutions += 1;
      return {
        allowed: true,
        token: {
          sessionId: session.id,
          metered: true,
          evidence: makeReceiptEvidence(session, actionNumber),
        },
      };
    },

    finishToolExecution: (token) => {
      if (!token || !token.metered) return;
      inFlightExecutions = Math.max(0, inFlightExecutions - 1);
      if (!session || session.id !== token.sessionId) return;
      const state = store.getState();
      session = {
        ...session,
        problemId: state.problemId,
        problemTitle: store.getProblem().title,
        stateId: state.currentStateId,
        stateLabel: store.getProblem().states[state.currentStateId].label,
        expectedMechanismRevision: state.mechanismRevision,
        status:
          session.usedActions >= session.maxActions ? "exhausted" : session.status,
      };
      notify();
    },

    receiptEvidence: () => (session ? makeReceiptEvidence(session, null) : null),

    destroy: () => {
      unsubscribeStore();
      listeners.clear();
      session = null;
      inFlightExecutions = 0;
    },
  };
}
