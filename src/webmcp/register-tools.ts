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
  extractToolReceiptEvidence,
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
import { hypothesisLabManager } from "./active-hypothesis-lab";
import {
  createDelegationSessionManager,
  delegationSurfaceSignature,
  effectiveDelegationToolNames,
  type DelegationSession,
  type DelegationSessionManager,
} from "./delegation-session";
import {
  HYPOTHESIS_LAB_CONTROL_TOOL_NAME,
  HYPOTHESIS_LAB_WORK_TOOL_NAMES,
  MAX_HYPOTHESIS_RATIONALE_LENGTH,
  activeHypothesisToolNames,
  createHypothesisLabManager,
  hypothesisLabSurfaceSignature,
  type HypothesisLab,
  type HypothesisLabManager,
  type HypothesisLabResult,
} from "./hypothesis-lab";
import {
  capabilitySurfaceRecorder,
  type CapabilitySurfaceRecorder,
  type CapabilitySurfaceScope,
} from "./capability-surface-recorder";
import { MECHANISM_TOOL_COUNT } from "./tool-catalog";

export { MECHANISM_TOOL_COUNT } from "./tool-catalog";

interface ContextRegistration {
  controller: AbortController | null;
  count: number;
  signature: string;
  toolNames: string[];
  unsubscribes: Array<() => void>;
  queue: Promise<void>;
}

const registeredContexts = new WeakMap<object, ContextRegistration>();
const fallbackDelegationManagers = new WeakMap<object, DelegationSessionManager>();
const fallbackHypothesisLabManagers = new WeakMap<object, HypothesisLabManager>();

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

function contractToolNames(
  contract: CollaborationContract,
  lab: HypothesisLab | null = null,
): string[] {
  const names = new Set(OBSERVE_TOOL_NAMES);
  if (contract.mode !== "observe") {
    COACH_TOOL_NAMES.forEach((name) => names.add(name));
    if (contract.maxAgentScaffoldLevel === 0) names.delete("request_scaffold");
  }
  if (contract.mode === "collaborate") {
    COLLABORATE_TOOL_NAMES.forEach((name) => names.add(name));
    if (!contract.learnerCommitsOnly) names.add("commit_checked_step");
  }
  const labToolNames = activeHypothesisToolNames(lab);
  if (labToolNames.includes(HYPOTHESIS_LAB_CONTROL_TOOL_NAME)) {
    names.add(HYPOTHESIS_LAB_CONTROL_TOOL_NAME);
  }
  if (contract.mode !== "observe") {
    HYPOTHESIS_LAB_WORK_TOOL_NAMES.forEach((name) => {
      if (labToolNames.includes(name)) names.add(name);
    });
  }
  return [...names];
}

export function enabledToolNames(
  contract: CollaborationContract,
  delegation: DelegationSession | null = null,
  lab: HypothesisLab | null = null,
): string[] {
  return effectiveDelegationToolNames(delegation, contractToolNames(contract, lab));
}

export function enabledToolCount(
  contract: CollaborationContract,
  delegation: DelegationSession | null = null,
  lab: HypothesisLab | null = null,
): number {
  return enabledToolNames(contract, delegation, lab).length;
}

function sameToolNames(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightNames = new Set(right);
  return left.every((name) => rightNames.has(name));
}

function captureCapabilitySurfaceScope(
  store: MechanismStore,
  delegation: DelegationSession | null,
  lab: HypothesisLab | null,
): CapabilitySurfaceScope {
  const contract = store.getCollaborationContract();
  return {
    collaborationMode: contract.mode,
    contractRevision: contract.revision,
    delegationSessionId: delegation?.id ?? null,
    delegationPresetLabel: delegation?.presetLabel ?? null,
    delegationStatus: delegation?.status ?? null,
    hypothesisLabId: lab?.id ?? null,
    hypothesisLabStatus: lab?.status ?? null,
  };
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
    evidence: receipt.evidence
      ? {
          ...receipt.evidence,
          comparedBranchIds: receipt.evidence.comparedBranchIds
            ? [...receipt.evidence.comparedBranchIds]
            : null,
          comparisonArrowCounts: receipt.evidence.comparisonArrowCounts
            ? { ...receipt.evidence.comparisonArrowCounts }
            : null,
        }
      : null,
    delegation: receipt.delegation ? { ...receipt.delegation } : null,
  };
}

