import { describe, expect, it } from "vitest";
import { validateDraftStep } from "../domain/chemistry";
import type { ArrowDraft } from "../domain/types";
import { previewProblemCatalog, productionProblemCatalog } from "./catalog";
import {
  createProductionProblemCatalog,
  problemDefinitionErrors,
} from "./problem-validation";

describe("problem catalog integrity", () => {
  it("loads two structurally valid preview fixtures across two reaction families", () => {
    expect(previewProblemCatalog).toHaveLength(2);
    expect(new Set(previewProblemCatalog.map((problem) => problem.reactionFamily))).toEqual(
      new Set(["SN2", "proton_transfer"]),
    );
    for (const problem of previewProblemCatalog) {
      expect(problemDefinitionErrors(problem)).toEqual([]);
      expect(problem.negativeCases.length).toBeGreaterThanOrEqual(4);
      expect(problem.review.sources.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("checks every named negative case against its authored primary reason", () => {
    for (const problem of previewProblemCatalog) {
      for (const negativeCase of problem.negativeCases) {
        const arrows: ArrowDraft[] = negativeCase.arrows.map((arrow, index) => ({
          id: `${negativeCase.id}_${index + 1}`,
          source: arrow.source,
          target: arrow.target,
          actor: "human",
        }));
        const result = validateDraftStep(problem, problem.currentStateId, arrows, 0);
        expect(result.classification, negativeCase.id).toBe(
          negativeCase.expectedClassification,
        );
        expect(result.issues[0]?.code, negativeCase.id).toBe(
          negativeCase.expectedReasonCode,
        );
      }
    }
  });

  it("keeps draft fixtures out of the production registry", () => {
    expect(productionProblemCatalog).toEqual([]);
    expect(() => createProductionProblemCatalog(previewProblemCatalog)).toThrow(
      /rejected unverified fixtures/,
    );
  });
});
