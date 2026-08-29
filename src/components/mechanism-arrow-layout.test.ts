import { describe, expect, it } from "vitest";
import { ammoniaAlkylationProblem } from "../problems/ammonia-alkylation-01";
import { comparisonMoleculeLayout } from "./comparison-molecule-layout";
import { comparisonReplayArrowRoutes } from "./mechanism-arrow-layout";

describe("comparison replay arrow layout", () => {
  it("lifts long cross-species electron flow above intervening molecules", () => {
    const before = ammoniaAlkylationProblem.states.methylammonium_intermediate;
    const after = ammoniaAlkylationProblem.states.amine_products;
    const layout = comparisonMoleculeLayout([before, after]);
    const routes = comparisonReplayArrowRoutes(
      layout.states[0],
      ammoniaAlkylationProblem.steps[1].acceptedBundles[0],
    );

    expect(routes.get(0)?.archY).toBe(72);
    expect(routes.get(1)?.archY).toBeUndefined();
  });
});