function instrumentTool(
  tool: WebMcpToolDefinition,
  store: MechanismStore,
  receiptLedger: ToolReceiptLedger,
  delegationManager: DelegationSessionManager,
  labManager: HypothesisLabManager,
): WebMcpToolDefinition {
  const execute = tool.execute;
  return {
    ...tool,
    execute: async (input, options) => {
      const before = captureToolState(store, labManager.getSnapshot());
      const receiptScope = captureToolReceiptScope(store);
      const startedAt = new Date().toISOString();
      const startedMs = typeof performance === "undefined" ? Date.now() : performance.now();
      const append = (
        outcome: ToolReceiptOutcome,
        code: string | null,
        after = captureToolState(store, labManager.getSnapshot()),
        delegation = delegationManager.receiptEvidence(),
        evidence = null as ReturnType<typeof extractToolReceiptEvidence>,
      ) => {
        const completedMs = typeof performance === "undefined" ? Date.now() : performance.now();
        return receiptLedger.append({
          toolName: tool.name,
          kind: toolKind(tool.name),
          outcome,
          intent: summarizeToolIntent(tool.name, input, receiptScope),
          result: summarizeToolResult(outcome, code, before, after, evidence),
          code,
          entityIds: receiptEntityIds(input, receiptScope.entityIds),
          evidence,
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
          captureToolState(store, labManager.getSnapshot()),
          delegationToken?.evidence ?? null,
          rejection.rejected ? null : extractToolReceiptEvidence(tool.name, input, result),
        );
        delegationManager.finishToolExecution(delegationToken);
        return result;
      } catch (error) {
        append(
          "failed",
          "UNEXPECTED_TOOL_FAILURE",
          captureToolState(store, labManager.getSnapshot()),
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
  labManager: HypothesisLabManager,
) {
  const session = delegationManager.getSnapshot();
  const contract = store.getCollaborationContract();
  const enabledTools = enabledToolNames(contract, session, labManager.getSnapshot());
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

function hypothesisLabOutput(
  store: MechanismStore,
  labManager: HypothesisLabManager,
) {
  const lab = labManager.getSnapshot();
  if (!lab) {
    return {
      active: false,
      persistence: "memory only in this browser tab; resets on refresh",
      learnerControl: "Only the visible page can start a Counterfactual Lab.",
    };
  }
  const pendingProposalId = store.getState().agentProposal?.id ?? null;
  return {
    active: true,
    id: lab.id,
    status: lab.status,
    labRevision: lab.labRevision,
    scope: {
      problemId: lab.problemId,
      stateId: lab.stateId,
      baseMechanismRevision: lab.baseMechanismRevision,
      baseDraftArrowCount: lab.baseDraftArrows.length,
    },
    mainDraftUnchanged:
      store.getState().mechanismRevision === lab.baseMechanismRevision &&
      store.getState().draftArrows.length === lab.baseDraftArrows.length,
    branches: lab.branches.map((branch) => ({
      id: branch.id,
      label: branch.label,
      rationale: branch.rationale,
      arrows: branch.arrows.map((arrow) => ({
        source: { ...arrow.source },
        target: { ...arrow.target },
      })),
      validation: branch.validation
        ? {
            classification: branch.validation.classification,
            summary: branch.validation.summary,
            issues: branch.validation.issues.map((issue) => ({ ...issue })),
          }
        : null,
    })),
    comparison: lab.comparison
      ? {
          ...lab.comparison,
          sharedArrows: lab.comparison.sharedArrows.map((arrow) => ({
            source: { ...arrow.source },
            target: { ...arrow.target },
          })),
          leftOnlyArrows: lab.comparison.leftOnlyArrows.map((arrow) => ({
            source: { ...arrow.source },
            target: { ...arrow.target },
          })),
          rightOnlyArrows: lab.comparison.rightOnlyArrows.map((arrow) => ({
            source: { ...arrow.source },
            target: { ...arrow.target },
          })),
        }
      : null,
    recommendation: lab.recommendedBranchId
      ? {
          branchId: lab.recommendedBranchId,
          agentProposalId: lab.agentProposalId,
          awaitingLearnerApproval: pendingProposalId === lab.agentProposalId,
          learnerDecisionRecorded: pendingProposalId !== lab.agentProposalId,
        }
      : null,
    driftReason: lab.driftReason,
    persistence: "memory only in this browser tab; resets on refresh",
    learnerControl:
      "No Site Tool can start, end, or adopt a lab branch into the learner's draft.",
  };
}

function stateOutput(
  store: MechanismStore,
  sessionMode: "saved" | "demo",
  delegationManager: DelegationSessionManager,
  labManager: HypothesisLabManager,
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
      enabledToolCount: enabledToolCount(contract, delegation, labManager.getSnapshot()),
      totalToolCount: MECHANISM_TOOL_COUNT,
      controlledBy: "learner-facing page only",
    },
    delegationSession: delegationOutput(store, delegationManager, labManager),
    hypothesisLab: hypothesisLabOutput(store, labManager),
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
  labManager: HypothesisLabManager,
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
        return stateOutput(store, sessionMode, delegationManager, labManager);
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
          enabledTools: enabledToolNames(
            contract,
            delegationManager.getSnapshot(),
            labManager.getSnapshot(),
          ),
          enabledToolCount: enabledToolCount(
            contract,
            delegationManager.getSnapshot(),
            labManager.getSnapshot(),
          ),
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
          session: delegationOutput(store, delegationManager, labManager),
          totalToolCount: MECHANISM_TOOL_COUNT,
        };
      },
    },
    {
      name: "get_hypothesis_lab",
      description:
        "Read the learner-started Counterfactual Lab, exact mechanism scope, isolated branches, deterministic checks, visible comparison, recommendation state, and current lab revision. This does not change the page. Only the visible page can start or end the lab.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        const parsed = toObject(input);
        assertExactKeys(parsed, []);
        const contract = store.getCollaborationContract();
        return {
          ok: true,
          lab: hypothesisLabOutput(store, labManager),
          enabledTools: enabledToolNames(
            contract,
            delegationManager.getSnapshot(),
            labManager.getSnapshot(),
          ),
          totalToolCount: MECHANISM_TOOL_COUNT,
        };
      },
    },
    {
      name: "set_hypothesis_branch",
      description:
        "Atomically set 1–4 electron-flow arrows and a short rationale on one isolated Counterfactual Lab branch. This changes only the tab-local lab revision; it never changes the learner's draft, chemistry, activity trail, or mechanism revision. Read get_hypothesis_lab first and use its current lab revision.",
      inputSchema: {
        type: "object",
        properties: {
          branchId: { type: "string", enum: ["hypothesis_a", "hypothesis_b", "hypothesis_c"] },
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
            maxLength: MAX_HYPOTHESIS_RATIONALE_LENGTH,
          },
          expectedLabRevision: { type: "integer", minimum: 0 },
        },
        required: ["branchId", "arrows", "rationale", "expectedLabRevision"],
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
          assertExactKeys(parsed, ["branchId", "arrows", "rationale", "expectedLabRevision"]);
          const result = labManager.setBranch({
            branchId: requiredString(parsed, "branchId"),
            arrows: requiredProposedArrows(parsed, "arrows"),
            rationale: requiredString(parsed, "rationale"),
            expectedLabRevision: requiredInteger(parsed, "expectedLabRevision"),
          });
          if (!result.ok) {
            return toolError(
              result.error.code,
              result.error.message,
              store.getState().mechanismRevision,
            );
          }
          return {
            ok: true,
            mechanismRevision: store.getState().mechanismRevision,
            lab: hypothesisLabOutput(store, labManager),
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
      name: "check_hypothesis_branch",
      description:
        "Run the deterministic chemistry validator on one isolated Counterfactual Lab branch. This records branch evidence and advances only the lab revision; the learner's main draft and mechanism revision remain unchanged.",
      inputSchema: {
        type: "object",
        properties: {
          branchId: { type: "string", enum: ["hypothesis_a", "hypothesis_b", "hypothesis_c"] },
          expectedLabRevision: { type: "integer", minimum: 0 },
        },
        required: ["branchId", "expectedLabRevision"],
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
          assertExactKeys(parsed, ["branchId", "expectedLabRevision"]);
          const result = labManager.checkBranch({
            branchId: requiredString(parsed, "branchId"),
            expectedLabRevision: requiredInteger(parsed, "expectedLabRevision"),
          });
          if (!result.ok) {
            return toolError(
              result.error.code,
              result.error.message,
              store.getState().mechanismRevision,
            );
          }
          return {
            ok: true,
            mechanismRevision: store.getState().mechanismRevision,
            validation: result.value?.validation,
            lab: hypothesisLabOutput(store, labManager),
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
      name: "compare_hypothesis_branches",
      description:
        "Compare two deterministically checked Counterfactual Lab branches, expose shared and unique electron-flow arrows, and present the comparison in the visible page. This changes only lab presentation state.",
      inputSchema: {
        type: "object",
        properties: {
          leftBranchId: { type: "string", enum: ["hypothesis_a", "hypothesis_b", "hypothesis_c"] },
          rightBranchId: { type: "string", enum: ["hypothesis_a", "hypothesis_b", "hypothesis_c"] },
          expectedLabRevision: { type: "integer", minimum: 0 },
        },
        required: ["leftBranchId", "rightBranchId", "expectedLabRevision"],
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
          assertExactKeys(parsed, ["leftBranchId", "rightBranchId", "expectedLabRevision"]);
          const result = labManager.compareBranches({
            leftBranchId: requiredString(parsed, "leftBranchId"),
            rightBranchId: requiredString(parsed, "rightBranchId"),
            expectedLabRevision: requiredInteger(parsed, "expectedLabRevision"),
          });
          if (!result.ok) {
            return toolError(
              result.error.code,
              result.error.message,
              store.getState().mechanismRevision,
            );
          }
          return {
            ok: true,
            mechanismRevision: store.getState().mechanismRevision,
            comparison: result.value,
            lab: hypothesisLabOutput(store, labManager),
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
      name: "recommend_hypothesis_branch",
      description:
        "Recommend one deterministically valid Counterfactual Lab branch by staging it in the visible Agent proposal gate. This closes branch editing but does not add arrows to the learner's draft, check the main draft, or commit chemistry. Only the learner can approve the staged proposal.",
      inputSchema: {
        type: "object",
        properties: {
          branchId: { type: "string", enum: ["hypothesis_a", "hypothesis_b", "hypothesis_c"] },
          rationale: {
            type: "string",
            minLength: 1,
            maxLength: MAX_PROPOSAL_RATIONALE_LENGTH,
          },
          expectedLabRevision: { type: "integer", minimum: 0 },
          expectedMechanismRevision: { type: "integer", minimum: 0 },
        },
        required: [
          "branchId",
          "rationale",
          "expectedLabRevision",
          "expectedMechanismRevision",
        ],
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
          assertExactKeys(parsed, [
            "branchId",
            "rationale",
            "expectedLabRevision",
            "expectedMechanismRevision",
          ]);
          const result = labManager.recommendBranch({
            branchId: requiredString(parsed, "branchId"),
            rationale: requiredString(parsed, "rationale"),
            expectedLabRevision: requiredInteger(parsed, "expectedLabRevision"),
            expectedMechanismRevision: requiredInteger(parsed, "expectedMechanismRevision"),
          });
          if (!result.ok) {
            return toolError(
              result.error.code,
              result.error.message,
              store.getState().mechanismRevision,
            );
          }
          return {
            ok: true,
            mechanismRevision: store.getState().mechanismRevision,
            draftArrowCount: store.getState().draftArrows.length,
            awaitingLearnerApproval: true,
            proposal: result.value,
            lab: hypothesisLabOutput(store, labManager),
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
    instrumentTool(tool, store, receiptLedger, delegationManager, labManager));
}

function delegationManagerForStore(store: MechanismStore): DelegationSessionManager {
  if (store === mechanismStore) return delegationSessionManager;
  const existing = fallbackDelegationManagers.get(store);
  if (existing) return existing;
  const created = createDelegationSessionManager(store);
  fallbackDelegationManagers.set(store, created);
  return created;
}

function hypothesisLabManagerForStore(store: MechanismStore): HypothesisLabManager {
  if (store === mechanismStore) return hypothesisLabManager;
  const existing = fallbackHypothesisLabManagers.get(store);
  if (existing) return existing;
  const created = createHypothesisLabManager(store);
  fallbackHypothesisLabManagers.set(store, created);
  return created;
}

export async function registerMechanismCanvasTools(
  store: MechanismStore = mechanismStore,
  context: WebMcpModelContext | undefined =
    typeof document === "undefined" ? undefined : document.modelContext,
  sessionMode: "saved" | "demo" = activeSessionMode,
  receiptLedger: ToolReceiptLedger = toolReceiptLedger,
  delegationManager: DelegationSessionManager = delegationManagerForStore(store),
  labManager: HypothesisLabManager = hypothesisLabManagerForStore(store),
  surfaceRecorder: CapabilitySurfaceRecorder = capabilitySurfaceRecorder,
): Promise<number> {
  if (!context || typeof context.registerTool !== "function") {
    surfaceRecorder.markManual(
      enabledToolNames(
        store.getCollaborationContract(),
        delegationManager.getSnapshot(),
        labManager.getSnapshot(),
      ),
    );
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
    toolNames: [],
    unsubscribes: [],
    queue: Promise.resolve(),
  };
  registeredContexts.set(context, registration);

  const currentSurfaceSignature = () => `${contractSignature(
    store.getCollaborationContract(),
  )}|${delegationSurfaceSignature(
    delegationManager.getSnapshot(),
  )}|${hypothesisLabSurfaceSignature(labManager.getSnapshot())}`;

  const refresh = async () => {
    const contract = store.getCollaborationContract();
    const nextSignature = currentSurfaceSignature();
    if (nextSignature === registration.signature) return;

    const nextToolNames = enabledToolNames(
      contract,
      delegationManager.getSnapshot(),
      labManager.getSnapshot(),
    );
    if (registration.controller && sameToolNames(registration.toolNames, nextToolNames)) {
      registration.signature = nextSignature;
      dispatchStatus("ready");
      return;
    }

    registration.controller?.abort();
    await Promise.resolve();

    const controller = new AbortController();
    const enabledNames = new Set(nextToolNames);
    const tools = defineTools(
      store,
      sessionMode,
      receiptLedger,
      delegationManager,
      labManager,
    ).filter((tool) => enabledNames.has(tool.name));
    for (const tool of tools) {
      await context.registerTool(tool, { signal: controller.signal });
    }
    registration.controller = controller;
    registration.count = tools.length;
    registration.signature = nextSignature;
    registration.toolNames = tools.map((tool) => tool.name);
    surfaceRecorder.recordRegistered(
      tools.map((tool) => tool.name),
      captureCapabilitySurfaceScope(
        store,
        delegationManager.getSnapshot(),
        labManager.getSnapshot(),
      ),
    );
    dispatchStatus("ready");
  };

  try {
    await refresh();
    let refreshScheduled = false;
    const scheduleRefresh = () => {
      const nextSignature = currentSurfaceSignature();
      if (nextSignature === registration.signature) return;
      if (refreshScheduled) return;
      refreshScheduled = true;
      registration.queue = registration.queue
        .then(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))
        .then(refresh)
        .then(() => {
          refreshScheduled = false;
          if (currentSurfaceSignature() !== registration.signature) scheduleRefresh();
        })
        .catch((error) => {
          refreshScheduled = false;
          surfaceRecorder.recordError(
            enabledToolNames(
              store.getCollaborationContract(),
              delegationManager.getSnapshot(),
              labManager.getSnapshot(),
            ),
            error,
          );
          console.error("Mechanism Canvas could not update its WebMCP tool surface.", error);
          dispatchStatus("error");
        });
    };
    registration.unsubscribes = [
      store.subscribe(scheduleRefresh),
      delegationManager.subscribe(scheduleRefresh),
      labManager.subscribe(scheduleRefresh),
    ];
    return registration.count;
  } catch (error) {
    registration.controller?.abort();
    registration.unsubscribes.forEach((unsubscribe) => unsubscribe());
    registeredContexts.delete(context);
    surfaceRecorder.recordError(
      enabledToolNames(
        store.getCollaborationContract(),
        delegationManager.getSnapshot(),
        labManager.getSnapshot(),
      ),
      error,
    );
    console.error("Mechanism Canvas could not register WebMCP tools.", error);
    dispatchStatus("error");
    return 0;
  }
}
