import { validateDraftStep } from "../domain/chemistry";
import type {
  AgentDraftProposal,
  ArrowDraft,
  ProposedArrow,
  ValidationResult,
} from "../domain/types";
import {
  MAX_PROPOSAL_ARROWS,
  MAX_PROPOSAL_RATIONALE_LENGTH,
  type MechanismStore,
} from "../store/mechanism-store";

export type HypothesisLabStatus = "active" | "recommended" | "drifted";

export interface HypothesisBranch {
  id: string;
  label: string;
  arrows: ProposedArrow[];
  rationale: string;
  validation: ValidationResult | null;
}

export interface HypothesisComparison {
  leftBranchId: string;
  rightBranchId: string;
  sharedArrows: ProposedArrow[];
  leftOnlyArrows: ProposedArrow[];
  rightOnlyArrows: ProposedArrow[];
  summary: string;
}

export interface HypothesisLab {
  id: string;
  status: HypothesisLabStatus;
  problemId: string;
  problemTitle: string;
  stateId: string;
  stateLabel: string;
  baseMechanismRevision: number;
  baseDraftArrows: ArrowDraft[];
  labRevision: number;
  branches: HypothesisBranch[];
  comparison: HypothesisComparison | null;
  recommendedBranchId: string | null;
  agentProposalId: string | null;
  startedAt: string;
  driftReason: string | null;
}

export type HypothesisLabErrorCode =
  | "HYPOTHESIS_LAB_INACTIVE"
  | "HYPOTHESIS_LAB_DRIFTED"
  | "HYPOTHESIS_LAB_STALE"
  | "HYPOTHESIS_BRANCH_NOT_FOUND"
  | "HYPOTHESIS_BRANCH_EMPTY"
  | "HYPOTHESIS_CHECK_REQUIRED"
  | "HYPOTHESIS_NOT_VALID"
  | "HYPOTHESIS_RECOMMENDATION_BLOCKED"
  | "HYPOTHESIS_INPUT_INVALID";

export type HypothesisLabResult<T = undefined> =
  | { ok: true; value?: T }
  | { ok: false; error: { code: HypothesisLabErrorCode; message: string } };

export interface SetHypothesisBranchInput {
  branchId: string;
  arrows: ProposedArrow[];
  rationale: string;
  expectedLabRevision: number;
}

export interface CheckHypothesisBranchInput {
  branchId: string;
  expectedLabRevision: number;
}

export interface CompareHypothesisBranchesInput {
  leftBranchId: string;
  rightBranchId: string;
  expectedLabRevision: number;
}

export interface RecommendHypothesisBranchInput {
  branchId: string;
  rationale: string;
  expectedLabRevision: number;
  expectedMechanismRevision: number;
}

export interface HypothesisLabManager {
  getSnapshot: () => HypothesisLab | null;
  subscribe: (listener: () => void) => () => void;
  start: (branchCount: 2 | 3) => HypothesisLab;
  end: () => HypothesisLab | null;
  setBranch: (input: SetHypothesisBranchInput) => HypothesisLabResult<HypothesisBranch>;
  checkBranch: (
    input: CheckHypothesisBranchInput,
  ) => HypothesisLabResult<HypothesisBranch>;
  compareBranches: (
    input: CompareHypothesisBranchesInput,
  ) => HypothesisLabResult<HypothesisComparison>;
  recommendBranch: (
    input: RecommendHypothesisBranchInput,
  ) => HypothesisLabResult<AgentDraftProposal>;
  destroy: () => void;
}

export const HYPOTHESIS_LAB_CONTROL_TOOL_NAME = "get_hypothesis_lab" as const;

export const HYPOTHESIS_LAB_WORK_TOOL_NAMES = [
  "set_hypothesis_branch",
  "check_hypothesis_branch",
  "compare_hypothesis_branches",
  "recommend_hypothesis_branch",
] as const;

export const HYPOTHESIS_LAB_TOOL_NAMES = [
  HYPOTHESIS_LAB_CONTROL_TOOL_NAME,
  ...HYPOTHESIS_LAB_WORK_TOOL_NAMES,
] as const;

export const MAX_HYPOTHESIS_RATIONALE_LENGTH = 240;

function cloneArrow(arrow: ProposedArrow): ProposedArrow {
  return {
    source: { ...arrow.source },
    target: { ...arrow.target },
  };
}

function arrowKey(arrow: ProposedArrow): string {
  return `${arrow.source.kind}:${arrow.source.entityId}->${arrow.target.entityId}`;
}

