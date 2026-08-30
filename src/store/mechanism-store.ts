import {
  assertExpectedRevision,
  describeArrow,
  describeEntity,
  draftSignature,
  validateDraftStep,
} from "../domain/chemistry";
import { buildLearningProfile } from "../domain/practice-compass";
import type {
  Actor,
  AgentDraftProposal,
  ActivityEvent,
  ArrowDraft,
  CommandResult,
  ElectronSource,
  ElectronTarget,
  LearningProfile,
  LearningSignal,
  MechanismState,
  PracticePlanProposal,
  ProblemDefinition,
  ProblemStepDefinition,
  ProposedArrow,
  ValidationResult,
} from "../domain/types";
import {
  problemStepForState,
  reachableHistoryStateIds,
  visibleStateId,
} from "../domain/problem-steps";
import { findProblem, previewProblemCatalog } from "../problems/catalog";
import { sn2Problem } from "../problems/sn2-01";

const STORAGE_KEY = "mechanism-canvas:workspace:v5";
const PREVIOUS_STORAGE_KEYS = [
  "mechanism-canvas:workspace:v4",
  "mechanism-canvas:workspace:v3",
  "mechanism-canvas:workspace:v2",
] as const;
const LEGACY_STORAGE_KEY = "mechanism-canvas:workspace:v1";
export const MAX_REFLECTION_LENGTH = 1200;
export const MAX_PROPOSAL_RATIONALE_LENGTH = 400;
export const MAX_PROPOSAL_ARROWS = 4;
export const MAX_PRACTICE_PLAN_PROBLEMS = 3;
export const MAX_PRACTICE_PLAN_RATIONALE_LENGTH = 400;

interface PersistedProblemWorkspace {
  currentStateId: string;
  draftArrows: ArrowDraft[];
  agentProposal?: AgentDraftProposal | null;
  mechanismRevision: number;
  activitySequence: number;
  activity: MechanismState["activity"];
  history: MechanismState["history"];
  focusEntityIds: string[];
  highestScaffoldLevel: MechanismState["highestScaffoldLevel"];
  visibleScaffoldLevel?: MechanismState["visibleScaffoldLevel"];
  attemptCount: number;
  hintCount: number;
  learningSignals?: LearningSignal[];
}

interface PersistedCatalogWorkspace {
  version: 5;
  activeProblemId: string;
  workspaces: Record<string, PersistedProblemWorkspace>;
  practicePlanProposal?: PracticePlanProposal | null;
}

interface LegacyPersistedWorkspace extends PersistedProblemWorkspace {
  version: 1;
  problemId: string;
}

export interface AddArrowInput {
  source: ElectronSource;
  target: ElectronTarget;
  actor: Extract<Actor, "human" | "agent">;
  expectedRevision?: number;
}

export interface StageAgentProposalInput {
  arrows: ProposedArrow[];
  rationale: string;
  expectedRevision?: number;
}

export interface StagePracticePlanInput {
  problemIds: string[];
  rationale: string;
  expectedProfileRevision: string;
}

export interface MechanismStore {
  getState: () => MechanismState;
  getProblem: () => ProblemDefinition;
  getProblems: () => readonly ProblemDefinition[];
  getLearningProfile: () => LearningProfile;
  getPracticePlanProposal: () => PracticePlanProposal | null;
  subscribe: (listener: () => void) => () => void;
  switchProblem: (
    problemId: string,
    actor: Extract<Actor, "human" | "agent">,
    expectedRevision?: number,
  ) => CommandResult;
  selectSource: (source: ElectronSource) => CommandResult;
  cancelSelection: () => void;
  addDraftArrow: (input: AddArrowInput) => CommandResult<ArrowDraft>;
  stageAgentProposal: (
    input: StageAgentProposalInput,
  ) => CommandResult<AgentDraftProposal>;
  acceptAgentProposal: (proposalId: string) => CommandResult<ArrowDraft[]>;
  declineAgentProposal: (proposalId: string) => CommandResult;
  stagePracticePlan: (input: StagePracticePlanInput) => CommandResult<PracticePlanProposal>;
  acceptPracticePlan: (proposalId: string) => CommandResult;
  declinePracticePlan: (proposalId: string) => CommandResult;
  removeDraftArrow: (
    arrowId: string,
    actor: Extract<Actor, "human" | "agent">,
    expectedRevision?: number,
  ) => CommandResult;
  clearDraft: (actor: Extract<Actor, "human" | "agent">) => CommandResult;
  checkDraftStep: (
    actor: Extract<Actor, "human" | "agent">,
    expectedRevision?: number,
  ) => CommandResult<ValidationResult>;
  commitCheckedStep: (
    validationId: string,
    actor: Extract<Actor, "human" | "agent">,
    expectedRevision?: number,
  ) => CommandResult;
  undoLastCommit: (
    actor: Extract<Actor, "human" | "agent">,
    expectedRevision?: number,
  ) => CommandResult;
  requestScaffold: (
    level: 1 | 2 | 3 | 4,
    actor: Extract<Actor, "human" | "agent">,
  ) => CommandResult<ProblemStepDefinition["scaffold"][number]>;
  dismissScaffold: () => void;
  viewHistoryState: (
    stateId: string | null,
    actor: Extract<Actor, "human" | "agent">,
  ) => CommandResult;
  saveCommitReflection: (commitId: string, reflection: string) => CommandResult;
  focusEntities: (entityIds: string[], actor: Extract<Actor, "human" | "agent">) => CommandResult;
  resetProblem: (
    actor: Extract<Actor, "human" | "agent">,
    expectedRevision?: number,
  ) => CommandResult;
}

