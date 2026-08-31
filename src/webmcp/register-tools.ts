import { describeEntity } from "../domain/chemistry";
import { COLLABORATION_MODE_LABELS } from "../domain/collaboration-contract";
import {
  availableStepComparisons,
  compareReachedStep,
} from "../domain/mechanism-comparison";
import {
  problemStepForState,
  reachableHistoryStateIds,
  visibleStateId,
} from "../domain/problem-steps";
import { REPLAY_REACHED_STEP_EVENT } from "../domain/reaction-replay";
import type {
  CollaborationContract,
  CommandResult,
  ElectronSource,
  ProposedArrow,
} from "../domain/types";
import { activeSessionMode, mechanismStore } from "../store/active-mechanism-store";
import {
  MAX_PRACTICE_PLAN_PROBLEMS,
  MAX_PRACTICE_PLAN_RATIONALE_LENGTH,
  MAX_PROPOSAL_ARROWS,
  MAX_PROPOSAL_RATIONALE_LENGTH,
  type MechanismStore,
} from "../store/mechanism-store";
import {
  MAX_TOOL_RECEIPTS,
  captureToolReceiptScope,
  captureToolState,
  changedToolState,
  receiptEntityIds,
  summarizeToolIntent,
  summarizeToolReceipts,
  summarizeToolResult,
  toolKind,
  toolReceiptLedger,
  type ToolReceiptLedger,
  type ToolReceiptOutcome,
} from "./tool-receipt-ledger";
import { delegationSessionManager } from "./active-delegation-session";
import {
  createDelegationSessionManager,
  delegationSurfaceSignature,
  effectiveDelegationToolNames,
  type DelegationSession,
  type DelegationSessionManager,
} from "./delegation-session";

interface ContextRegistration {
  controller: AbortController | null;
  count: number;
  signature: string;
  unsubscribes: Array<() => void>;
  queue: Promise<void>;
}

const registeredContexts = new WeakMap<object, ContextRegistration>();
const fallbackDelegationManagers = new WeakMap<object, DelegationSessionManager>();
export const MECHANISM_TOOL_COUNT = 21;

const OBSERVE_TOOL_NAMES = new Set([
  "get_mechanism_state",
  "get_collaboration_contract",
  "get_delegation_session",
  "get_agent_action_receipts",
  "get_learning_profile",
  "inspect_mechanism_entities",
  "get_activity_trail",
  "view_mechanism_history_state",
  "compare_reached_step",
  "replay_reached_step",
  "focus_mechanism_entities",
]);

const COACH_TOOL_NAMES = new Set([
  "propose_practice_plan",
  "propose_draft_arrows",
  "check_draft_step",
  "request_scaffold",
  "switch_problem",
]);

const COLLABORATE_TOOL_NAMES = new Set([
  "add_draft_arrow",
  "remove_draft_arrow",
  "undo_last_commit",
  "reset_active_exercise",
]);

function contractSignature(contract: CollaborationContract): string {
  return [
    contract.mode,
    contract.maxAgentScaffoldLevel,
    contract.learnerCommitsOnly ? "learner_commit" : "shared_commit",
  ].join(":");
}

function contractToolNames(contract: CollaborationContract): string[] {
  const names = new Set(OBSERVE_TOOL_NAMES);
  if (contract.mode !== "observe") {
    COACH_TOOL_NAMES.forEach((name) => names.add(name));
    if (contract.maxAgentScaffoldLevel === 0) names.delete("request_scaffold");
  }
  if (contract.mode === "collaborate") {
    COLLABORATE_TOOL_NAMES.forEach((name) => names.add(name));
    if (!contract.learnerCommitsOnly) names.add("commit_checked_step");
  }
  return [...names];
}

export function enabledToolNames(
  contract: CollaborationContract,
  delegation: DelegationSession | null = null,
): string[] {
  return effectiveDelegationToolNames(delegation, contractToolNames(contract));
}

export function enabledToolCount(
  contract: CollaborationContract,
  delegation: DelegationSession | null = null,
): number {
  return enabledToolNames(contract, delegation).length;
}

interface ToolFailure {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  mechanismRevision?: number;
}

function dispatchStatus(status: "ready" | "manual" | "error"): void {
  if (typeof document === "undefined") return;
  document.dispatchEvent(
    new CustomEvent("mechanism-canvas:webmcp-status", { detail: status }),
  );
}

function dispatchReachedStepReplay(detail: {
  commitId: string;
  beforeStateId: string;
  afterStateId: string;
}): boolean {
  if (typeof document === "undefined") return false;
  document.dispatchEvent(new CustomEvent(REPLAY_REACHED_STEP_EVENT, { detail }));
  return true;
}

function toolError(code: string, message: string, revision?: number): ToolFailure {
  return {
    ok: false,
    error: { code, message },
    ...(revision === undefined ? {} : { mechanismRevision: revision }),
  };
}

