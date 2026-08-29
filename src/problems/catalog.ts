import type { ProblemDefinition } from "../domain/types";
import { ammoniaAlkylationProblem } from "./ammonia-alkylation-01";
import { protonTransferProblem } from "./proton-transfer-01";
import { assertProblemCatalog, createProductionProblemCatalog } from "./problem-validation";
import { sn2Problem } from "./sn2-01";

const previewProblems = [sn2Problem, protonTransferProblem, ammoniaAlkylationProblem] as const;

assertProblemCatalog(previewProblems);

export const previewProblemCatalog: readonly ProblemDefinition[] = Object.freeze([
  ...previewProblems,
]);

export const productionProblemCatalog = createProductionProblemCatalog(
  previewProblemCatalog.filter((problem) => problem.review.status === "verified"),
);

export function findProblem(
  catalog: readonly ProblemDefinition[],
  problemId: string,
): ProblemDefinition | undefined {
  return catalog.find((problem) => problem.id === problemId);
}