function baseState(problem: ProblemDefinition): MechanismState {
  return {
    problemId: problem.id,
    currentStateId: problem.currentStateId,
    draftArrows: [],
    agentProposal: null,
    selection: { source: null },
    latestValidation: null,
    mechanismRevision: 0,
    activitySequence: 0,
    activity: [],
    history: [],
    historyViewStateId: null,
    focusEntityIds: [],
    highestScaffoldLevel: 0,
    visibleScaffoldLevel: 0,
    attemptCount: 0,
    hintCount: 0,
    learningSignals: [],
    hydrated: true,
  };
}

function isPersistedProblemWorkspace(
  value: unknown,
  problem: ProblemDefinition,
): value is PersistedProblemWorkspace {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PersistedProblemWorkspace>;
  return (
    typeof candidate.currentStateId === "string" &&
    candidate.currentStateId in problem.states &&
    Array.isArray(candidate.draftArrows) &&
    typeof candidate.mechanismRevision === "number" &&
    typeof candidate.activitySequence === "number" &&
    Array.isArray(candidate.activity) &&
    Array.isArray(candidate.history) &&
    Array.isArray(candidate.focusEntityIds) &&
    typeof candidate.highestScaffoldLevel === "number" &&
    typeof candidate.attemptCount === "number" &&
    typeof candidate.hintCount === "number"
  );
}

function isPersistedAgentProposal(
  value: unknown,
  problem: ProblemDefinition,
): value is AgentDraftProposal {
  if (!value || typeof value !== "object") return false;
  const proposal = value as Partial<AgentDraftProposal>;
  if (
    typeof proposal.id !== "string" ||
    proposal.problemId !== problem.id ||
    typeof proposal.stateId !== "string" ||
    !(proposal.stateId in problem.states) ||
    typeof proposal.baseRevision !== "number" ||
    !Number.isSafeInteger(proposal.baseRevision) ||
    proposal.baseRevision < 0 ||
    typeof proposal.rationale !== "string" ||
    proposal.rationale.trim().length < 1 ||
    proposal.rationale.length > MAX_PROPOSAL_RATIONALE_LENGTH ||
    typeof proposal.createdAt !== "string" ||
    !Array.isArray(proposal.arrows) ||
    proposal.arrows.length < 1 ||
    proposal.arrows.length > MAX_PROPOSAL_ARROWS
  ) {
    return false;
  }
  const molecule = problem.states[proposal.stateId];
  const sources = new Set<string>();
  return proposal.arrows.every((arrow) => {
    if (!arrow || typeof arrow !== "object") return false;
    const source = arrow.source;
    const target = arrow.target;
    if (
      !source ||
      (source.kind !== "bond" && source.kind !== "lone_pair") ||
      typeof source.entityId !== "string" ||
      !target ||
      target.kind !== "atom" ||
      typeof target.entityId !== "string"
    ) {
      return false;
    }
    const sourceKey = `${source.kind}:${source.entityId}`;
    if (sources.has(sourceKey)) return false;
    sources.add(sourceKey);
    const sourceExists =
      source.kind === "bond"
        ? molecule.bonds.some((bond) => bond.id === source.entityId)
        : molecule.lonePairSites.some((site) => site.id === source.entityId);
    return sourceExists && molecule.atoms.some((atom) => atom.id === target.entityId);
  });
}

function isPersistedLearningSignal(
  value: unknown,
  problem: ProblemDefinition,
): value is LearningSignal {
  if (!value || typeof value !== "object") return false;
  const signal = value as Partial<LearningSignal>;
  return (
    typeof signal.id === "string" &&
    signal.problemId === problem.id &&
    typeof signal.stepId === "string" &&
    problem.steps.some((step) => step.id === signal.stepId) &&
    typeof signal.checkedAt === "string" &&
    typeof signal.mechanismRevision === "number" &&
    Number.isSafeInteger(signal.mechanismRevision) &&
    signal.mechanismRevision >= 0 &&
    typeof signal.draftArrowCount === "number" &&
    Number.isSafeInteger(signal.draftArrowCount) &&
    signal.draftArrowCount >= 0 &&
    (signal.classification === "valid" ||
      signal.classification === "incomplete" ||
      signal.classification === "invalid_invariant" ||
      signal.classification === "not_accepted_path" ||
      signal.classification === "invalid_input") &&
    Array.isArray(signal.reasonCodes) &&
    signal.reasonCodes.every((code) => typeof code === "string")
  );
}

function restoreProblemState(
  problem: ProblemDefinition,
  persisted: PersistedProblemWorkspace,
): MechanismState {
  return {
    ...baseState(problem),
    currentStateId: persisted.currentStateId,
    draftArrows: persisted.draftArrows,
    agentProposal: isPersistedAgentProposal(persisted.agentProposal, problem)
      ? persisted.agentProposal
      : null,
    mechanismRevision: persisted.mechanismRevision,
    activitySequence: persisted.activitySequence,
    activity: persisted.activity.slice(-80),
    history: persisted.history.map((record) => {
      const reflection =
        typeof record.reflection === "string"
          ? record.reflection.trim().slice(0, MAX_REFLECTION_LENGTH)
          : "";
      return {
        ...record,
        reflection: reflection || null,
        reflectionUpdatedAt:
          reflection && typeof record.reflectionUpdatedAt === "string"
            ? record.reflectionUpdatedAt
            : null,
      };
    }),
    focusEntityIds: persisted.focusEntityIds,
    highestScaffoldLevel: persisted.highestScaffoldLevel,
    visibleScaffoldLevel: persisted.visibleScaffoldLevel ?? 0,
    attemptCount: persisted.attemptCount,
    hintCount: persisted.hintCount,
    learningSignals: Array.isArray(persisted.learningSignals)
      ? persisted.learningSignals.filter((signal) => isPersistedLearningSignal(signal, problem)).slice(-120)
      : [],
    latestValidation: null,
    selection: { source: null },
  };
}