function executionRejection(result: unknown): { rejected: boolean; code: string | null } {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return { rejected: false, code: null };
  }
  const candidate = result as { ok?: unknown; error?: { code?: unknown } };
  return {
    rejected: candidate.ok === false,
    code: candidate.ok === false && typeof candidate.error?.code === "string"
      ? candidate.error.code
      : null,
  };
}

function cloneReceiptForOutput(receipt: ReturnType<ToolReceiptLedger["append"]>) {
  return {
    ...receipt,
    entityIds: [...receipt.entityIds],
    before: { ...receipt.before },
    after: { ...receipt.after },
    changed: { ...receipt.changed },
    delegation: receipt.delegation ? { ...receipt.delegation } : null,
  };
}

function instrumentTool(
  tool: WebMcpToolDefinition,
  store: MechanismStore,
  receiptLedger: ToolReceiptLedger,
  delegationManager: DelegationSessionManager,
): WebMcpToolDefinition {
  const execute = tool.execute;
  return {
    ...tool,
    execute: async (input, options) => {
      const before = captureToolState(store);
      const receiptScope = captureToolReceiptScope(store);
      const startedAt = new Date().toISOString();
      const startedMs = typeof performance === "undefined" ? Date.now() : performance.now();
      const append = (
        outcome: ToolReceiptOutcome,
        code: string | null,
        after = captureToolState(store),
        delegation = delegationManager.receiptEvidence(),
      ) => {
        const completedMs = typeof performance === "undefined" ? Date.now() : performance.now();
        return receiptLedger.append({
          toolName: tool.name,
          kind: toolKind(tool.name),
          outcome,
          intent: summarizeToolIntent(tool.name, input, receiptScope),
          result: summarizeToolResult(outcome, code, before, after),
          code,
          entityIds: receiptEntityIds(input, receiptScope.entityIds),
          delegation,
          startedAt,
          completedAt: new Date().toISOString(),
          durationMs: Math.max(0, Math.round((completedMs - startedMs) * 10) / 10),
          before,
          after,
          changed: changedToolState(before, after),
        });
      };

      if (options?.signal?.aborted) {
        append("canceled", "EXECUTION_CANCELED", before);
        return toolError(
          "EXECUTION_CANCELED",
          "The Site Tool call was canceled before Mechanism Canvas executed it.",
          before.mechanismRevision,
        );
      }

      const delegationDecision = delegationManager.beginToolExecution(tool.name);
      if (!delegationDecision.allowed) {
        append(
          "rejected",
          delegationDecision.code,
          before,
          delegationDecision.evidence,
        );
        return toolError(
          delegationDecision.code,
          delegationDecision.message,
          before.mechanismRevision,
        );
      }
      const delegationToken = delegationDecision.token;

      try {
        const result = await execute(input, options);
        const rejection = executionRejection(result);
        append(
          rejection.rejected ? "rejected" : "succeeded",
          rejection.code,
          captureToolState(store),
          delegationToken?.evidence ?? null,
        );
        delegationManager.finishToolExecution(delegationToken);
        return result;
      } catch (error) {
        append(
          "failed",
          "UNEXPECTED_TOOL_FAILURE",
          captureToolState(store),
          delegationToken?.evidence ?? null,
        );
        delegationManager.finishToolExecution(delegationToken);
        throw error;
      }
    },
  };
}

function toObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Tool input must be an object.");
  }
  return input as Record<string, unknown>;
}

function assertExactKeys(input: Record<string, unknown>, allowed: string[]): void {
  const unexpected = Object.keys(input).find((key) => !allowed.includes(key));
  if (unexpected) throw new Error(`Unexpected input property: ${unexpected}.`);
}

function requiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} must be a non-empty string.`);
  }
  return value;
}

function requiredInteger(input: Record<string, unknown>, key: string): number {
  const value = input[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer.`);
  }
  return value;
}

function optionalInteger(
  input: Record<string, unknown>,
  key: string,
  fallback: number,
  maximum: number,
): number {
  const value = input[key];
  if (value === undefined) return fallback;
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > maximum
  ) {
    throw new Error(`${key} must be an integer from 0 to ${maximum}.`);
  }
  return value;
}

function requiredStringArray(input: Record<string, unknown>, key: string): string[] {
  const value = input[key];
  if (
    !Array.isArray(value) ||
    value.length > 20 ||
    value.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    throw new Error(`${key} must be an array of at most 20 non-empty strings.`);
  }
  return value as string[];
}

function requiredProposedArrows(
  input: Record<string, unknown>,
  key: string,
): ProposedArrow[] {
  const value = input[key];
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_PROPOSAL_ARROWS) {
    throw new Error(`${key} must contain between 1 and ${MAX_PROPOSAL_ARROWS} arrows.`);
  }
  return value.map((item, index) => {
    const arrow = toObject(item);
    assertExactKeys(arrow, ["sourceType", "sourceEntityId", "targetAtomId"]);
    const sourceType = requiredString(arrow, "sourceType");
    if (sourceType !== "lone_pair" && sourceType !== "bond") {
      throw new Error(`${key}[${index}].sourceType must be lone_pair or bond.`);
    }
    return {
      source: {
        kind: sourceType,
        entityId: requiredString(arrow, "sourceEntityId"),
      },
      target: {
        kind: "atom",
        entityId: requiredString(arrow, "targetAtomId"),
      },
    };
  });
}