function sameSource(left: ProposedArrow["source"], right: ProposedArrow["source"]): boolean {
  return left.kind === right.kind && left.entityId === right.entityId;
}

function labError<T>(code: HypothesisLabErrorCode, message: string): HypothesisLabResult<T> {
  return { ok: false, error: { code, message } };
}

function branchLabel(index: number): string {
  return `Path ${String.fromCharCode(65 + index)}`;
}

function createBranches(count: 2 | 3): HypothesisBranch[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `hypothesis_${String.fromCharCode(97 + index)}`,
    label: branchLabel(index),
    arrows: [],
    rationale: "",
    validation: null,
  }));
}

function scopeMatches(store: MechanismStore, lab: HypothesisLab): boolean {
  const state = store.getState();
  return (
    state.problemId === lab.problemId &&
    state.currentStateId === lab.stateId &&
    state.mechanismRevision === lab.baseMechanismRevision
  );
}

function driftMessage(store: MechanismStore, lab: HypothesisLab): string {
  const state = store.getState();
  if (state.problemId !== lab.problemId) {
    return "The learner opened a different exercise after starting this lab.";
  }
  if (state.currentStateId !== lab.stateId) {
    return "The committed mechanism moved to a different state after this lab started.";
  }
  return "The learner's main draft or mechanism revision changed after this lab started.";
}

function branchDrafts(lab: HypothesisLab, branch: HypothesisBranch): ArrowDraft[] {
  return [
    ...lab.baseDraftArrows.map((arrow) => ({
      ...arrow,
      source: { ...arrow.source },
      target: { ...arrow.target },
    })),
    ...branch.arrows.map((arrow, index) => ({
      id: `${branch.id}_arrow_${index + 1}`,
      source: { ...arrow.source },
      target: { ...arrow.target },
      actor: "agent" as const,
    })),
  ];
}

export function hypothesisLabSurfaceSignature(lab: HypothesisLab | null): string {
  return lab ? `${lab.id}:${lab.status}` : "no_hypothesis_lab";
}

export function activeHypothesisToolNames(lab: HypothesisLab | null): string[] {
  if (!lab) return [];
  return lab.status === "active"
    ? [...HYPOTHESIS_LAB_TOOL_NAMES]
    : [HYPOTHESIS_LAB_CONTROL_TOOL_NAME];
}

