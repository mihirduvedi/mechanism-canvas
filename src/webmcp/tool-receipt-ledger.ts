import type { CollaborationMode, ValidationClass } from "../domain/types";
import type { MechanismStore } from "../store/mechanism-store";
import type { DelegationReceiptEvidence } from "./delegation-session";
import type { HypothesisLab } from "./hypothesis-lab";

export const MAX_TOOL_RECEIPTS = 60;
export const TOOL_RECEIPT_SCHEMA_VERSION = 4;

export type ToolReceiptOutcome = "succeeded" | "rejected" | "failed" | "canceled";
export type ToolReceiptKind = "read" | "present" | "propose" | "write";

export interface ToolReceiptEvidence {
  hypothesisBranchId: string | null;
  hypothesisArrowCount: number | null;
  validationClassification: ValidationClass | null;
  comparedBranchIds: [string, string] | null;
  comparisonArrowCounts: {
    shared: number;
    leftOnly: number;
    rightOnly: number;
  } | null;
  awaitingLearnerApproval: boolean | null;
}

export interface ToolStateStamp {
  problemId: string;
  currentStateId: string;
  mechanismRevision: number;
  activitySequence: number;
  draftArrowCount: number;
  collaborationMode: CollaborationMode;
  contractRevision: number;
  hypothesisLabId: string | null;
  hypothesisLabStatus: HypothesisLab["status"] | null;
  hypothesisLabRevision: number | null;
}

export interface ToolReceipt {
  id: string;
  sequence: number;
  toolName: string;
  kind: ToolReceiptKind;
  outcome: ToolReceiptOutcome;
  intent: string;
  result: string;
  code: string | null;
  entityIds: string[];
  evidence: ToolReceiptEvidence | null;
  delegation: DelegationReceiptEvidence | null;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  before: ToolStateStamp;
  after: ToolStateStamp;
  changed: {
    problem: boolean;
    chemistry: boolean;
    draft: boolean;
    activity: boolean;
    contract: boolean;
    hypothesisLab: boolean;
  };
}

export interface ToolReceiptSummary {
  total: number;
  reads: number;
  presentations: number;
  proposals: number;
  writes: number;
  succeeded: number;
  rejected: number;
  failed: number;
  canceled: number;
}

export interface ToolReceiptExport {
  schemaVersion: 4;
  application: "Mechanism Canvas";
  sessionId: string;
  sessionMode: "saved" | "demo";
  generatedAt: string;
  privacy: string;
  retention: string;
  summary: ToolReceiptSummary;
  receipts: ToolReceipt[];
}

export interface ToolReceiptLedger {
  getSessionId: () => string;
  getSnapshot: () => readonly ToolReceipt[];
  subscribe: (listener: () => void) => () => void;
  append: (receipt: Omit<ToolReceipt, "id" | "sequence">) => ToolReceipt;
  clear: () => void;
}

export interface ToolReceiptScope {
  entityIds: ReadonlySet<string>;
  problemIds: ReadonlySet<string>;
  stateIds: ReadonlySet<string>;
  draftArrowIds: ReadonlySet<string>;
}

const TOOL_KINDS: Record<string, ToolReceiptKind> = {
  get_mechanism_state: "read",
  get_collaboration_contract: "read",
  get_delegation_session: "read",
  get_hypothesis_lab: "read",
  get_agent_action_receipts: "read",
  get_learning_profile: "read",
  inspect_mechanism_entities: "read",
  get_activity_trail: "read",
  view_mechanism_history_state: "present",
  compare_reached_step: "read",
  replay_reached_step: "present",
  focus_mechanism_entities: "present",
  propose_practice_plan: "propose",
  propose_draft_arrows: "propose",
  set_hypothesis_branch: "propose",
  check_hypothesis_branch: "write",
  compare_hypothesis_branches: "present",
  recommend_hypothesis_branch: "propose",
  check_draft_step: "write",
  request_scaffold: "write",
  switch_problem: "write",
  add_draft_arrow: "write",
  remove_draft_arrow: "write",
  commit_checked_step: "write",
  undo_last_commit: "write",
  reset_active_exercise: "write",
};

function makeSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `receipt_session_${crypto.randomUUID()}`;
  }
  return `receipt_session_${Date.now().toString(36)}`;
}