function commandOutput<T>(store: MechanismStore, result: CommandResult<T>) {
  if (!result.ok) {
    return toolError(
      result.error?.code ?? "COMMAND_FAILED",
      result.error?.message ?? "The command failed.",
      store.getState().mechanismRevision,
    );
  }
  return {
    ok: true,
    mechanismRevision: store.getState().mechanismRevision,
    currentStateId: store.getState().currentStateId,
    draftArrowCount: store.getState().draftArrows.length,
  };
}

function delegationOutput(
  store: MechanismStore,
  delegationManager: DelegationSessionManager,
) {
  const session = delegationManager.getSnapshot();
  const contract = store.getCollaborationContract();
  const enabledTools = enabledToolNames(contract, session);
  if (!session) {
    return {
      active: false,
      persistence: "memory only in this browser tab; resets on refresh",
      learnerControl: "Only the visible page can start a delegation session.",
      enabledTools,
      enabledToolCount: enabledTools.length,
    };
  }
  return {
    active: true,
    id: session.id,
    presetId: session.presetId,
    presetLabel: session.presetLabel,
    status: session.status,
    scope: {
      problemId: session.problemId,
      stateId: session.stateId,
      expectedMechanismRevision: session.expectedMechanismRevision,
    },
    actionBudget: session.maxActions,
    actionsUsed: session.usedActions,
    actionsRemaining: Math.max(0, session.maxActions - session.usedActions),
    contractRevisionAtStart: session.contractRevisionAtStart,
    grantedTools: [...session.grantedToolNames],
    enabledTools,
    enabledToolCount: enabledTools.length,
    driftReason: session.driftReason,
    persistence: "memory only in this browser tab; resets on refresh",
    learnerControl:
      "No Site Tool can start, expand, renew, or end this delegation session.",
  };
}

function stateOutput(
  store: MechanismStore,
  sessionMode: "saved" | "demo",
  delegationManager: DelegationSessionManager,
) {
  const state = store.getState();
  const problem = store.getProblem();
  const currentMolecule = problem.states[state.currentStateId];
  const molecule = problem.states[visibleStateId(state)];
  const activeStep = problemStepForState(problem, state.currentStateId);
  const historyStateIds = reachableHistoryStateIds(problem, state.history);
  const stepComparisons = availableStepComparisons(problem, state);
  const contract = store.getCollaborationContract();
  const delegation = delegationManager.getSnapshot();
  return {
    ok: true,
    session: {
      mode: sessionMode,
      persistence: sessionMode === "demo" ? "memory only; resets on refresh" : "local browser storage",
    },
    collaborationContract: {
      ...contract,
      modeLabel: COLLABORATION_MODE_LABELS[contract.mode],
      enabledToolCount: enabledToolCount(contract, delegation),
      totalToolCount: MECHANISM_TOOL_COUNT,
      controlledBy: "learner-facing page only",
    },
    delegationSession: delegationOutput(store, delegationManager),
    problem: {
      id: problem.id,
      title: problem.title,
      reactionFamily: problem.reactionFamily,
      prompt: problem.prompt,
      objective: problem.objective,
      reviewStatus: problem.review.status,
      steps: problem.steps.map((step, index) => ({
        index: index + 1,
        id: step.id,
        title: step.title,
        fromStateId: step.fromStateId,
        toStateId: step.toStateId,
      })),
    },
    availableProblems: store.getProblems().map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      reactionFamily: candidate.reactionFamily,
      objective: candidate.objective,
      difficulty: candidate.difficulty,
      stepCount: candidate.stepCount,
      reviewStatus: candidate.review.status,
    })),
    mechanism: {
      currentStateId: state.currentStateId,
      currentStateLabel: currentMolecule.label,
      complete: state.currentStateId === problem.completedStateId,
      currentStep: activeStep
        ? {
            index: problem.steps.indexOf(activeStep) + 1,
            id: activeStep.id,
            title: activeStep.title,
          }
        : null,
      mechanismRevision: state.mechanismRevision,
      draftArrows: state.draftArrows.map((arrow) => ({ ...arrow })),
      agentProposal: state.agentProposal
        ? {
            ...state.agentProposal,
            arrows: state.agentProposal.arrows.map((arrow) => ({
              source: { ...arrow.source },
              target: { ...arrow.target },
            })),
            stale:
              state.agentProposal.problemId !== problem.id ||
              state.agentProposal.stateId !== state.currentStateId ||
              state.agentProposal.baseRevision !== state.mechanismRevision,
          }
        : null,
      latestValidation: state.latestValidation ? { ...state.latestValidation } : null,
      highestScaffoldLevel: state.highestScaffoldLevel,
      visibleScaffoldLevel: state.visibleScaffoldLevel,
      attemptCount: state.attemptCount,
      hintCount: state.hintCount,
      activeCommitCount: state.history.filter((record) => record.undoneAt === null).length,
      activitySequence: state.activitySequence,
      historyView: {
        active: state.historyViewStateId !== null,
        visibleStateId: visibleStateId(state),
        visibleStateLabel: molecule.label,
        readOnly: state.historyViewStateId !== null,
      },
      reachableHistoryStates: historyStateIds.map((stateId) => ({
        id: stateId,
        label: problem.states[stateId].label,
        current: stateId === state.currentStateId,
      })),
      availableStepComparisons: stepComparisons.map((comparison) => ({
        commitId: comparison.commitId,
        stepIndex: comparison.stepIndex,
        stepId: comparison.stepId,
        stepTitle: comparison.stepTitle,
        beforeStateId: comparison.beforeStateId,
        beforeStateLabel: comparison.beforeStateLabel,
        afterStateId: comparison.afterStateId,
        afterStateLabel: comparison.afterStateLabel,
      })),
    },
    entities: {
      atomIds: molecule.atoms.map((atom) => atom.id),
      bondIds: molecule.bonds.map((bond) => bond.id),
      lonePairIds: molecule.lonePairSites.map((site) => site.id),
    },
  };
}