export function createHypothesisLabManager(store: MechanismStore): HypothesisLabManager {
  let lab: HypothesisLab | null = null;
  let nextSequence = 1;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const markDriftedIfNeeded = () => {
    if (!lab || lab.status !== "active" || scopeMatches(store, lab)) return;
    lab = {
      ...lab,
      status: "drifted",
      driftReason: driftMessage(store, lab),
    };
    notify();
  };

  const requireActive = <T>(expectedLabRevision: number): HypothesisLabResult<T> | null => {
    markDriftedIfNeeded();
    if (!lab) {
      return labError(
        "HYPOTHESIS_LAB_INACTIVE",
        "No Counterfactual Lab is open. The learner must start one in the visible page.",
      );
    }
    if (lab.status === "drifted") {
      return labError(
        "HYPOTHESIS_LAB_DRIFTED",
        lab.driftReason ?? "The main mechanism changed outside this lab.",
      );
    }
    if (lab.status === "recommended") {
      return labError(
        "HYPOTHESIS_RECOMMENDATION_BLOCKED",
        "This lab already staged its checked recommendation. The learner must review or end it.",
      );
    }
    if (expectedLabRevision !== lab.labRevision) {
      return labError(
        "HYPOTHESIS_LAB_STALE",
        `The lab is at revision ${lab.labRevision}. Read get_hypothesis_lab before changing a branch.`,
      );
    }
    return null;
  };

  const findBranch = <T>(branchId: string): HypothesisLabResult<T> | HypothesisBranch => {
    const branch = lab?.branches.find((candidate) => candidate.id === branchId);
    return branch ?? labError(
      "HYPOTHESIS_BRANCH_NOT_FOUND",
      `Branch ${branchId} is not available in this lab.`,
    );
  };

  const unsubscribeStore = store.subscribe(markDriftedIfNeeded);

  return {
    getSnapshot: () => lab,

    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    start: (branchCount) => {
      if (lab) throw new Error("End the current Counterfactual Lab before starting another.");
      if (branchCount !== 2 && branchCount !== 3) {
        throw new Error("A Counterfactual Lab must contain two or three branches.");
      }
      const state = store.getState();
      const problem = store.getProblem();
      if (state.currentStateId === problem.completedStateId) {
        throw new Error("Undo the completed mechanism before exploring another next step.");
      }
      if (state.agentProposal) {
        throw new Error("Resolve the current agent proposal before starting a Counterfactual Lab.");
      }
      lab = {
        id: `hypothesis_lab_${nextSequence}`,
        status: "active",
        problemId: state.problemId,
        problemTitle: problem.title,
        stateId: state.currentStateId,
        stateLabel: problem.states[state.currentStateId].label,
        baseMechanismRevision: state.mechanismRevision,
        baseDraftArrows: state.draftArrows.map((arrow) => ({
          ...arrow,
          source: { ...arrow.source },
          target: { ...arrow.target },
        })),
        labRevision: 0,
        branches: createBranches(branchCount),
        comparison: null,
        recommendedBranchId: null,
        agentProposalId: null,
        startedAt: new Date().toISOString(),
        driftReason: null,
      };
      nextSequence += 1;
      notify();
      return lab;
    },

    end: () => {
      const ended = lab;
      lab = null;
      notify();
      return ended;
    },

    setBranch: ({ branchId, arrows, rationale, expectedLabRevision }) => {
      const guard = requireActive<HypothesisBranch>(expectedLabRevision);
      if (guard) return guard;
      const branch = findBranch<HypothesisBranch>(branchId);
      if ("ok" in branch) return branch;
      if (arrows.length < 1 || arrows.length > MAX_PROPOSAL_ARROWS) {
        return labError(
          "HYPOTHESIS_INPUT_INVALID",
          `Set between 1 and ${MAX_PROPOSAL_ARROWS} arrows on a hypothesis branch.`,
        );
      }
      const normalizedRationale = rationale.trim();
      if (
        normalizedRationale.length < 1 ||
        normalizedRationale.length > MAX_HYPOTHESIS_RATIONALE_LENGTH
      ) {
        return labError(
          "HYPOTHESIS_INPUT_INVALID",
          `Give the branch a rationale from 1 to ${MAX_HYPOTHESIS_RATIONALE_LENGTH} characters.`,
        );
      }

      const molecule = store.getProblem().states[lab!.stateId];
      const seenSources: ProposedArrow["source"][] = [];
      for (const arrow of arrows) {
        const sourceExists = arrow.source.kind === "bond"
          ? molecule.bonds.some((bond) => bond.id === arrow.source.entityId)
          : molecule.lonePairSites.some((site) => site.id === arrow.source.entityId);
        if (!sourceExists) {
          return labError(
            "HYPOTHESIS_INPUT_INVALID",
            `Electron source ${arrow.source.entityId} is not present in the scoped structure.`,
          );
        }
        if (!molecule.atoms.some((atom) => atom.id === arrow.target.entityId)) {
          return labError(
            "HYPOTHESIS_INPUT_INVALID",
            `Target atom ${arrow.target.entityId} is not present in the scoped structure.`,
          );
        }
        if (
          seenSources.some((source) => sameSource(source, arrow.source)) ||
          lab!.baseDraftArrows.some((draft) => sameSource(draft.source, arrow.source))
        ) {
          return labError(
            "HYPOTHESIS_INPUT_INVALID",
            `Electron source ${arrow.source.entityId} is already moved in this scoped draft.`,
          );
        }
        seenSources.push(arrow.source);
      }

      const nextBranch: HypothesisBranch = {
        ...branch,
        arrows: arrows.map(cloneArrow),
        rationale: normalizedRationale,
        validation: null,
      };
      lab = {
        ...lab!,
        labRevision: lab!.labRevision + 1,
        branches: lab!.branches.map((candidate) =>
          candidate.id === branch.id ? nextBranch : candidate),
        comparison: null,
        recommendedBranchId: null,
        agentProposalId: null,
      };
      notify();
      return { ok: true, value: nextBranch };
    },

    checkBranch: ({ branchId, expectedLabRevision }) => {
      const guard = requireActive<HypothesisBranch>(expectedLabRevision);
      if (guard) return guard;
      const branch = findBranch<HypothesisBranch>(branchId);
      if ("ok" in branch) return branch;
      if (branch.arrows.length === 0) {
        return labError(
          "HYPOTHESIS_BRANCH_EMPTY",
          `Set ${branch.label} before asking the deterministic validator to check it.`,
        );
      }
      const validation = validateDraftStep(
        store.getProblem(),
        lab!.stateId,
        branchDrafts(lab!, branch),
        lab!.baseMechanismRevision,
      );
      const nextBranch: HypothesisBranch = { ...branch, validation };
      lab = {
        ...lab!,
        labRevision: lab!.labRevision + 1,
        branches: lab!.branches.map((candidate) =>
          candidate.id === branch.id ? nextBranch : candidate),
        comparison: null,
      };
      notify();
      return { ok: true, value: nextBranch };
    },

    compareBranches: ({ leftBranchId, rightBranchId, expectedLabRevision }) => {
      const guard = requireActive<HypothesisComparison>(expectedLabRevision);
      if (guard) return guard;
      if (leftBranchId === rightBranchId) {
        return labError(
          "HYPOTHESIS_INPUT_INVALID",
          "Choose two different hypothesis branches to compare.",
        );
      }
      const left = findBranch<HypothesisComparison>(leftBranchId);
      if ("ok" in left) return left;
      const right = findBranch<HypothesisComparison>(rightBranchId);
      if ("ok" in right) return right;
      if (!left.validation || !right.validation) {
        return labError(
          "HYPOTHESIS_CHECK_REQUIRED",
          "Check both branches before comparing their evidence.",
        );
      }

      const leftKeys = new Set(left.arrows.map(arrowKey));
      const rightKeys = new Set(right.arrows.map(arrowKey));
      const sharedArrows = left.arrows.filter((arrow) => rightKeys.has(arrowKey(arrow)));
      const leftOnlyArrows = left.arrows.filter((arrow) => !rightKeys.has(arrowKey(arrow)));
      const rightOnlyArrows = right.arrows.filter((arrow) => !leftKeys.has(arrowKey(arrow)));
      const comparison: HypothesisComparison = {
        leftBranchId,
        rightBranchId,
        sharedArrows: sharedArrows.map(cloneArrow),
        leftOnlyArrows: leftOnlyArrows.map(cloneArrow),
        rightOnlyArrows: rightOnlyArrows.map(cloneArrow),
        summary: `${left.label} is ${left.validation.classification}; ${right.label} is ${right.validation.classification}. ${sharedArrows.length} shared, ${leftOnlyArrows.length} unique to ${left.label}, and ${rightOnlyArrows.length} unique to ${right.label}.`,
      };
      lab = {
        ...lab!,
        labRevision: lab!.labRevision + 1,
        comparison,
      };
      notify();
      return { ok: true, value: comparison };
    },

    recommendBranch: ({
      branchId,
      rationale,
      expectedLabRevision,
      expectedMechanismRevision,
    }) => {
      const guard = requireActive<AgentDraftProposal>(expectedLabRevision);
      if (guard) return guard;
      const branch = findBranch<AgentDraftProposal>(branchId);
      if ("ok" in branch) return branch;
      if (!branch.validation) {
        return labError(
          "HYPOTHESIS_CHECK_REQUIRED",
          `Check ${branch.label} before recommending it.`,
        );
      }
      if (branch.validation.classification !== "valid") {
        return labError(
          "HYPOTHESIS_NOT_VALID",
          `${branch.label} is ${branch.validation.classification}, so it cannot become a learner-review proposal.`,
        );
      }
      const normalizedRationale = rationale.trim();
      if (
        normalizedRationale.length < 1 ||
        normalizedRationale.length > MAX_PROPOSAL_RATIONALE_LENGTH
      ) {
        return labError(
          "HYPOTHESIS_INPUT_INVALID",
          `Give the learner a recommendation from 1 to ${MAX_PROPOSAL_RATIONALE_LENGTH} characters.`,
        );
      }
      if (expectedMechanismRevision !== lab!.baseMechanismRevision) {
        return labError(
          "HYPOTHESIS_LAB_STALE",
          `The lab is bound to mechanism revision ${lab!.baseMechanismRevision}.`,
        );
      }
      if (store.getState().agentProposal) {
        return labError(
          "HYPOTHESIS_RECOMMENDATION_BLOCKED",
          "Resolve the current agent proposal before recommending a hypothesis branch.",
        );
      }

      const proposal = store.stageAgentProposal({
        arrows: branch.arrows.map(cloneArrow),
        rationale: normalizedRationale,
        expectedRevision: expectedMechanismRevision,
      });
      if (!proposal.ok || !proposal.value) {
        return labError(
          "HYPOTHESIS_RECOMMENDATION_BLOCKED",
          proposal.error?.message ?? "The checked branch could not be staged for learner review.",
        );
      }
      lab = {
        ...lab!,
        status: "recommended",
        labRevision: lab!.labRevision + 1,
        recommendedBranchId: branch.id,
        agentProposalId: proposal.value.id,
      };
      notify();
      return { ok: true, value: proposal.value };
    },

    destroy: () => {
      unsubscribeStore();
      listeners.clear();
      lab = null;
    },
  };
}