function boundedString(value: unknown, maximum = 64): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  return normalized.slice(0, maximum);
}

function boundedInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function inputObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
}

function knownHypothesisBranchId(value: unknown): string | null {
  return value === "hypothesis_a" || value === "hypothesis_b" || value === "hypothesis_c"
    ? value
    : null;
}

function knownValidationClassification(value: unknown): ValidationClass | null {
  return value === "valid" ||
    value === "incomplete" ||
    value === "invalid_invariant" ||
    value === "not_accepted_path" ||
    value === "invalid_input"
    ? value
    : null;
}

function boundedArrayLength(value: unknown): number {
  return Array.isArray(value) ? Math.min(value.length, 99) : 0;
}

export function extractToolReceiptEvidence(
  toolName: string,
  input: unknown,
  result: unknown,
): ToolReceiptEvidence | null {
  if (![
    "set_hypothesis_branch",
    "check_hypothesis_branch",
    "compare_hypothesis_branches",
    "recommend_hypothesis_branch",
  ].includes(toolName)) {
    return null;
  }

  const parsedInput = inputObject(input);
  const parsedResult = inputObject(result);
  const validation = inputObject(parsedResult.validation);
  const comparison = inputObject(parsedResult.comparison);
  const branchId = knownHypothesisBranchId(parsedInput.branchId);
  const leftBranchId = knownHypothesisBranchId(parsedInput.leftBranchId);
  const rightBranchId = knownHypothesisBranchId(parsedInput.rightBranchId);
  const comparedBranchIds = leftBranchId && rightBranchId
    ? [leftBranchId, rightBranchId] as [string, string]
    : null;

  return {
    hypothesisBranchId: branchId,
    hypothesisArrowCount:
      toolName === "set_hypothesis_branch" && Array.isArray(parsedInput.arrows)
        ? Math.min(parsedInput.arrows.length, 99)
        : null,
    validationClassification:
      toolName === "check_hypothesis_branch"
        ? knownValidationClassification(validation.classification)
        : null,
    comparedBranchIds,
    comparisonArrowCounts:
      toolName === "compare_hypothesis_branches" && comparedBranchIds
        ? {
            shared: boundedArrayLength(comparison.sharedArrows),
            leftOnly: boundedArrayLength(comparison.leftOnlyArrows),
            rightOnly: boundedArrayLength(comparison.rightOnlyArrows),
          }
        : null,
    awaitingLearnerApproval:
      toolName === "recommend_hypothesis_branch" &&
      typeof parsedResult.awaitingLearnerApproval === "boolean"
        ? parsedResult.awaitingLearnerApproval
        : null,
  };
}

