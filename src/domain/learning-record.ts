import { describeArrow } from "./chemistry";
import { problemStepForState } from "./problem-steps";
import type { MechanismState, ProblemDefinition } from "./types";

export const LEARNING_RECORD_SCHEMA_VERSION = 1;

export type LearningRecordSessionMode = "saved" | "demo";

export interface LearningRecordExport {
  schema: "mechanism-canvas.learning-record";
  version: typeof LEARNING_RECORD_SCHEMA_VERSION;
  exportedAt: string;
  session: {
    mode: LearningRecordSessionMode;
    persistence: string;
    scope: "active exercise only";
  };
  problem: {
    id: string;
    title: string;
    reactionFamily: ProblemDefinition["reactionFamily"];
    objective: string;
    reviewStatus: ProblemDefinition["review"]["status"];
    stepCount: number;
  };
  status: {
    currentStateId: string;
    currentStateLabel: string;
    complete: boolean;
    mechanismRevision: number;
    activeStep: { id: string; title: string; index: number } | null;
  };
  metrics: {
    attempts: number;
    hintsRequested: number;
    currentStepHighestHintLevel: number | null;
    activeCommits: number;
    reversedCommits: number;
    reflections: number;
  };
  currentGraph: {
    id: string;
    label: string;
    atoms: MechanismStateGraph["atoms"];
    bonds: MechanismStateGraph["bonds"];
    lonePairSites: MechanismStateGraph["lonePairSites"];
  };
  draftArrows: Array<{
    id: string;
    source: MechanismState["draftArrows"][number]["source"];
    target: MechanismState["draftArrows"][number]["target"];
    actor: MechanismState["draftArrows"][number]["actor"];
    description: string;
  }>;
  latestCheck: {
    classification: NonNullable<MechanismState["latestValidation"]>["classification"];
    summary: string;
    issues: NonNullable<MechanismState["latestValidation"]>["issues"];
    mechanismRevision: number;
  } | null;
  commits: Array<{
    id: string;
    stepId: string | null;
    stepTitle: string;
    fromStateId: string;
    fromStateLabel: string;
    toStateId: string;
    toStateLabel: string;
    actor: MechanismState["history"][number]["actor"];
    committedAt: string;
    undoneAt: string | null;
    reflection: string | null;
    reflectionUpdatedAt: string | null;
    performedArrowBundle: Array<{
      source: MechanismState["history"][number]["arrowBundle"][number]["source"];
      target: MechanismState["history"][number]["arrowBundle"][number]["target"];
      actor: MechanismState["history"][number]["arrowBundle"][number]["actor"];
      description: string;
    }>;
  }>;
  activity: MechanismState["activity"];
  privacy: {
    localOnly: true;
    includesDedicatedIdentityFields: false;
    excludes: string[];
    note: string;
  };
}

type MechanismStateGraph = ProblemDefinition["states"][string];

export function buildLearningRecord(
  problem: ProblemDefinition,
  state: MechanismState,
  sessionMode: LearningRecordSessionMode,
  exportedAt = new Date().toISOString(),
): LearningRecordExport {
  const molecule = problem.states[state.currentStateId];
  const activeStep = problemStepForState(problem, state.currentStateId);
  const activeStepIndex = activeStep ? problem.steps.indexOf(activeStep) : -1;
  const activeCommits = state.history.filter((record) => record.undoneAt === null).length;
  const reversedCommits = state.history.length - activeCommits;

  return {
    schema: "mechanism-canvas.learning-record",
    version: LEARNING_RECORD_SCHEMA_VERSION,
    exportedAt,
    session: {
      mode: sessionMode,
      persistence:
        sessionMode === "demo"
          ? "memory only; resets on refresh"
          : "local browser storage",
      scope: "active exercise only",
    },
    problem: {
      id: problem.id,
      title: problem.title,
      reactionFamily: problem.reactionFamily,
      objective: problem.objective,
      reviewStatus: problem.review.status,
      stepCount: problem.stepCount,
    },
    status: {
      currentStateId: state.currentStateId,
      currentStateLabel: molecule.label,
      complete: state.currentStateId === problem.completedStateId,
      mechanismRevision: state.mechanismRevision,
      activeStep:
        activeStep && activeStepIndex >= 0
          ? { id: activeStep.id, title: activeStep.title, index: activeStepIndex + 1 }
          : null,
    },
    metrics: {
      attempts: state.attemptCount,
      hintsRequested: state.hintCount,
      currentStepHighestHintLevel: activeStep ? state.highestScaffoldLevel : null,
      activeCommits,
      reversedCommits,
      reflections: state.history.filter((record) => Boolean(record.reflection)).length,
    },
    currentGraph: {
      id: molecule.id,
      label: molecule.label,
      atoms: molecule.atoms.map((atom) => ({
        ...atom,
        position: { ...atom.position },
      })),
      bonds: molecule.bonds.map((bond) => ({
        ...bond,
        atomIds: [...bond.atomIds] as [string, string],
      })),
      lonePairSites: molecule.lonePairSites.map((site) => ({ ...site })),
    },
    draftArrows: state.draftArrows.map((arrow) => ({
      id: arrow.id,
      source: { ...arrow.source },
      target: { ...arrow.target },
      actor: arrow.actor,
      description: describeArrow(molecule, arrow),
    })),
    latestCheck: state.latestValidation
      ? {
          classification: state.latestValidation.classification,
          summary: state.latestValidation.summary,
          issues: state.latestValidation.issues.map((issue) => ({
            ...issue,
            focusEntityIds: [...issue.focusEntityIds],
          })),
          mechanismRevision: state.latestValidation.mechanismRevision,
        }
      : null,
    commits: state.history.map((record) => {
      const step = problem.steps.find(
        (candidate) =>
          candidate.fromStateId === record.fromStateId &&
          candidate.toStateId === record.toStateId,
      );
      const fromState = problem.states[record.fromStateId];
      const toState = problem.states[record.toStateId];
      return {
        id: record.id,
        stepId: step?.id ?? null,
        stepTitle: step?.title ?? "Committed mechanism step",
        fromStateId: record.fromStateId,
        fromStateLabel: fromState.label,
        toStateId: record.toStateId,
        toStateLabel: toState.label,
        actor: record.actor,
        committedAt: record.committedAt,
        undoneAt: record.undoneAt,
        reflection: record.reflection,
        reflectionUpdatedAt: record.reflectionUpdatedAt,
        performedArrowBundle: record.arrowBundle.map((arrow) => ({
          source: { ...arrow.source },
          target: { ...arrow.target },
          actor: arrow.actor,
          description: describeArrow(fromState, arrow),
        })),
      };
    }),
    activity: state.activity.map((event) => ({
      ...event,
      entityIds: [...event.entityIds],
    })),
    privacy: {
      localOnly: true,
      includesDedicatedIdentityFields: false,
      excludes: [
        "learner name, email, course, and account identifiers",
        "authored accepted bundles and unreached state graphs",
        "pending agent proposal and its rationale",
        "validation IDs and commit authority",
        "browser storage outside the active exercise",
      ],
      note:
        "This file is generated locally and is not uploaded by Mechanism Canvas. A freeform reflection can contain text the learner entered, so review it before sharing.",
    },
  };
}

export function serializeLearningRecord(record: LearningRecordExport): string {
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function learningRecordFilename(problemId: string, exportedAt: string): string {
  const safeProblemId = problemId.replace(/[^a-zA-Z0-9_-]+/g, "-");
  const date = exportedAt.slice(0, 10);
  return `mechanism-canvas-${safeProblemId}-learning-record-${date}.json`;
}
