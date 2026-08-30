import type {
  LearningProfile,
  MechanismState,
  PracticeProblemProgress,
  PracticeSkillEvidence,
  PracticeSkillId,
  ProblemDefinition,
  ReasonCode,
} from "./types";

export interface PracticeWorkspaceSnapshot {
  problem: ProblemDefinition;
  state: MechanismState;
}

const SKILLS: ReadonlyArray<{
  id: PracticeSkillId;
  label: string;
  description: string;
  includesProblem: (problem: ProblemDefinition) => boolean;
  issueCodes: readonly ReasonCode[];
}> = [
  {
    id: "electron_sources",
    label: "Trace electron sources",
    description: "Start arrows at an authored lone pair or bond pair.",
    includesProblem: () => true,
    issueCodes: ["SOURCE_HAS_NO_ELECTRON_PAIR", "DUPLICATE_ELECTRON_SOURCE"],
  },
  {
    id: "concerted_steps",
    label: "Complete concerted steps",
    description: "Keep coupled bond-making and bond-breaking arrows in one checked bundle.",
    includesProblem: () => true,
    issueCodes: ["INCOMPLETE_CONCERTED_STEP", "EMPTY_DRAFT"],
  },
  {
    id: "bond_direction",
    label: "Direct bond electrons",
    description: "Send a breaking bond pair toward the atom that receives it.",
    includesProblem: () => true,
    issueCodes: ["WRONG_LEAVING_GROUP_DIRECTION", "WRONG_BOND_DIRECTION"],
  },
  {
    id: "sn2_pathways",
    label: "Recognize SN2 pathways",
    description: "Connect a nucleophile to the electrophilic carbon while the leaving group departs.",
    includesProblem: (problem) => problem.reactionFamily !== "proton_transfer",
    issueCodes: ["WRONG_REACTION_CENTER", "NOT_IN_AUTHORED_PATH"],
  },
  {
    id: "proton_transfer",
    label: "Map proton transfers",
    description: "Track the transferred hydrogen and return the original bond pair.",
    includesProblem: (problem) => problem.reactionFamily !== "SN2",
    issueCodes: ["WRONG_BOND_DIRECTION", "NOT_IN_AUTHORED_PATH"],
  },
];

function activeCommits(state: MechanismState): number {
  return state.history.filter((record) => record.undoneAt === null).length;
}

function progressFor(problem: ProblemDefinition, state: MechanismState): PracticeProblemProgress {
  const completedSteps = Math.min(activeCommits(state), problem.stepCount);
  const started = completedSteps > 0 || state.attemptCount > 0 || state.hintCount > 0;
  return {
    problemId: problem.id,
    title: problem.title,
    reactionFamily: problem.reactionFamily,
    difficulty: problem.difficulty,
    completedSteps,
    totalSteps: problem.stepCount,
    attemptCount: state.attemptCount,
    hintCount: state.hintCount,
    status:
      completedSteps === problem.stepCount ? "complete" : started ? "in_progress" : "not_started",
  };
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
}

function recommendationReason(progress: PracticeProblemProgress): string {
  if (progress.status === "in_progress") {
    return progress.completedSteps > 0
      ? `Continue from ${progress.completedSteps} of ${progress.totalSteps} completed steps.`
      : "Revisit this exercise using the evidence from earlier checks."
  }
  if (progress.reactionFamily === "proton_transfer") {
    return "Build proton-transfer evidence with a fresh mapped hydrogen."
  }
  if (progress.reactionFamily === "SN2_proton_transfer") {
    return "Connect substitution and proton-transfer reasoning in one mechanism."
  }
  return "Practice a fresh substitution context without changing the core electron-flow rules."
}

export function buildLearningProfile(
  snapshots: readonly PracticeWorkspaceSnapshot[],
): LearningProfile {
  const problems = snapshots.map(({ problem, state }) => progressFor(problem, state));
  const completedSteps = problems.reduce((total, item) => total + item.completedSteps, 0);
  const totalSteps = problems.reduce((total, item) => total + item.totalSteps, 0);

  const skills: PracticeSkillEvidence[] = SKILLS.map((skill) => {
    const relevant = snapshots.filter(({ problem }) => skill.includesProblem(problem));
    const relevantSteps = relevant.reduce((total, { problem }) => total + problem.stepCount, 0);
    const completed = relevant.reduce((total, { problem, state }) => {
      return total + Math.min(activeCommits(state), problem.stepCount);
    }, 0);
    const signals = relevant.flatMap(({ state }) => state.learningSignals);
    const issueCount = signals.reduce(
      (total, signal) =>
        total + signal.reasonCodes.filter((code) => skill.issueCodes.includes(code)).length,
      0,
    );
    const status =
      completed >= Math.min(2, relevantSteps)
        ? "demonstrated"
        : signals.length > 0 || completed > 0
          ? "building"
          : "not_started";
    return {
      id: skill.id,
      label: skill.label,
      description: skill.description,
      status,
      relevantSteps,
      completedSteps: completed,
      checkCount: signals.length,
      issueCount,
    };
  });

  const recommendations = [...problems]
    .filter((item) => item.status !== "complete")
    .sort((left, right) => {
      const leftStarted = left.status === "in_progress" ? 0 : 1;
      const rightStarted = right.status === "in_progress" ? 0 : 1;
      if (leftStarted !== rightStarted) return leftStarted - rightStarted;
      const leftLoad = left.attemptCount + left.hintCount * 2 - left.completedSteps * 3;
      const rightLoad = right.attemptCount + right.hintCount * 2 - right.completedSteps * 3;
      if (leftLoad !== rightLoad) return rightLoad - leftLoad;
      if (left.difficulty !== right.difficulty) return left.difficulty - right.difficulty;
      return left.problemId.localeCompare(right.problemId);
    })
    .slice(0, 3)
    .map((item) => ({ ...item, reason: recommendationReason(item) }));

  const revisionInput = snapshots
    .map(({ problem, state }) => {
      const signals = state.learningSignals.map((signal) =>
        [signal.stepId, signal.classification, ...signal.reasonCodes].join(":"),
      );
      return [
        problem.id,
        activeCommits(state),
        state.attemptCount,
        state.hintCount,
        ...signals,
      ].join("|");
    })
    .join("||");

  return {
    profileRevision: `profile_${stableHash(revisionInput)}`,
    completedSteps,
    totalSteps,
    completedProblems: problems.filter((item) => item.status === "complete").length,
    totalProblems: problems.length,
    skills,
    problems,
    recommendations,
  };
}