function compactIds(values: unknown[], allowlist?: ReadonlySet<string>): string[] {
  const compacted = [
    ...new Set(
      values
        .map((value) => boundedString(value))
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  return compacted.filter((value) => !allowlist || allowlist.has(value)).slice(0, 12);
}

function allowlistedString(value: unknown, allowlist?: ReadonlySet<string>): string | null {
  const bounded = boundedString(value);
  return bounded && (!allowlist || allowlist.has(bounded)) ? bounded : null;
}

export function toolKind(toolName: string): ToolReceiptKind {
  return TOOL_KINDS[toolName] ?? "write";
}

export function receiptEntityIds(input: unknown, allowlist?: ReadonlySet<string>): string[] {
  const parsed = inputObject(input);
  const direct = Array.isArray(parsed.entityIds) ? parsed.entityIds : [];
  const arrows = Array.isArray(parsed.arrows)
    ? parsed.arrows.flatMap((arrow) => {
        const candidate = inputObject(arrow);
        return [candidate.sourceEntityId, candidate.targetAtomId];
      })
    : [];
  return compactIds([
    ...direct,
    ...arrows,
    parsed.sourceEntityId,
    parsed.targetAtomId,
  ], allowlist);
}

export function summarizeToolIntent(
  toolName: string,
  input: unknown,
  scope?: ToolReceiptScope,
): string {
  const parsed = inputObject(input);
  const expectedRevision = boundedInteger(parsed.expectedRevision);
  const revisionSuffix = expectedRevision === null ? "" : ` at revision ${expectedRevision}`;
  const sourceType = parsed.sourceType === "lone_pair" || parsed.sourceType === "bond"
    ? parsed.sourceType
    : null;
  const sourceId = allowlistedString(parsed.sourceEntityId, scope?.entityIds);
  const targetId = allowlistedString(parsed.targetAtomId, scope?.entityIds);
  const entityIds = receiptEntityIds(parsed, scope?.entityIds);
  const level = boundedInteger(parsed.level);
  const problemId = allowlistedString(parsed.problemId, scope?.problemIds);
  const arrowId = allowlistedString(parsed.arrowId, scope?.draftArrowIds);
  const beforeStateId = allowlistedString(parsed.beforeStateId, scope?.stateIds);
  const afterStateId = allowlistedString(parsed.afterStateId, scope?.stateIds);
  const stateId = allowlistedString(parsed.stateId, scope?.stateIds);
  const afterSequence = boundedInteger(parsed.afterSequence);
  const limit = boundedInteger(parsed.limit);
  const branchId = knownHypothesisBranchId(parsed.branchId);
  const leftBranchId = knownHypothesisBranchId(parsed.leftBranchId);
  const rightBranchId = knownHypothesisBranchId(parsed.rightBranchId);
  const expectedLabRevision = boundedInteger(parsed.expectedLabRevision);
  const labRevisionSuffix = expectedLabRevision === null
    ? ""
    : ` at lab revision ${expectedLabRevision}`;

  switch (toolName) {
    case "get_mechanism_state": return "Read the shared mechanism state and semantic graph.";
    case "get_collaboration_contract": return "Read the learner-owned agent permission contract.";
    case "get_delegation_session":
      return "Read the learner-granted delegation purpose, scope, surface, and remaining action budget.";
    case "get_hypothesis_lab":
      return "Read the learner-started Counterfactual Lab, isolated branches, checks, and recommendation state.";
    case "get_agent_action_receipts":
      return `Read proof receipts${afterSequence === null ? "" : ` after #${afterSequence}`}${limit === null ? "" : `, up to ${limit}`}.`;
    case "get_learning_profile": return "Read the privacy-local Practice Compass evidence.";
    case "inspect_mechanism_entities":
      return entityIds.length
        ? `Inspect ${entityIds.length} semantic ${entityIds.length === 1 ? "entity" : "entities"}: ${entityIds.join(", ")}.`
        : "Inspect semantic mechanism entities.";
    case "get_activity_trail":
      return `Read the shared activity trail${afterSequence === null ? "" : ` after #${afterSequence}`}.`;
    case "view_mechanism_history_state":
      return stateId ? `Present reached state ${stateId}.` : "Return the canvas to the current state.";
    case "compare_reached_step":
      return beforeStateId && afterStateId
        ? `Compare reached transition ${beforeStateId} → ${afterStateId}.`
        : "Compare one reached mechanism transition.";
    case "replay_reached_step":
      return beforeStateId && afterStateId
        ? `Replay performed arrows for ${beforeStateId} → ${afterStateId}.`
        : "Replay one reached mechanism transition.";
    case "focus_mechanism_entities":
      return entityIds.length ? `Focus ${entityIds.join(", ")} on the shared canvas.` : "Clear canvas focus.";
    case "propose_practice_plan": {
      const ids = Array.isArray(parsed.problemIds)
        ? compactIds(parsed.problemIds, scope?.problemIds)
        : [];
      return ids.length ? `Stage a reviewable practice plan: ${ids.join(" → ")}.` : "Stage a reviewable practice plan.";
    }
    case "propose_draft_arrows": {
      const arrowCount = Array.isArray(parsed.arrows) ? Math.min(parsed.arrows.length, 99) : null;
      return `Stage ${arrowCount ?? "a"} reviewable draft ${arrowCount === 1 ? "arrow" : "arrows"}${revisionSuffix}.`;
    }
    case "set_hypothesis_branch": {
      const arrowCount = Array.isArray(parsed.arrows) ? Math.min(parsed.arrows.length, 99) : null;
      return `Set ${branchId ?? "a hypothesis branch"} to ${arrowCount ?? "a"} ${arrowCount === 1 ? "arrow" : "arrows"}${labRevisionSuffix}.`;
    }
    case "check_hypothesis_branch":
      return `Check ${branchId ?? "a hypothesis branch"} with the deterministic validator${labRevisionSuffix}.`;
    case "compare_hypothesis_branches":
      return leftBranchId && rightBranchId
        ? `Compare ${leftBranchId} with ${rightBranchId}${labRevisionSuffix}.`
        : `Compare two checked hypothesis branches${labRevisionSuffix}.`;
    case "recommend_hypothesis_branch":
      return `Stage ${branchId ?? "a checked hypothesis branch"} for learner review${labRevisionSuffix}.`;
    case "check_draft_step": return `Run the deterministic validator${revisionSuffix}.`;
    case "request_scaffold": return `Open agent hint level ${level ?? "unknown"}.`;
    case "switch_problem": return problemId ? `Switch to exercise ${problemId}${revisionSuffix}.` : `Switch exercises${revisionSuffix}.`;
    case "add_draft_arrow":
      return sourceType && sourceId && targetId
        ? `Add ${sourceType} ${sourceId} → atom ${targetId}${revisionSuffix}.`
        : `Add one draft arrow${revisionSuffix}.`;
    case "remove_draft_arrow": return arrowId ? `Remove draft arrow ${arrowId}${revisionSuffix}.` : `Remove one draft arrow${revisionSuffix}.`;
    case "commit_checked_step": return `Commit a checked step${revisionSuffix}.`;
    case "undo_last_commit": return `Undo the last active commit${revisionSuffix}.`;
    case "reset_active_exercise": return `Reset the active exercise${revisionSuffix}.`;
    default: return "Invoke a registered Site Tool.";
  }
}

export function captureToolReceiptScope(store: MechanismStore): ToolReceiptScope {
  const state = store.getState();
  const problem = store.getProblem();
  const molecule = problem.states[state.currentStateId];
  return {
    entityIds: new Set([
      ...molecule.atoms.map((atom) => atom.id),
      ...molecule.bonds.map((bond) => bond.id),
      ...molecule.lonePairSites.map((site) => site.id),
    ]),
    problemIds: new Set(store.getProblems().map((candidate) => candidate.id)),
    stateIds: new Set(Object.keys(problem.states)),
    draftArrowIds: new Set(state.draftArrows.map((arrow) => arrow.id)),
  };
}

export function captureToolState(
  store: MechanismStore,
  hypothesisLab: HypothesisLab | null = null,
): ToolStateStamp {
  const state = store.getState();
  const contract = store.getCollaborationContract();
  return {
    problemId: state.problemId,
    currentStateId: state.currentStateId,
    mechanismRevision: state.mechanismRevision,
    activitySequence: state.activitySequence,
    draftArrowCount: state.draftArrows.length,
    collaborationMode: contract.mode,
    contractRevision: contract.revision,
    hypothesisLabId: hypothesisLab?.id ?? null,
    hypothesisLabStatus: hypothesisLab?.status ?? null,
    hypothesisLabRevision: hypothesisLab?.labRevision ?? null,
  };
}

export function changedToolState(before: ToolStateStamp, after: ToolStateStamp): ToolReceipt["changed"] {
  return {
    problem: before.problemId !== after.problemId,
    chemistry:
      before.mechanismRevision !== after.mechanismRevision ||
      before.currentStateId !== after.currentStateId,
    draft: before.draftArrowCount !== after.draftArrowCount,
    activity: before.activitySequence !== after.activitySequence,
    contract:
      before.contractRevision !== after.contractRevision ||
      before.collaborationMode !== after.collaborationMode,
    hypothesisLab:
      before.hypothesisLabId !== after.hypothesisLabId ||
      before.hypothesisLabStatus !== after.hypothesisLabStatus ||
      before.hypothesisLabRevision !== after.hypothesisLabRevision,
  };
}

export function summarizeToolResult(
  outcome: ToolReceiptOutcome,
  code: string | null,
  before: ToolStateStamp,
  after: ToolStateStamp,
  evidence: ToolReceiptEvidence | null = null,
): string {
  if (outcome === "canceled") return "Canceled before the page executed the tool.";
  if (outcome === "failed") return "The tool failed before returning a structured result.";
  if (outcome === "rejected") return `Rejected by ${code ?? "a page guard"}; page state stayed authoritative.`;
  if (evidence?.validationClassification && evidence.hypothesisBranchId) {
    return `${evidence.hypothesisBranchId} checked ${evidence.validationClassification}; Counterfactual Lab ${before.hypothesisLabRevision ?? "closed"} → ${after.hypothesisLabRevision ?? "closed"}; main mechanism unchanged.`;
  }
  if (before.problemId !== after.problemId) return `Exercise changed from ${before.problemId} to ${after.problemId}.`;
  if (before.mechanismRevision !== after.mechanismRevision) {
    return `Mechanism revision ${before.mechanismRevision} → ${after.mechanismRevision}.`;
  }
  if (
    before.hypothesisLabId !== after.hypothesisLabId ||
    before.hypothesisLabStatus !== after.hypothesisLabStatus ||
    before.hypothesisLabRevision !== after.hypothesisLabRevision
  ) {
    const beforeRevision = before.hypothesisLabRevision ?? "closed";
    const afterRevision = after.hypothesisLabRevision ?? "closed";
    return `Counterfactual Lab ${beforeRevision} → ${afterRevision}; main mechanism unchanged.`;
  }
  if (before.activitySequence !== after.activitySequence) {
    return `Activity ${before.activitySequence} → ${after.activitySequence}; chemistry revision unchanged.`;
  }
  return "Completed with shared page state unchanged.";
}

export function summarizeToolReceipts(receipts: readonly ToolReceipt[]): ToolReceiptSummary {
  const summary: ToolReceiptSummary = {
    total: receipts.length,
    reads: 0,
    presentations: 0,
    proposals: 0,
    writes: 0,
    succeeded: 0,
    rejected: 0,
    failed: 0,
    canceled: 0,
  };
  for (const receipt of receipts) {
    if (receipt.kind === "read") summary.reads += 1;
    if (receipt.kind === "present") summary.presentations += 1;
    if (receipt.kind === "propose") summary.proposals += 1;
    if (receipt.kind === "write") summary.writes += 1;
    summary[receipt.outcome] += 1;
  }
  return summary;
}

export function createToolReceiptLedger(sessionId = makeSessionId()): ToolReceiptLedger {
  let receipts: readonly ToolReceipt[] = [];
  let sequence = 0;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((listener) => listener());

  return {
    getSessionId: () => sessionId,
    getSnapshot: () => receipts,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    append: (partial) => {
      sequence += 1;
      const receipt: ToolReceipt = {
        ...partial,
        id: `tool_receipt_${sequence}`,
        sequence,
      };
      receipts = [...receipts, receipt].slice(-MAX_TOOL_RECEIPTS);
      emit();
      return receipt;
    },
    clear: () => {
      if (receipts.length === 0) return;
      receipts = [];
      emit();
    },
  };
}

export function buildToolReceiptExport(
  ledger: ToolReceiptLedger,
  sessionMode: "saved" | "demo",
  generatedAt = new Date().toISOString(),
): ToolReceiptExport {
  const receipts = ledger.getSnapshot().map((receipt) => ({
    ...receipt,
    entityIds: [...receipt.entityIds],
    before: { ...receipt.before },
    after: { ...receipt.after },
    changed: { ...receipt.changed },
    evidence: receipt.evidence
      ? {
          ...receipt.evidence,
          comparedBranchIds: receipt.evidence.comparedBranchIds
            ? [...receipt.evidence.comparedBranchIds] as [string, string]
            : null,
          comparisonArrowCounts: receipt.evidence.comparisonArrowCounts
            ? { ...receipt.evidence.comparisonArrowCounts }
            : null,
        }
      : null,
    delegation: receipt.delegation ? { ...receipt.delegation } : null,
  }));
  return {
    schemaVersion: TOOL_RECEIPT_SCHEMA_VERSION,
    application: "Mechanism Canvas",
    sessionId: ledger.getSessionId(),
    sessionMode,
    generatedAt,
    privacy: "Contains allowlisted tool names, bounded semantic IDs, mechanism and Counterfactual Lab state stamps, outcomes, timings, closed-world validation/comparison evidence, and fixed delegation-session evidence. Raw tool inputs, outputs, branch rationales, prompts, freeform intent, and learner identity are omitted.",
    retention: `Session-only in this browser tab; capped at the latest ${MAX_TOOL_RECEIPTS} calls.`,
    summary: summarizeToolReceipts(receipts),
    receipts,
  };
}

export function serializeToolReceiptExport(record: ToolReceiptExport): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export const toolReceiptLedger = createToolReceiptLedger();
