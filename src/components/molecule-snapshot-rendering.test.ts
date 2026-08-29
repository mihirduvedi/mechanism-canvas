import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { compareMoleculeStates } from "../domain/mechanism-comparison";
import { ammoniaAlkylationProblem } from "../problems/ammonia-alkylation-01";
import { protonTransferProblem } from "../problems/proton-transfer-01";
import { sn2Problem } from "../problems/sn2-01";
import { MoleculeSnapshot } from "./MoleculeSnapshot";
import { comparisonMoleculeLayout } from "./comparison-molecule-layout";
import { snapshotViewBox } from "./molecule-snapshot-geometry";

const transitions = [
  {
    problem: sn2Problem,
    beforeStateId: "sn2_reactants",
    afterStateId: "sn2_products",
    arrows: sn2Problem.steps[0].acceptedBundles[0],
  },
  {
    problem: protonTransferProblem,
    beforeStateId: "proton_transfer_reactants",
    afterStateId: "proton_transfer_products",
    arrows: protonTransferProblem.steps[0].acceptedBundles[0],
  },
  {
    problem: ammoniaAlkylationProblem,
    beforeStateId: "amine_reactants",
    afterStateId: "methylammonium_intermediate",
    arrows: ammoniaAlkylationProblem.steps[0].acceptedBundles[0],
  },
  {
    problem: ammoniaAlkylationProblem,
    beforeStateId: "methylammonium_intermediate",
    afterStateId: "amine_products",
    arrows: ammoniaAlkylationProblem.steps[1].acceptedBundles[0],
  },
] as const;

function occurrenceCount(markup: string, needle: string): number {
  return markup.split(needle).length - 1;
}

describe("molecule snapshot rendering", () => {
  it("masks every bond endpoint behind the same atom target used by the drawable canvas", () => {
    for (const transition of transitions) {
      const before = transition.problem.states[transition.beforeStateId];
      const after = transition.problem.states[transition.afterStateId];
      const comparison = compareMoleculeStates(before, after);
      const markup = renderToStaticMarkup(
        createElement(MoleculeSnapshot, {
          molecule: before,
          labelStates: [before, after],
          comparison,
          side: "before",
          viewBox: snapshotViewBox([before, after]),
        }),
      );

      expect(
        occurrenceCount(markup, "atom-target snapshot-atom__change-ring"),
        `${transition.problem.id}/${transition.beforeStateId}`,
      ).toBe(before.atoms.length);
      expect(markup.indexOf("snapshot-bond__line")).toBeLessThan(
        markup.indexOf("atom-target snapshot-atom__change-ring"),
      );
    }
  });

  it("paints every performed replay arrow above the molecular graph", () => {
    for (const transition of transitions) {
      const before = transition.problem.states[transition.beforeStateId];
      const after = transition.problem.states[transition.afterStateId];
      const comparison = compareMoleculeStates(before, after);
      const markup = renderToStaticMarkup(
        createElement(MoleculeSnapshot, {
          molecule: before,
          labelStates: [before, after],
          comparison,
          side: "before",
          viewBox: snapshotViewBox([before, after]),
          replayArrows: transition.arrows,
          replayKey: 1,
        }),
      );

      expect(occurrenceCount(markup, "snapshot-replay-arrow__shaft")).toBe(
        transition.arrows.length,
      );
      expect(markup.indexOf("snapshot-replay")).toBeGreaterThan(
        markup.lastIndexOf("snapshot-atom"),
      );
    }
  });

  it("renders implicit hydrogens as a chemical symbol with a subordinate count", () => {
    for (const transition of transitions) {
      const authoredBefore = transition.problem.states[transition.beforeStateId];
      const authoredAfter = transition.problem.states[transition.afterStateId];
      const layout = comparisonMoleculeLayout([authoredBefore, authoredAfter]);
      const before = layout.states[0];
      const comparison = compareMoleculeStates(authoredBefore, authoredAfter);
      const markup = renderToStaticMarkup(
        createElement(MoleculeSnapshot, {
          molecule: before,
          labelStates: layout.states,
          comparison,
          side: "before",
          viewBox: layout.viewBox,
        }),
      );
      const expectedAnnotations = before.atoms.filter(
        (atom) => atom.implicitHydrogenCount > 0,
      ).length;
      expect(occurrenceCount(markup, "snapshot-implicit-hydrogen__symbol")).toBe(
        expectedAnnotations,
      );
      expect(occurrenceCount(markup, "snapshot-implicit-hydrogen__count")).toBe(
        expectedAnnotations,
      );
      expect(markup).not.toMatch(/>\dH</);
    }
  });
});
