import type { ProblemDefinition } from "../domain/types";
import { ammoniaAlkylationProblem } from "./ammonia-alkylation-01";
import {
  methoxideEthylSn2Problem,
  methoxideMethylammoniumProblem,
  methoxideMethylSn2Problem,
} from "./library-expansion";
import { protonTransferProblem } from "./proton-transfer-01";
import { assertProblemCatalog, createProductionProblemCatalog } from "./problem-validation";
import { sn2Problem } from "./sn2-01";

const previewProblems = [
  sn2Problem,
  protonTransferProblem,
  ammoniaAlkylationProblem,
  methoxideMethylSn2Problem,
  methoxideEthylSn2Problem,
  methoxideMethylammoniumProblem,
] as const;

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