function toPersistedProblem(state: MechanismState): PersistedProblemWorkspace {
  return {
    currentStateId: state.currentStateId,
    draftArrows: state.draftArrows,
    agentProposal: state.agentProposal,
    mechanismRevision: state.mechanismRevision,
    activitySequence: state.activitySequence,
    activity: state.activity.slice(-80),
    history: state.history,
    focusEntityIds: state.focusEntityIds,
    highestScaffoldLevel: state.highestScaffoldLevel,
    visibleScaffoldLevel: state.visibleScaffoldLevel,
    attemptCount: state.attemptCount,
    hintCount: state.hintCount,
    learningSignals: state.learningSignals.slice(-120),
  };
}

function isPersistedPracticePlan(
  value: unknown,
  catalog: readonly ProblemDefinition[],
): value is PracticePlanProposal {
  if (!value || typeof value !== "object") return false;
  const proposal = value as Partial<PracticePlanProposal>;
  if (
    typeof proposal.id !== "string" ||
    typeof proposal.baseProfileRevision !== "string" ||
    typeof proposal.rationale !== "string" ||
    proposal.rationale.trim().length < 1 ||
    proposal.rationale.length > MAX_PRACTICE_PLAN_RATIONALE_LENGTH ||
    typeof proposal.createdAt !== "string" ||
    !Array.isArray(proposal.problemIds) ||
    proposal.problemIds.length < 1 ||
    proposal.problemIds.length > MAX_PRACTICE_PLAN_PROBLEMS ||
    new Set(proposal.problemIds).size !== proposal.problemIds.length
  ) {
    return false;
  }
  return proposal.problemIds.every(
    (problemId) =>
      typeof problemId === "string" && catalog.some((problem) => problem.id === problemId),
  );
}

function hydrateCatalog(
  initialProblem: ProblemDefinition,
  catalog: readonly ProblemDefinition[],
  storage: Storage | null,
): {
  problem: ProblemDefinition;
  state: MechanismState;
  workspaces: Map<string, MechanismState>;
  practicePlanProposal: PracticePlanProposal | null;
} {
  const fallback = {
    problem: initialProblem,
    state: baseState(initialProblem),
    workspaces: new Map<string, MechanismState>(),
    practicePlanProposal: null,
  };
  if (!storage) return fallback;

  try {
    const raw =
      storage.getItem(STORAGE_KEY) ??
      PREVIOUS_STORAGE_KEYS.map((key) => storage.getItem(key)).find(Boolean) ??
      null;
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedCatalogWorkspace> & { version?: number };
      if (
        (parsed.version === 5 || parsed.version === 4 || parsed.version === 3 || parsed.version === 2) &&
        parsed.workspaces &&
        typeof parsed.workspaces === "object"
      ) {
        const workspaces = new Map<string, MechanismState>();
        for (const problem of catalog) {
          const persisted = parsed.workspaces[problem.id];
          if (isPersistedProblemWorkspace(persisted, problem)) {
            workspaces.set(problem.id, restoreProblemState(problem, persisted));
          }
        }
        const activeProblem =
          typeof parsed.activeProblemId === "string"
            ? findProblem(catalog, parsed.activeProblemId) ?? initialProblem
            : initialProblem;
        return {
          problem: activeProblem,
          state: workspaces.get(activeProblem.id) ?? baseState(activeProblem),
          workspaces,
          practicePlanProposal: isPersistedPracticePlan(parsed.practicePlanProposal, catalog)
            ? parsed.practicePlanProposal
            : null,
        };
      }
    }

    const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return fallback;
    const legacy = JSON.parse(legacyRaw) as Partial<LegacyPersistedWorkspace>;
    if (
      legacy.version !== 1 ||
      legacy.problemId !== initialProblem.id ||
      !isPersistedProblemWorkspace(legacy, initialProblem)
    ) {
      return fallback;
    }
    const restored = restoreProblemState(initialProblem, legacy);
    return {
      problem: initialProblem,
      state: restored,
      workspaces: new Map([[initialProblem.id, restored]]),
      practicePlanProposal: null,
    };
  } catch {
    return fallback;
  }
}

function persist(
  activeProblem: ProblemDefinition,
  state: MechanismState,
  workspaces: Map<string, MechanismState>,
  practicePlanProposal: PracticePlanProposal | null,
  storage: Storage | null,
): void {
  if (!storage) return;
  workspaces.set(activeProblem.id, {
    ...state,
    latestValidation: null,
    selection: { source: null },
  });
  const serializedWorkspaces = Object.fromEntries(
    [...workspaces.entries()].map(([problemId, workspace]) => [
      problemId,
      toPersistedProblem(workspace),
    ]),
  );
  const snapshot: PersistedCatalogWorkspace = {
    version: 5,
    activeProblemId: activeProblem.id,
    workspaces: serializedWorkspaces,
    practicePlanProposal,
  };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Persistence is progressive enhancement; the in-memory workspace remains usable.
  }
}

function isElectronSourcePresent(problem: ProblemDefinition, state: MechanismState, source: ElectronSource): boolean {
  const molecule = problem.states[state.currentStateId];
  if (source.kind === "bond") return molecule.bonds.some((bond) => bond.id === source.entityId);
  return molecule.lonePairSites.some((site) => site.id === source.entityId);
}

function isAtomPresent(problem: ProblemDefinition, state: MechanismState, atomId: string): boolean {
  return problem.states[state.currentStateId].atoms.some((atom) => atom.id === atomId);
}

