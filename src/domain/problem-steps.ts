import type {
  CommitRecord,
  MechanismState,
  ProblemDefinition,
  ProblemStepDefinition,
} from "./types";

export function problemStepForState(
  problem: ProblemDefinition,
  stateId: string,
): ProblemStepDefinition | null {
  return problem.steps.find((step) => step.fromStateId === stateId) ?? null;
}

export function problemStepIndex(problem: ProblemDefinition, stateId: string): number {
  const index = problem.steps.findIndex((step) => step.fromStateId === stateId);
  return index >= 0 ? index : problem.steps.length;
}

export function reachableHistoryStateIds(
  problem: ProblemDefinition,
  history: CommitRecord[],
): string[] {
  const reachable = new Set<string>([problem.currentStateId]);
  for (const record of history) {
    if (record.undoneAt !== null) continue;
    reachable.add(record.fromStateId);
    reachable.add(record.toStateId);
  }
  return Object.keys(problem.states).filter((stateId) => reachable.has(stateId));
}

export function visibleStateId(state: MechanismState): string {
  return state.historyViewStateId ?? state.currentStateId;
}
