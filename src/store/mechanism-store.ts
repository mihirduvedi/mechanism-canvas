import {
  assertExpectedRevision,
  describeArrow,
  describeEntity,
  draftSignature,
  validateDraftStep,
} from "../domain/chemistry";
import type {
  Actor,
  ActivityEvent,
  ArrowDraft,
  CommandResult,
  ElectronSource,
  ElectronTarget,
  MechanismState,
  ProblemDefinition,
  ValidationResult,
} from "../domain/types";
import { findProblem, previewProblemCatalog } from "../problems/catalog";
import { sn2Problem } from "../problems/sn2-01";

const STORAGE_KEY = "mechanism-canvas:workspace:v2";
const LEGACY_STORAGE_KEY = "mechanism-canvas:workspace:v1";

interface PersistedProblemWorkspace {
  currentStateId: string;
  draftArrows: ArrowDraft[];
  mechanismRevision: number;
  activitySequence: number;
  activity: MechanismState["activity"];
  history: MechanismState["history"];
  focusEntityIds: string[];
  highestScaffoldLevel: MechanismState["highestScaffoldLevel"];
  attemptCount: number;
  hintCount: number;
}

interface PersistedCatalogWorkspace {
  version: 2;
  activeProblemId: string;
  workspaces: Record<string, PersistedProblemWorkspace>;
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

export interface MechanismStore {
  getState: () => MechanismState;
  getProblem: () => ProblemDefinition;
  getProblems: () => readonly ProblemDefinition[];
  subscribe: (listener: () => void) => () => void;
  switchProblem: (
    problemId: string,
    actor: Extract<Actor, "human" | "agent">,
    expectedRevision?: number,
  ) => CommandResult;
  selectSource: (source: ElectronSource) => CommandResult;
  cancelSelection: () => void;
  addDraftArrow: (input: AddArrowInput) => CommandResult<ArrowDraft>;
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
  ) => CommandResult<ProblemDefinition["scaffold"][number]>;
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
    selection: { source: null },
    latestValidation: null,
    mechanismRevision: 0,
    activitySequence: 0,
    activity: [],
    history: [],
    focusEntityIds: [],
    highestScaffoldLevel: 0,
    attemptCount: 0,
    hintCount: 0,
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

function restoreProblemState(
  problem: ProblemDefinition,
  persisted: PersistedProblemWorkspace,
): MechanismState {
  return {
    ...baseState(problem),
    currentStateId: persisted.currentStateId,
    draftArrows: persisted.draftArrows,
    mechanismRevision: persisted.mechanismRevision,
    activitySequence: persisted.activitySequence,
    activity: persisted.activity.slice(-80),
    history: persisted.history,
    focusEntityIds: persisted.focusEntityIds,
    highestScaffoldLevel: persisted.highestScaffoldLevel,
    attemptCount: persisted.attemptCount,
    hintCount: persisted.hintCount,
    latestValidation: null,
    selection: { source: null },
  };
}

function toPersistedProblem(state: MechanismState): PersistedProblemWorkspace {
  return {
    currentStateId: state.currentStateId,
    draftArrows: state.draftArrows,
    mechanismRevision: state.mechanismRevision,
    activitySequence: state.activitySequence,
    activity: state.activity.slice(-80),
    history: state.history,
    focusEntityIds: state.focusEntityIds,
    highestScaffoldLevel: state.highestScaffoldLevel,
    attemptCount: state.attemptCount,
    hintCount: state.hintCount,
  };
}

function hydrateCatalog(
  initialProblem: ProblemDefinition,
  catalog: readonly ProblemDefinition[],
  storage: Storage | null,
): {
  problem: ProblemDefinition;
  state: MechanismState;
  workspaces: Map<string, MechanismState>;
} {
  const fallback = {
    problem: initialProblem,
    state: baseState(initialProblem),
    workspaces: new Map<string, MechanismState>(),
  };
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedCatalogWorkspace>;
      if (parsed.version === 2 && parsed.workspaces && typeof parsed.workspaces === "object") {
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
    };
  } catch {
    return fallback;
  }
}

function persist(
  activeProblem: ProblemDefinition,
  state: MechanismState,
  workspaces: Map<string, MechanismState>,
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
    version: 2,
    activeProblemId: activeProblem.id,
    workspaces: serializedWorkspaces,
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
  const listeners = new Set<() => void>();

  const emit = () => {
    persist(problem, state, workspaces, storage);
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
    };
    return {
      ...current,
      ...partial,
      activitySequence: sequence,
      activity: [...current.activity, event].slice(-80),
    };
  };

  return {
    getState: () => state,
    getProblem: () => problem,
    getProblems: () => catalog,
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
          },
          actor,
          "arrow_added",
          `Added ${describeArrow(molecule, arrow)}.`,
          [source.entityId, target.entityId],
        ),
      );
      return { ok: true, value: arrow };
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
      update(
        withEvent(
          state,
          {
            latestValidation: result,
            attemptCount: state.attemptCount + 1,
            focusEntityIds: [...new Set(focusIds)],
          },
          "validator",
          "step_checked",
          result.summary,
          focusIds,
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
      const record = {
        id: `commit_${state.history.length + 1}`,
        fromStateId: state.currentStateId,
        toStateId: checked.nextStateId,
        arrowBundle: state.draftArrows,
        validationId,
        actor,
        committedAt,
        undoneAt: null,
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
          },
          actor,
          "step_committed",
          problem.feedback.commitActivitySummary,
          record.arrowBundle.flatMap((arrow) => [arrow.source.entityId, arrow.target.entityId]),
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
          },
          actor,
          "commit_undone",
          "Undid the last committed step and restored the reactants.",
        ),
      );
      return { ok: true };
    },
    requestScaffold: (level, actor) => {
      const scaffold = problem.scaffold.find((entry) => entry.level === level);
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
            hintCount: state.hintCount + 1,
            focusEntityIds: scaffold.focusEntityIds,
          },
          actor,
          "scaffold_requested",
          `Opened scaffold ${level}: ${scaffold.title}.`,
          scaffold.focusEntityIds,
        ),
      );
      return { ok: true, value: scaffold };
    },
    focusEntities: (entityIds, actor) => {
      const molecule = problem.states[state.currentStateId];
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

export const mechanismStore = createMechanismStore();