function defineTools(
  store: MechanismStore,
  sessionMode: "saved" | "demo",
  receiptLedger: ToolReceiptLedger,
  delegationManager: DelegationSessionManager,
): WebMcpToolDefinition[] {
  const tools: WebMcpToolDefinition[] = [
    {
      name: "get_mechanism_state",
      description:
        "Read the current Mechanism Canvas problem, committed state, draft arrows, validation status, revision, and stable entity IDs. This does not change the page.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        const parsed = toObject(input);
        assertExactKeys(parsed, []);
        return stateOutput(store, sessionMode, delegationManager);
      },
    },
    {
      name: "get_collaboration_contract",
      description:
        "Read the learner-owned collaboration mode, agent hint ceiling, commit boundary, revision, and currently enabled Site Tool names. This contract can be changed only in the visible page, never through a Site Tool.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        const parsed = toObject(input);
        assertExactKeys(parsed, []);
        const contract = store.getCollaborationContract();
        return {
          ok: true,
          contract: {
            ...contract,
            modeLabel: COLLABORATION_MODE_LABELS[contract.mode],
          },
          enabledTools: enabledToolNames(contract, delegationManager.getSnapshot()),
          enabledToolCount: enabledToolCount(contract, delegationManager.getSnapshot()),
          totalToolCount: MECHANISM_TOOL_COUNT,
          learnerControl: "No Site Tool can change this contract.",
        };
      },
    },
    {
      name: "get_delegation_session",
      description:
        "Read the learner-granted, tab-local delegation purpose, exact problem and state scope, frozen tool grant, current effective Site Tool surface, status, and finite action budget. This does not change the page, and no Site Tool can create or expand the session.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        const parsed = toObject(input);
        assertExactKeys(parsed, []);
        return {
          ok: true,
          session: delegationOutput(store, delegationManager),
          totalToolCount: MECHANISM_TOOL_COUNT,
        };
      },
    },
    {
      name: "get_agent_action_receipts",
      description:
        "Read the privacy-minimized Agent Proof Ledger for this browser tab. Returns allowlisted Site Tool names, semantic IDs, contract and mechanism state stamps, outcomes, timings, and actual page-state effects. Raw inputs, outputs, prompts, and rationales are never retained. Reading the ledger does not change chemistry; this call's own receipt is appended only after the response is assembled.",
      inputSchema: {
        type: "object",
        properties: {
          afterSequence: { type: "integer", minimum: 0 },
          limit: { type: "integer", minimum: 1, maximum: 30 },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["afterSequence", "limit"]);
          const afterSequence = optionalInteger(
            parsed,
            "afterSequence",
            0,
            Number.MAX_SAFE_INTEGER,
          );
          const limit = optionalInteger(parsed, "limit", 12, 30);
          const allReceipts = receiptLedger.getSnapshot();
          const matching = allReceipts.filter((receipt) => receipt.sequence > afterSequence);
          const receipts = matching.slice(0, limit).map(cloneReceiptForOutput);
          return {
            ok: true,
            sessionId: receiptLedger.getSessionId(),
            persistence: "memory only in this browser tab; never written to saved practice",
            retention: `latest ${MAX_TOOL_RECEIPTS} Site Tool calls`,
            privacy:
              "Receipts omit raw tool inputs, outputs, prompts, rationales, and learner identity. Only bounded semantic IDs and state evidence are retained.",
            summary: summarizeToolReceipts(allReceipts),
            latestSequence: allReceipts.at(-1)?.sequence ?? 0,
            returnedThroughSequence: receipts.at(-1)?.sequence ?? afterSequence,
            returned: receipts.length,
            hasMore: matching.length > receipts.length,
            receipts,
            receiptTiming:
              "This response is assembled before get_agent_action_receipts appends its own receipt.",
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "get_learning_profile",
      description:
        "Read the privacy-local Practice Compass profile derived from deterministic checks, hints, and completed steps across all exercises. Returns evidence statuses and bounded recommendations without exposing authored answers or changing the page.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, []);
          const profile = store.getLearningProfile();
          const pendingProposal = store.getPracticePlanProposal();
          return {
            ok: true,
            privacy: sessionMode === "demo" ? "memory only; resets on refresh" : "local browser storage",
            learnerControl: "An agent may stage a plan, but only the learner can start or dismiss it in the page.",
            profile,
            pendingProposal: pendingProposal
              ? {
                  ...pendingProposal,
                  stale: pendingProposal.baseProfileRevision !== profile.profileRevision,
                }
              : null,
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message);
        }
      },
    },
    {
      name: "propose_practice_plan",
      description:
        "Stage an ordered plan of 1 to 3 existing exercises against the current Practice Compass revision. This does not switch exercises, change chemistry, or count progress; the learner must explicitly start or dismiss the plan in the page.",
      inputSchema: {
        type: "object",
        properties: {
          problemIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: MAX_PRACTICE_PLAN_PROBLEMS,
          },
          rationale: {
            type: "string",
            minLength: 1,
            maxLength: MAX_PRACTICE_PLAN_RATIONALE_LENGTH,
          },
          expectedProfileRevision: { type: "string" },
        },
        required: ["problemIds", "rationale", "expectedProfileRevision"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["problemIds", "rationale", "expectedProfileRevision"]);
          const problemIds = requiredStringArray(parsed, "problemIds");
          if (problemIds.length < 1 || problemIds.length > MAX_PRACTICE_PLAN_PROBLEMS) {
            throw new Error(`problemIds must contain 1 to ${MAX_PRACTICE_PLAN_PROBLEMS} IDs.`);
          }
          const rationale = requiredString(parsed, "rationale").trim();
          if (rationale.length > MAX_PRACTICE_PLAN_RATIONALE_LENGTH) {
            throw new Error(
              `rationale must be ${MAX_PRACTICE_PLAN_RATIONALE_LENGTH} characters or fewer.`,
            );
          }
          const result = store.stagePracticePlan({
            problemIds,
            rationale,
            expectedProfileRevision: requiredString(parsed, "expectedProfileRevision"),
          });
          if (!result.ok) return commandOutput(store, result);
          return {
            ok: true,
            mechanismRevision: store.getState().mechanismRevision,
            profileRevision: store.getLearningProfile().profileRevision,
            awaitingLearnerApproval: true,
            proposal: result.value,
          };
        } catch (error) {
          return toolError(
            "INVALID_INPUT",
            (error as Error).message,
            store.getState().mechanismRevision,
          );
        }
      },
    },
    {
      name: "inspect_mechanism_entities",
      description:
        "Read chemistry details for specific stable atom, bond, or lone-pair IDs in the current structure. This does not focus or change the page.",
      inputSchema: {
        type: "object",
        properties: {
          entityIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 20,
          },
        },
        required: ["entityIds"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["entityIds"]);
          const entityIds = requiredStringArray(parsed, "entityIds");
          const mechanism = store.getState();
          const molecule = store.getProblem().states[visibleStateId(mechanism)];
          const entities = entityIds.map((entityId) => {
            const atom = molecule.atoms.find((candidate) => candidate.id === entityId);
            if (atom) return { kind: "atom", ...atom };
            const bond = molecule.bonds.find((candidate) => candidate.id === entityId);
            if (bond) return { kind: "bond", ...bond, description: describeEntity(molecule, entityId) };
            const lonePair = molecule.lonePairSites.find((candidate) => candidate.id === entityId);
            if (lonePair) {
              return {
                kind: "lone_pair",
                ...lonePair,
                description: describeEntity(molecule, entityId),
              };
            }
            return { kind: "missing", id: entityId };
          });
          return { ok: true, mechanismRevision: mechanism.mechanismRevision, entities };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "get_activity_trail",
      description:
        "Read the shared human, agent, and validator activity trail for the active exercise. Use afterSequence for incremental reads. This does not change the page.",
      inputSchema: {
        type: "object",
        properties: {
          afterSequence: { type: "integer", minimum: 0, default: 0 },
          limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["afterSequence", "limit"]);
          const afterSequence = optionalInteger(parsed, "afterSequence", 0, Number.MAX_SAFE_INTEGER);
          const limit = optionalInteger(parsed, "limit", 20, 50);
          if (limit < 1) throw new Error("limit must be an integer from 1 to 50.");
          const state = store.getState();
          const unread = state.activity.filter((event) => event.sequence > afterSequence);
          const events = unread.slice(0, limit).map((event) => ({
            ...event,
            entityIds: [...event.entityIds],
          }));
          return {
            ok: true,
            problemId: store.getProblem().id,
            mechanismRevision: state.mechanismRevision,
            latestSequence: state.activitySequence,
            events,
            hasMore: unread.length > events.length,
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "view_mechanism_history_state",
      description:
        "Show one already reached reactant, intermediate, or product state in the visible canvas without changing committed chemistry. Pass the currentStateId to return to the current mechanism state. Unreached future states are rejected.",
      inputSchema: {
        type: "object",
        properties: { stateId: { type: "string" } },
        required: ["stateId"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["stateId"]);
          const stateId = requiredString(parsed, "stateId");
          return commandOutput(store, store.viewHistoryState(stateId, "agent"));
        } catch (error) {
          return toolError(
            "INVALID_INPUT",
            (error as Error).message,
            store.getState().mechanismRevision,
          );
        }
      },
    },
    {
      name: "compare_reached_step",
      description:
        "Compare the before and after graphs for one active committed transition. Returns exact bond, formal-charge, lone-pair, and implicit-hydrogen changes without changing page state or chemistry. Only a currently reached beforeStateId/afterStateId pair listed by get_mechanism_state is accepted; undone and future transitions are rejected.",
      inputSchema: {
        type: "object",
        properties: {
          beforeStateId: { type: "string" },
          afterStateId: { type: "string" },
        },
        required: ["beforeStateId", "afterStateId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["beforeStateId", "afterStateId"]);
          const state = store.getState();
          const problem = store.getProblem();
          const comparison = compareReachedStep(
            problem,
            state,
            requiredString(parsed, "beforeStateId"),
            requiredString(parsed, "afterStateId"),
          );
          if (!comparison) {
            return toolError(
              "TARGET_NOT_SUPPORTED",
              "That exact transition is not an active committed step. Read availableStepComparisons from get_mechanism_state and compare only a listed pair.",
              state.mechanismRevision,
            );
          }
          return {
            ok: true,
            problemId: problem.id,
            mechanismRevision: state.mechanismRevision,
            step: {
              commitId: comparison.commitId,
              stepIndex: comparison.stepIndex,
              stepId: comparison.stepId,
              stepTitle: comparison.stepTitle,
              actor: comparison.actor,
              beforeStateId: comparison.beforeStateId,
              beforeStateLabel: comparison.beforeStateLabel,
              afterStateId: comparison.afterStateId,
              afterStateLabel: comparison.afterStateLabel,
              performedArrowBundle: comparison.arrowBundle,
            },
            comparison: comparison.comparison,
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "replay_reached_step",
      description:
        "Open the reached-step evidence sheet and replay the exact performed curved-arrow bundle for one active committed transition. This changes only transient presentation state: chemistry, revisions, validation authority, persistence, and activity remain unchanged. Undone and future transitions are rejected.",
      inputSchema: {
        type: "object",
        properties: {
          beforeStateId: { type: "string" },
          afterStateId: { type: "string" },
        },
        required: ["beforeStateId", "afterStateId"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["beforeStateId", "afterStateId"]);
          const state = store.getState();
          const problem = store.getProblem();
          const comparison = compareReachedStep(
            problem,
            state,
            requiredString(parsed, "beforeStateId"),
            requiredString(parsed, "afterStateId"),
          );
          if (!comparison) {
            return toolError(
              "TARGET_NOT_SUPPORTED",
              "That exact transition is not an active committed step. Read availableStepComparisons from get_mechanism_state and replay only a listed pair.",
              state.mechanismRevision,
            );
          }
          const presented = dispatchReachedStepReplay({
            commitId: comparison.commitId,
            beforeStateId: comparison.beforeStateId,
            afterStateId: comparison.afterStateId,
          });
          return {
            ok: true,
            problemId: problem.id,
            mechanismRevision: state.mechanismRevision,
            activitySequence: state.activitySequence,
            presented,
            step: {
              commitId: comparison.commitId,
              stepIndex: comparison.stepIndex,
              stepId: comparison.stepId,
              stepTitle: comparison.stepTitle,
              actor: comparison.actor,
              beforeStateId: comparison.beforeStateId,
              beforeStateLabel: comparison.beforeStateLabel,
              afterStateId: comparison.afterStateId,
              afterStateLabel: comparison.afterStateLabel,
              performedArrowBundle: comparison.arrowBundle,
            },
            comparison: comparison.comparison,
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "focus_mechanism_entities",
      description:
        "Visually focus stable entity IDs in the open Mechanism Canvas and append an agent action to the shared activity trail. This changes page focus only, not chemistry.",
      inputSchema: {
        type: "object",
        properties: {
          entityIds: { type: "array", items: { type: "string" }, maxItems: 20 },
        },
        required: ["entityIds"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["entityIds"]);
          const entityIds = requiredStringArray(parsed, "entityIds");
          return commandOutput(store, store.focusEntities(entityIds, "agent"));
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "propose_draft_arrows",
      description:
        "Stage 1–4 structured electron-flow arrows and a brief rationale for the learner to review on the shared page. This does not change the draft, chemistry, validation, or revision. Only the learner can accept or decline the visible proposal; no site tool can approve it.",
      inputSchema: {
        type: "object",
        properties: {
          arrows: {
            type: "array",
            minItems: 1,
            maxItems: MAX_PROPOSAL_ARROWS,
            items: {
              type: "object",
              properties: {
                sourceType: { type: "string", enum: ["lone_pair", "bond"] },
                sourceEntityId: { type: "string" },
                targetAtomId: { type: "string" },
              },
              required: ["sourceType", "sourceEntityId", "targetAtomId"],
              additionalProperties: false,
            },
          },
          rationale: {
            type: "string",
            minLength: 1,
            maxLength: MAX_PROPOSAL_RATIONALE_LENGTH,
          },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["arrows", "rationale", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["arrows", "rationale", "expectedRevision"]);
          const rationale = requiredString(parsed, "rationale").trim();
          if (rationale.length > MAX_PROPOSAL_RATIONALE_LENGTH) {
            throw new Error(
              `rationale must be ${MAX_PROPOSAL_RATIONALE_LENGTH} characters or fewer.`,
            );
          }
          const result = store.stageAgentProposal({
            arrows: requiredProposedArrows(parsed, "arrows"),
            rationale,
            expectedRevision: requiredInteger(parsed, "expectedRevision"),
          });
          if (!result.ok) return commandOutput(store, result);
          return {
            ok: true,
            mechanismRevision: store.getState().mechanismRevision,
            draftArrowCount: store.getState().draftArrows.length,
            awaitingLearnerApproval: true,
            proposal: result.value,
          };
        } catch (error) {
          return toolError(
            "INVALID_INPUT",
            (error as Error).message,
            store.getState().mechanismRevision,
          );
        }
      },
    },
    {
      name: "add_draft_arrow",
      description:
        "Add one agent-authored curved arrow to the visible draft and shared activity trail. This changes the draft, invalidates any prior check, and increments the mechanism revision; it does not commit chemistry.",
      inputSchema: {
        type: "object",
        properties: {
          sourceType: { type: "string", enum: ["lone_pair", "bond"] },
          sourceEntityId: { type: "string" },
          targetAtomId: { type: "string" },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["sourceType", "sourceEntityId", "targetAtomId", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["sourceType", "sourceEntityId", "targetAtomId", "expectedRevision"]);
          const sourceType = requiredString(parsed, "sourceType");
          if (sourceType !== "lone_pair" && sourceType !== "bond") {
            throw new Error("sourceType must be lone_pair or bond.");
          }
          const source: ElectronSource = {
            kind: sourceType,
            entityId: requiredString(parsed, "sourceEntityId"),
          };
          const result = store.addDraftArrow({
            source,
            target: { kind: "atom", entityId: requiredString(parsed, "targetAtomId") },
            expectedRevision: requiredInteger(parsed, "expectedRevision"),
            actor: "agent",
          });
          if (!result.ok) return commandOutput(store, result);
          return {
            ...commandOutput(store, { ok: true }),
            addedArrow: result.value,
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "remove_draft_arrow",
      description:
        "Remove one visible draft arrow by ID and append an agent action to the shared trail. This invalidates any prior check and increments the mechanism revision.",
      inputSchema: {
        type: "object",
        properties: {
          arrowId: { type: "string" },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["arrowId", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["arrowId", "expectedRevision"]);
          return commandOutput(
            store,
            store.removeDraftArrow(
              requiredString(parsed, "arrowId"),
              "agent",
              requiredInteger(parsed, "expectedRevision"),
            ),
          );
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "check_draft_step",
      description:
        "Run the deterministic chemistry validator on the complete visible draft. This records a check and returns a revision-bound validation ID, but does not commit the mechanism.",
      inputSchema: {
        type: "object",
        properties: { expectedRevision: { type: "integer", minimum: 0 } },
        required: ["expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["expectedRevision"]);
          const result = store.checkDraftStep("agent", requiredInteger(parsed, "expectedRevision"));
          if (!result.ok) return commandOutput(store, result);
          return {
            ok: true,
            mechanismRevision: store.getState().mechanismRevision,
            validation: result.value,
            commitAvailable: result.value?.classification === "valid",
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "request_scaffold",
      description:
        `Open one authored scaffold level from 1 to ${store.getCollaborationContract().maxAgentScaffoldLevel}, focus its related entities, and record an agent hint request. The learner's current collaboration contract is authoritative.`,
      inputSchema: {
        type: "object",
        properties: {
          level: {
            type: "integer",
            minimum: 1,
            maximum: store.getCollaborationContract().maxAgentScaffoldLevel,
          },
        },
        required: ["level"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["level"]);
          const level = requiredInteger(parsed, "level");
          if (level < 1 || level > 4) throw new Error("level must be an integer from 1 to 4.");
          const result = store.requestScaffold(level as 1 | 2 | 3 | 4, "agent");
          if (!result.ok) return commandOutput(store, result);
          return {
            ok: true,
            mechanismRevision: store.getState().mechanismRevision,
            scaffold: result.value,
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "commit_checked_step",
      description:
        "Commit a currently valid, revision-bound checked arrow bundle to the visible product state. This is an explicit chemistry mutation, adds a reversible history record, and clears the draft.",
      inputSchema: {
        type: "object",
        properties: {
          validationId: { type: "string" },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["validationId", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["validationId", "expectedRevision"]);
          return commandOutput(
            store,
            store.commitCheckedStep(
              requiredString(parsed, "validationId"),
              "agent",
              requiredInteger(parsed, "expectedRevision"),
            ),
          );
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "undo_last_commit",
      description:
        "Undo the most recent active committed mechanism step, restore its previous structure, and append a reversal to the shared history. This changes visible chemistry but is itself reversible by drafting again.",
      inputSchema: {
        type: "object",
        properties: { expectedRevision: { type: "integer", minimum: 0 } },
        required: ["expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["expectedRevision"]);
          return commandOutput(
            store,
            store.undoLastCommit("agent", requiredInteger(parsed, "expectedRevision")),
          );
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "switch_problem",
      description:
        "Switch the visible Mechanism Canvas to another problem ID listed by get_mechanism_state. Each problem keeps its own local progress, any validation approval is dropped, and the shared activity trail records the switch.",
      inputSchema: {
        type: "object",
        properties: {
          problemId: { type: "string" },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["problemId", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["problemId", "expectedRevision"]);
          return commandOutput(
            store,
            store.switchProblem(
              requiredString(parsed, "problemId"),
              "agent",
              requiredInteger(parsed, "expectedRevision"),
            ),
          );
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "reset_active_exercise",
      description:
        "Reset the active exercise to its authored reactants and erase its draft, validation, commit history, hints, and prior activity. Use only after the learner explicitly asks to reset. Requires confirmReset true and the current revision.",
      inputSchema: {
        type: "object",
        properties: {
          confirmReset: { type: "boolean", const: true },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["confirmReset", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["confirmReset", "expectedRevision"]);
          if (parsed.confirmReset !== true) {
            throw new Error("confirmReset must be true after the learner explicitly requests a reset.");
          }
          return commandOutput(
            store,
            store.resetProblem("agent", requiredInteger(parsed, "expectedRevision")),
          );
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
  ];
  return tools.map((tool) =>
    instrumentTool(tool, store, receiptLedger, delegationManager));
}

function delegationManagerForStore(store: MechanismStore): DelegationSessionManager {
  if (store === mechanismStore) return delegationSessionManager;
  const existing = fallbackDelegationManagers.get(store);
  if (existing) return existing;
  const created = createDelegationSessionManager(store);
  fallbackDelegationManagers.set(store, created);
  return created;
}

export async function registerMechanismCanvasTools(
  store: MechanismStore = mechanismStore,
  context: WebMcpModelContext | undefined =
    typeof document === "undefined" ? undefined : document.modelContext,
  sessionMode: "saved" | "demo" = activeSessionMode,
  receiptLedger: ToolReceiptLedger = toolReceiptLedger,
  delegationManager: DelegationSessionManager = delegationManagerForStore(store),
): Promise<number> {
  if (!context || typeof context.registerTool !== "function") {
    dispatchStatus("manual");
    return 0;
  }
  const existing = registeredContexts.get(context);
  if (existing) {
    dispatchStatus("ready");
    return existing.count;
  }

  const registration: ContextRegistration = {
    controller: null,
    count: 0,
    signature: "",
    unsubscribes: [],
    queue: Promise.resolve(),
  };
  registeredContexts.set(context, registration);

  const refresh = async () => {
    const contract = store.getCollaborationContract();
    const nextSignature = `${contractSignature(contract)}|${delegationSurfaceSignature(
      delegationManager.getSnapshot(),
    )}`;
    if (nextSignature === registration.signature) return;

    registration.controller?.abort();
    await Promise.resolve();

    const controller = new AbortController();
    const enabledNames = new Set(
      enabledToolNames(contract, delegationManager.getSnapshot()),
    );
    const tools = defineTools(
      store,
      sessionMode,
      receiptLedger,
      delegationManager,
    ).filter((tool) => enabledNames.has(tool.name));
    for (const tool of tools) {
      await context.registerTool(tool, { signal: controller.signal });
    }
    registration.controller = controller;
    registration.count = tools.length;
    registration.signature = nextSignature;
    dispatchStatus("ready");
  };

  try {
    await refresh();
    const scheduleRefresh = () => {
      const nextSignature = `${contractSignature(
        store.getCollaborationContract(),
      )}|${delegationSurfaceSignature(delegationManager.getSnapshot())}`;
      if (nextSignature === registration.signature) return;
      registration.queue = registration.queue
        .then(refresh)
        .catch((error) => {
          console.error("Mechanism Canvas could not update its WebMCP tool surface.", error);
          dispatchStatus("error");
        });
    };
    registration.unsubscribes = [
      store.subscribe(scheduleRefresh),
      delegationManager.subscribe(scheduleRefresh),
    ];
    return registration.count;
  } catch (error) {
    registration.controller?.abort();
    registration.unsubscribes.forEach((unsubscribe) => unsubscribe());
    registeredContexts.delete(context);
    console.error("Mechanism Canvas could not register WebMCP tools.", error);
    dispatchStatus("error");
    return 0;
  }
}