function sameElectronSource(left: ElectronSource, right: ElectronSource): boolean {
  return left.kind === right.kind && left.entityId === right.entityId;
}

function proposalEntityIds(arrows: readonly ProposedArrow[]): string[] {
  return [...new Set(arrows.flatMap((arrow) => [arrow.source.entityId, arrow.target.entityId]))];
}

export function createMechanismStore(
  initialProblem: ProblemDefinition = sn2Problem,
  storage: Storage | null = typeof window !== "undefined" ? window.localStorage : null,
  availableProblems: readonly ProblemDefinition[] = previewProblemCatalog,
): MechanismStore {
  const catalog = availableProblems.some((problem) => problem.id === initialProblem.id)
    ? availableProblems
    : [initialProblem, ...availableProblems];
  const hydrated = hydrateCatalog(initialProblem, catalog, storage);
  let problem = hydrated.problem;
  let state = hydrated.state;
  const workspaces = hydrated.workspaces;
  let practicePlanProposal = hydrated.practicePlanProposal;
  const listeners = new Set<() => void>();

  const emit = () => {
    persist(problem, state, workspaces, practicePlanProposal, storage);
    listeners.forEach((listener) => listener());
  };

  const update = (next: MechanismState) => {
    state = next;
    emit();
  };

  const withEvent = (
    current: MechanismState,
    partial: Partial<MechanismState>,
    actor: Actor,
    kind: ActivityEvent["kind"],
    summary: string,
    entityIds: string[] = [],
    outcome: ActivityEvent["outcome"] = "neutral",
  ): MechanismState => {
    const sequence = current.activitySequence + 1;
    const event: ActivityEvent = {
      id: `activity_${sequence}`,
      sequence,
      actor,
      kind,
      summary,
      entityIds,
      timestamp: new Date().toISOString(),
      outcome,
    };
    return {
      ...current,
      ...partial,
      activitySequence: sequence,
      activity: [...current.activity, event].slice(-80),
    };
  };

  const learningProfile = (): LearningProfile =>
    buildLearningProfile(
      catalog.map((catalogProblem) => ({
        problem: catalogProblem,
        state:
          catalogProblem.id === problem.id
            ? state
            : workspaces.get(catalogProblem.id) ?? baseState(catalogProblem),
      })),
    );

  return {
    getState: () => state,
    getProblem: () => problem,
    getProblems: () => catalog,
    getLearningProfile: learningProfile,
    getPracticePlanProposal: () => practicePlanProposal,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    switchProblem: (problemId, actor, expectedRevision) => {
      const revisionCheck = assertExpectedRevision(state.mechanismRevision, expectedRevision);
      if (!revisionCheck.ok) return revisionCheck;
      if (problemId === problem.id) return { ok: true };
      const nextProblem = findProblem(catalog, problemId);
      if (!nextProblem) {
        return {
          ok: false,
          error: {
            code: "TARGET_NOT_SUPPORTED",
            message: `Problem ${problemId} is not available in this catalog.`,
          },
        };
      }

      workspaces.set(problem.id, {
        ...state,
        latestValidation: null,
        selection: { source: null },
      });
      const previousTitle = problem.title;
      problem = nextProblem;
      const restored = workspaces.get(problem.id) ?? baseState(problem);
      state = withEvent(
        restored,
        {
          latestValidation: null,
          selection: { source: null },
          focusEntityIds: [],
          visibleScaffoldLevel: 0,
          historyViewStateId: null,
          mechanismRevision: restored.mechanismRevision + 1,
        },
        actor,
        "problem_switched",
        `Switched from ${previousTitle} to ${problem.title}.`,
      );
      emit();
      return { ok: true };
    },
    selectSource: (source) => {
      if (!isElectronSourcePresent(problem, state, source)) {
        return {
          ok: false,
          error: {
            code: "SOURCE_HAS_NO_ELECTRON_PAIR",
            message: "That electron source is not present in the current mechanism state.",
          },
        };
      }
      update({
        ...state,
        selection: { source },
        focusEntityIds: [source.entityId],
        visibleScaffoldLevel: 0,
        historyViewStateId: null,
      });
      return { ok: true };
    },
    cancelSelection: () => {
      update({ ...state, selection: { source: null } });
    },
    addDraftArrow: ({ source, target, actor, expectedRevision }) => {
      const revisionCheck = assertExpectedRevision<ArrowDraft>(state.mechanismRevision, expectedRevision);
      if (!revisionCheck.ok) return revisionCheck;
      if (!isElectronSourcePresent(problem, state, source)) {
        return {
          ok: false,
          error: {
            code: "SOURCE_HAS_NO_ELECTRON_PAIR",
            message: "That electron source is not present in the current structure.",
          },
        };
      }
      if (!isAtomPresent(problem, state, target.entityId)) {
        return {
          ok: false,
          error: { code: "TARGET_NOT_SUPPORTED", message: "The target atom is not in the current structure." },
        };
      }

      const nextRevision = state.mechanismRevision + 1;
      const arrow: ArrowDraft = {
        id: `arrow_${nextRevision}_${state.draftArrows.length + 1}`,
        source,
        target,
        actor,
      };
      const molecule = problem.states[state.currentStateId];
      update(
        withEvent(
          state,
          {
            draftArrows: [...state.draftArrows, arrow],
            selection: { source: null },
            latestValidation: null,
            mechanismRevision: nextRevision,
            focusEntityIds: [source.entityId, target.entityId],
            visibleScaffoldLevel: 0,
            historyViewStateId: null,
          },
          actor,
          "arrow_added",
          `Added ${describeArrow(molecule, arrow)}.`,
          [source.entityId, target.entityId],
        ),
      );
      return { ok: true, value: arrow };
    },
    stageAgentProposal: ({ arrows, rationale, expectedRevision }) => {
      const revisionCheck = assertExpectedRevision<AgentDraftProposal>(
        state.mechanismRevision,
        expectedRevision,
      );
      if (!revisionCheck.ok) return revisionCheck;
      if (state.historyViewStateId !== null) {
        return {
          ok: false,
          error: {
            code: "STALE_STATE",
            message: "Return to the current mechanism state before staging a proposal.",
          },
        };
      }
      if (state.currentStateId === problem.completedStateId) {
        return {
          ok: false,
          error: {
            code: "TARGET_NOT_SUPPORTED",
            message: "This mechanism is complete, so there is no current draft to propose.",
          },
        };
      }
      if (arrows.length < 1 || arrows.length > MAX_PROPOSAL_ARROWS) {
        return {
          ok: false,
          error: {
            code: "TARGET_NOT_SUPPORTED",
            message: `A proposal must contain between 1 and ${MAX_PROPOSAL_ARROWS} arrows.`,
          },
        };
      }
      const normalizedRationale = rationale.trim();
      if (
        normalizedRationale.length < 1 ||
        normalizedRationale.length > MAX_PROPOSAL_RATIONALE_LENGTH
      ) {
        return {
          ok: false,
          error: {
            code: "TARGET_NOT_SUPPORTED",
            message: `Give the learner a rationale from 1 to ${MAX_PROPOSAL_RATIONALE_LENGTH} characters.`,
          },
        };
      }

      const seenSources: ElectronSource[] = [];
      for (const arrow of arrows) {
        if (!isElectronSourcePresent(problem, state, arrow.source)) {
          return {
            ok: false,
            error: {
              code: "SOURCE_HAS_NO_ELECTRON_PAIR",
              message: `Electron source ${arrow.source.entityId} is not present in the current structure.`,
            },
          };
        }
        if (!isAtomPresent(problem, state, arrow.target.entityId)) {
          return {
            ok: false,
            error: {
              code: "TARGET_NOT_SUPPORTED",
              message: `Target atom ${arrow.target.entityId} is not present in the current structure.`,
            },
          };
        }
        if (seenSources.some((source) => sameElectronSource(source, arrow.source))) {
          return {
            ok: false,
            error: {
              code: "DUPLICATE_ELECTRON_SOURCE",
              message: `A proposal can move electron source ${arrow.source.entityId} only once.`,
            },
          };
        }
        const existingArrow = state.draftArrows.find((draft) =>
          sameElectronSource(draft.source, arrow.source),
        );
        if (existingArrow) {
          const alreadyPresent = existingArrow.target.entityId === arrow.target.entityId;
          return {
            ok: false,
            error: {
              code: "DUPLICATE_ELECTRON_SOURCE",
              message: alreadyPresent
                ? `The draft already contains the proposed move from ${arrow.source.entityId}.`
                : `The draft already moves ${arrow.source.entityId} to a different target. Propose only compatible additions.`,
            },
          };
        }
        seenSources.push(arrow.source);
      }

      const proposal: AgentDraftProposal = {
        id: `proposal_${state.activitySequence + 1}`,
        problemId: problem.id,
        stateId: state.currentStateId,
        baseRevision: state.mechanismRevision,
        arrows: arrows.map((arrow) => ({
          source: { ...arrow.source },
          target: { ...arrow.target },
        })),
        rationale: normalizedRationale,
        createdAt: new Date().toISOString(),
      };
      update(
        withEvent(
          state,
          {
            agentProposal: proposal,
            focusEntityIds: proposalEntityIds(proposal.arrows),
            visibleScaffoldLevel: 0,
          },
          "agent",
          "proposal_staged",
          `Agent staged ${proposal.arrows.length} electron-flow ${proposal.arrows.length === 1 ? "arrow" : "arrows"} for learner review.`,
          proposalEntityIds(proposal.arrows),
        ),
      );
      return { ok: true, value: proposal };
    },
    acceptAgentProposal: (proposalId) => {
      const proposal = state.agentProposal;
      if (!proposal || proposal.id !== proposalId) {
        return {
          ok: false,
          error: {
            code: "STALE_STATE",
            message: "That agent proposal is no longer available.",
          },
        };
      }
      if (
        proposal.problemId !== problem.id ||
        proposal.stateId !== state.currentStateId ||
        proposal.baseRevision !== state.mechanismRevision ||
        state.historyViewStateId !== null ||
        !isPersistedAgentProposal(proposal, problem) ||
        proposal.arrows.some((arrow) =>
          state.draftArrows.some((draft) => sameElectronSource(draft.source, arrow.source)),
        )
      ) {
        return {
          ok: false,
          error: {
            code: "STALE_STATE",
            message: "The mechanism changed after this proposal was staged. Dismiss it and ask for a current proposal.",
          },
        };
      }

      const nextRevision = state.mechanismRevision + 1;
      const acceptedArrows: ArrowDraft[] = proposal.arrows.map((arrow, index) => ({
        id: `arrow_${nextRevision}_${state.draftArrows.length + index + 1}`,
        source: { ...arrow.source },
        target: { ...arrow.target },
        actor: "agent",
      }));
      update(
        withEvent(
          state,
          {
            draftArrows: [...state.draftArrows, ...acceptedArrows],
            agentProposal: null,
            selection: { source: null },
            latestValidation: null,
            mechanismRevision: nextRevision,
            focusEntityIds: proposalEntityIds(proposal.arrows),
            visibleScaffoldLevel: 0,
            historyViewStateId: null,
          },
          "human",
          "proposal_accepted",
          `Accepted ${acceptedArrows.length} agent-proposed ${acceptedArrows.length === 1 ? "arrow" : "arrows"} into the draft; deterministic checking is still required.`,
          proposalEntityIds(proposal.arrows),
        ),
      );
      return { ok: true, value: acceptedArrows };
    },
    declineAgentProposal: (proposalId) => {
      const proposal = state.agentProposal;
      if (!proposal || proposal.id !== proposalId) {
        return {
          ok: false,
          error: {
            code: "STALE_STATE",
            message: "That agent proposal is no longer available.",
          },
        };
      }
      update(
        withEvent(
          state,
          { agentProposal: null, focusEntityIds: [] },
          "human",
          "proposal_declined",
          "Declined the agent proposal; the draft and chemistry stayed unchanged.",
          proposalEntityIds(proposal.arrows),
        ),
      );
      return { ok: true };
    },
    stagePracticePlan: ({ problemIds, rationale, expectedProfileRevision }) => {
      const profile = learningProfile();
      if (expectedProfileRevision !== profile.profileRevision) {
        return {
          ok: false,
          error: {
            code: "STALE_STATE",
            message: "The learning evidence changed. Read the current profile before proposing a plan.",
          },
        };
      }
      const normalizedRationale = rationale.trim();
      const uniqueProblemIds = [...new Set(problemIds)];
      if (
        uniqueProblemIds.length !== problemIds.length ||
        problemIds.length < 1 ||
        problemIds.length > MAX_PRACTICE_PLAN_PROBLEMS ||
        problemIds.some((problemId) => !catalog.some((candidate) => candidate.id === problemId))
      ) {
        return {
          ok: false,
          error: {
            code: "TARGET_NOT_SUPPORTED",
            message: `Choose 1 to ${MAX_PRACTICE_PLAN_PROBLEMS} unique problem IDs from the learning profile.`,
          },
        };
      }
      if (
        normalizedRationale.length < 1 ||
        normalizedRationale.length > MAX_PRACTICE_PLAN_RATIONALE_LENGTH
      ) {
        return {
          ok: false,
          error: {
            code: "TARGET_NOT_SUPPORTED",
            message: `Give the learner a rationale from 1 to ${MAX_PRACTICE_PLAN_RATIONALE_LENGTH} characters.`,
          },
        };
      }
      const proposal: PracticePlanProposal = {
        id: `practice_plan_${state.activitySequence + 1}_${profile.profileRevision}`,
        baseProfileRevision: profile.profileRevision,
        problemIds: uniqueProblemIds,
        rationale: normalizedRationale,
        createdAt: new Date().toISOString(),
      };
      practicePlanProposal = proposal;
      update(
        withEvent(
          state,
          {},
          "agent",
          "practice_plan_staged",
          `Agent staged a ${proposal.problemIds.length}-exercise practice plan for learner review.`,
        ),
      );
      return { ok: true, value: proposal };
    },
    acceptPracticePlan: (proposalId) => {
      const proposal = practicePlanProposal;
      if (!proposal || proposal.id !== proposalId) {
        return {
          ok: false,
          error: { code: "STALE_STATE", message: "That practice plan is no longer available." },
        };
      }
      if (proposal.baseProfileRevision !== learningProfile().profileRevision) {
        return {
          ok: false,
          error: {
            code: "STALE_STATE",
            message: "The learning evidence changed after this plan was staged. Dismiss it and request a current plan.",
          },
        };
      }
      const nextProblem = findProblem(catalog, proposal.problemIds[0]);
      if (!nextProblem) {
        return {
          ok: false,
          error: { code: "TARGET_NOT_SUPPORTED", message: "The first planned exercise is unavailable." },
        };
      }
      if (nextProblem.id !== problem.id) {
        workspaces.set(problem.id, {
          ...state,
          latestValidation: null,
          selection: { source: null },
        });
        problem = nextProblem;
        const restored = workspaces.get(problem.id) ?? baseState(problem);
        state = withEvent(
          restored,
          {
            mechanismRevision: restored.mechanismRevision + 1,
            latestValidation: null,
            selection: { source: null },
            focusEntityIds: [],
            visibleScaffoldLevel: 0,
            historyViewStateId: null,
          },
          "human",
          "practice_plan_accepted",
          `Started the learner-approved practice plan with ${problem.title}.`,
        );
      } else {
        state = withEvent(
          state,
          {},
          "human",
          "practice_plan_accepted",
          `Started the learner-approved practice plan with ${problem.title}.`,
        );
      }
      practicePlanProposal = null;
      emit();
      return { ok: true };
    },
    declinePracticePlan: (proposalId) => {
      const proposal = practicePlanProposal;
      if (!proposal || proposal.id !== proposalId) {
        return {
          ok: false,
          error: { code: "STALE_STATE", message: "That practice plan is no longer available." },
        };
      }
      practicePlanProposal = null;
      update(
        withEvent(
          state,
          {},
          "human",
          "practice_plan_declined",
          "Dismissed the agent practice plan; exercise progress stayed unchanged.",
        ),
      );
      return { ok: true };
    },
    removeDraftArrow: (arrowId, actor, expectedRevision) => {
      const revisionCheck = assertExpectedRevision(state.mechanismRevision, expectedRevision);
      if (!revisionCheck.ok) return revisionCheck;
      const arrow = state.draftArrows.find((candidate) => candidate.id === arrowId);
      if (!arrow) {
        return { ok: false, error: { code: "STALE_STATE", message: "That draft arrow no longer exists." } };
      }
      update(
        withEvent(
          state,
          {
            draftArrows: state.draftArrows.filter((candidate) => candidate.id !== arrowId),
            latestValidation: null,
            mechanismRevision: state.mechanismRevision + 1,
            focusEntityIds: [],
            visibleScaffoldLevel: 0,
            historyViewStateId: null,
          },
          actor,
          "arrow_removed",
          `Removed draft arrow ${arrowId}.`,
          [arrow.source.entityId, arrow.target.entityId],
        ),
      );
      return { ok: true };
    },
    clearDraft: (actor) => {
      if (state.draftArrows.length === 0) return { ok: true };
      update(
        withEvent(
          state,
          {
            draftArrows: [],
            selection: { source: null },
            latestValidation: null,
            mechanismRevision: state.mechanismRevision + 1,
            focusEntityIds: [],
            visibleScaffoldLevel: 0,
            historyViewStateId: null,
          },
          actor,
          "draft_cleared",
          "Cleared the draft arrow bundle.",
        ),
      );
      return { ok: true };
    },
    checkDraftStep: (actor, expectedRevision) => {
      const revisionCheck = assertExpectedRevision<ValidationResult>(state.mechanismRevision, expectedRevision);
      if (!revisionCheck.ok) return revisionCheck;
      const result = validateDraftStep(
        problem,
        state.currentStateId,
        state.draftArrows,
        state.mechanismRevision,
      );
      const focusIds = result.issues.flatMap((validationIssue) => validationIssue.focusEntityIds);
      const activeStep = problemStepForState(problem, state.currentStateId);
      const learningSignal: LearningSignal | null = activeStep
        ? {
            id: `signal_${state.attemptCount + 1}_${state.mechanismRevision}`,
            problemId: problem.id,
            stepId: activeStep.id,
            checkedAt: new Date().toISOString(),
            mechanismRevision: state.mechanismRevision,
            draftArrowCount: state.draftArrows.length,
            classification: result.classification,
            reasonCodes: result.issues.map((issue) => issue.code),
          }
        : null;
      update(
        withEvent(
          state,
          {
            latestValidation: result,
            attemptCount: state.attemptCount + 1,
            learningSignals: learningSignal
              ? [...state.learningSignals, learningSignal].slice(-120)
              : state.learningSignals,
            focusEntityIds: [...new Set(focusIds)],
            historyViewStateId: null,
          },
          "validator",
          "step_checked",
          result.summary,
          focusIds,
          result.classification === "valid"
            ? "success"
            : result.classification === "incomplete"
              ? "warning"
              : "error",
        ),
      );
      return { ok: true, value: result };
    },
    commitCheckedStep: (validationId, actor, expectedRevision) => {
      const revisionCheck = assertExpectedRevision(state.mechanismRevision, expectedRevision);
      if (!revisionCheck.ok) return revisionCheck;
      const checked = state.latestValidation;
      const molecule = problem.states[state.currentStateId];
      const currentSignature = draftSignature(molecule, state.draftArrows);
      if (
        !checked ||
        checked.validationId !== validationId ||
        checked.classification !== "valid" ||
        checked.mechanismRevision !== state.mechanismRevision ||
        checked.draftSignature !== currentSignature ||
        !checked.nextStateId
      ) {
        return {
          ok: false,
          error: {
            code: "STALE_VALIDATION",
            message: "Check the current draft again before committing it.",
          },
        };
      }

      const committedAt = new Date().toISOString();
      const activeStep = problemStepForState(problem, state.currentStateId);
      if (!activeStep || activeStep.toStateId !== checked.nextStateId) {
        return {
          ok: false,
          error: {
            code: "STALE_VALIDATION",
            message: "The authored step changed. Check the current draft again before committing it.",
          },
        };
      }
      const record = {
        id: `commit_${state.history.length + 1}`,
        fromStateId: state.currentStateId,
        toStateId: checked.nextStateId,
        arrowBundle: state.draftArrows,
        validationId,
        actor,
        committedAt,
        undoneAt: null,
        reflection: null,
        reflectionUpdatedAt: null,
      };
      update(
        withEvent(
          state,
          {
            currentStateId: checked.nextStateId,
            draftArrows: [],
            selection: { source: null },
            latestValidation: null,
            mechanismRevision: state.mechanismRevision + 1,
            history: [...state.history, record],
            focusEntityIds: problem.states[checked.nextStateId].atoms.map((atom) => atom.id),
            historyViewStateId: null,
            highestScaffoldLevel: 0,
            visibleScaffoldLevel: 0,
          },
          actor,
          "step_committed",
          activeStep.feedback.commitActivitySummary,
          record.arrowBundle.flatMap((arrow) => [arrow.source.entityId, arrow.target.entityId]),
          "success",
        ),
      );
      return { ok: true };
    },
    undoLastCommit: (actor, expectedRevision) => {
      const revisionCheck = assertExpectedRevision(state.mechanismRevision, expectedRevision);
      if (!revisionCheck.ok) return revisionCheck;
      const recordIndex = state.history.findLastIndex((record) => record.undoneAt === null);
      if (recordIndex < 0) {
        return {
          ok: false,
          error: { code: "STALE_STATE", message: "There is no committed step to undo." },
        };
      }
      const record = state.history[recordIndex];
      if (state.currentStateId !== record.toStateId) {
        return {
          ok: false,
          error: { code: "STALE_STATE", message: "The mechanism has changed since that commit." },
        };
      }
      const nextHistory = state.history.map((candidate, index) =>
        index === recordIndex ? { ...candidate, undoneAt: new Date().toISOString() } : candidate,
      );
      update(
        withEvent(
          state,
          {
            currentStateId: record.fromStateId,
            draftArrows: [],
            selection: { source: null },
            latestValidation: null,
            mechanismRevision: state.mechanismRevision + 1,
            history: nextHistory,
            focusEntityIds: [],
            historyViewStateId: null,
            highestScaffoldLevel: 0,
            visibleScaffoldLevel: 0,
          },
          actor,
          "commit_undone",
          `Undid the last committed step and restored ${problem.states[record.fromStateId].label}.`,
        ),
      );
      return { ok: true };
    },
    requestScaffold: (level, actor) => {
      const step = problemStepForState(problem, state.currentStateId);
      const scaffold = step?.scaffold.find((entry) => entry.level === level);
      if (!scaffold) {
        return {
          ok: false,
          error: { code: "TARGET_NOT_SUPPORTED", message: "Scaffold level must be between 1 and 4." },
        };
      }
      update(
        withEvent(
          state,
          {
            highestScaffoldLevel: Math.max(state.highestScaffoldLevel, level) as 1 | 2 | 3 | 4,
            visibleScaffoldLevel: level,
            hintCount: state.hintCount + 1,
            focusEntityIds: scaffold.focusEntityIds,
            historyViewStateId: null,
          },
          actor,
          "scaffold_requested",
          `Opened scaffold ${level}: ${scaffold.title}.`,
          scaffold.focusEntityIds,
        ),
      );
      return { ok: true, value: scaffold };
    },
    dismissScaffold: () => {
      if (state.visibleScaffoldLevel === 0 && state.focusEntityIds.length === 0) return;
      update({
        ...state,
        visibleScaffoldLevel: 0,
        focusEntityIds: [],
      });
    },
    viewHistoryState: (stateId, actor) => {
      const nextView = stateId === null || stateId === state.currentStateId ? null : stateId;
      if (nextView === state.historyViewStateId) return { ok: true };
      const reachable = reachableHistoryStateIds(problem, state.history);
      if (nextView !== null && !reachable.includes(nextView)) {
        return {
          ok: false,
          error: {
            code: "TARGET_NOT_SUPPORTED",
            message: "That mechanism state has not been reached in this exercise.",
          },
        };
      }
      const nextStateId = nextView ?? state.currentStateId;
      update(
        withEvent(
          state,
          {
            historyViewStateId: nextView,
            selection: { source: null },
            focusEntityIds: [],
            visibleScaffoldLevel: 0,
          },
          actor,
          "history_state_viewed",
          nextView === null
            ? `Returned to the current state: ${problem.states[nextStateId].label}.`
            : `Viewed mechanism history: ${problem.states[nextStateId].label}.`,
          problem.states[nextStateId].atoms.map((atom) => atom.id),
        ),
      );
      return { ok: true };
    },
    saveCommitReflection: (commitId, reflection) => {
      const recordIndex = state.history.findIndex((record) => record.id === commitId);
      if (recordIndex < 0) {
        return {
          ok: false,
          error: {
            code: "TARGET_NOT_SUPPORTED",
            message: "That committed step is not part of this exercise record.",
          },
        };
      }
      const normalized = reflection.trim();
      if (normalized.length > MAX_REFLECTION_LENGTH) {
        return {
          ok: false,
          error: {
            code: "REFLECTION_TOO_LONG",
            message: `Keep the reflection to ${MAX_REFLECTION_LENGTH} characters or fewer.`,
          },
        };
      }
      const previous = state.history[recordIndex].reflection ?? "";
      if (normalized === previous) return { ok: true };

      const updatedAt = new Date().toISOString();
      const nextHistory = state.history.map((record, index) =>
        index === recordIndex
          ? {
              ...record,
              reflection: normalized || null,
              reflectionUpdatedAt: normalized ? updatedAt : null,
            }
          : record,
      );
      const step = problem.steps.find(
        (candidate) =>
          candidate.fromStateId === state.history[recordIndex].fromStateId &&
          candidate.toStateId === state.history[recordIndex].toStateId,
      );
      update(
        withEvent(
          state,
          { history: nextHistory },
          "human",
          normalized ? "reflection_saved" : "reflection_removed",
          normalized
            ? `Saved a learner reflection for ${step?.title ?? "a committed step"}.`
            : `Removed the learner reflection for ${step?.title ?? "a committed step"}.`,
        ),
      );
      return { ok: true };
    },
    focusEntities: (entityIds, actor) => {
      const molecule = problem.states[visibleStateId(state)];
      const allIds = new Set([
        ...molecule.atoms.map((atom) => atom.id),
        ...molecule.bonds.map((bond) => bond.id),
        ...molecule.lonePairSites.map((site) => site.id),
      ]);
      const invalid = entityIds.find((entityId) => !allIds.has(entityId));
      if (invalid) {
        return {
          ok: false,
          error: { code: "TARGET_NOT_SUPPORTED", message: `Entity ${invalid} is not in the current state.` },
        };
      }
      const summary = entityIds.length
        ? `Focused ${entityIds.map((entityId) => describeEntity(molecule, entityId)).join(", ")}.`
        : "Cleared entity focus.";
      update(
        withEvent(
          state,
          { focusEntityIds: [...new Set(entityIds)] },
          actor,
          "entities_focused",
          summary,
          entityIds,
        ),
      );
      return { ok: true };
    },
    resetProblem: (actor, expectedRevision) => {
      const revisionCheck = assertExpectedRevision(state.mechanismRevision, expectedRevision);
      if (!revisionCheck.ok) return revisionCheck;
      const reset = baseState(problem);
      update(
        withEvent(
          reset,
          { mechanismRevision: state.mechanismRevision + 1 },
          actor,
          "problem_reset",
          "Reset the exercise to its authored initial state.",
        ),
      );
      return { ok: true };
    },
  };
}
