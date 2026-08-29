import { describe, expect, it } from "vitest";
import { previewProblemCatalog } from "../problems/catalog";
import {
  COMPARISON_REACTION_LINE_Y,
  comparisonComponentAtomGroups,
  comparisonComponentBounds,
  comparisonMoleculeLayout,
} from "./comparison-molecule-layout";
import { snapshotLabelPlacement, snapshotPairPosition } from "./molecule-snapshot-geometry";

function statePairs() {
  return previewProblemCatalog.flatMap((problem) =>
    problem.steps.map((step) => [
      problem.states[step.fromStateId],
      problem.states[step.toStateId],
    ] as const),
  );
}

describe("comparison molecule layout", () => {
  it("aligns the heavy-atom anchor of every disconnected species to one reaction line", () => {
    for (const pair of statePairs()) {
      const { states } = comparisonMoleculeLayout(pair);
      for (const state of states) {
        for (const atomIds of comparisonComponentAtomGroups(state)) {
          const atoms = atomIds.map((atomId) => state.atoms.find((atom) => atom.id === atomId)!);
          const heavyAtoms = atoms.filter((atom) => atom.element !== "H");
          const anchors = heavyAtoms.length > 0 ? heavyAtoms : atoms;
          const anchorY = anchors.reduce((sum, atom) => sum + atom.position.y, 0) / anchors.length;
          expect(anchorY, `${state.id}/${atomIds.join(",")}`).toBeCloseTo(
            COMPARISON_REACTION_LINE_Y,
          );
        }
      }
    }
  });

  it("derives exactly one centered plus sign between each pair of species", () => {
    for (const pair of statePairs()) {
      const { states } = comparisonMoleculeLayout(pair);
      for (const state of states) {
        const bounds = comparisonComponentBounds(state, states);
        expect(state.separators).toHaveLength(Math.max(0, bounds.length - 1));
        for (const [index, separator] of (state.separators ?? []).entries()) {
          expect(separator.y).toBe(COMPARISON_REACTION_LINE_Y);
          expect(separator.x).toBeCloseTo((bounds[index].maxX + bounds[index + 1].minX) / 2);
          expect(separator.x - bounds[index].maxX).toBeGreaterThanOrEqual(28);
          expect(bounds[index + 1].minX - separator.x).toBeGreaterThanOrEqual(28);
        }
      }
    }
  });

  it("keeps every rendered feature inside the fixed, shared comparison viewport", () => {
    for (const pair of statePairs()) {
      const layout = comparisonMoleculeLayout(pair);
      for (const state of layout.states) {
        for (const atom of state.atoms) {
          const label = snapshotLabelPlacement(layout.states, atom);
          expect(atom.position.x - 35, `${state.id}/${atom.label}/left`).toBeGreaterThanOrEqual(0);
          expect(atom.position.x + 35, `${state.id}/${atom.label}/right`).toBeLessThanOrEqual(
            layout.viewBox.width,
          );
          expect(atom.position.y - 35, `${state.id}/${atom.label}/top`).toBeGreaterThanOrEqual(0);
          expect(atom.position.y + 64, `${state.id}/${atom.label}/bottom`).toBeLessThanOrEqual(
            layout.viewBox.height,
          );
          expect(label.x, `${state.id}/${atom.label}/map-x`).toBeGreaterThan(0);
          expect(label.x, `${state.id}/${atom.label}/map-x`).toBeLessThan(layout.viewBox.width);
          expect(label.y, `${state.id}/${atom.label}/map-y`).toBeGreaterThan(0);
          expect(label.y, `${state.id}/${atom.label}/map-y`).toBeLessThan(layout.viewBox.height);
        }
        for (const site of state.lonePairSites) {
          const pairPosition = snapshotPairPosition(state, site.id)!;
          expect(pairPosition.x, `${state.id}/${site.id}/x`).toBeGreaterThan(0);
          expect(pairPosition.x, `${state.id}/${site.id}/x`).toBeLessThan(layout.viewBox.width);
          expect(pairPosition.y, `${state.id}/${site.id}/y`).toBeGreaterThan(0);
          expect(pairPosition.y, `${state.id}/${site.id}/y`).toBeLessThan(layout.viewBox.height);
        }
      }
    }
  });

  it("does not mutate authored exercise coordinates or separators", () => {
    for (const pair of statePairs()) {
      const authored = JSON.stringify(pair);
      comparisonMoleculeLayout(pair);
      expect(JSON.stringify(pair)).toBe(authored);
    }
  });
});
