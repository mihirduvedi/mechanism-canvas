import { describe, expect, it } from "vitest";
import { previewProblemCatalog } from "../problems/catalog";
import {
  snapshotLabelPlacement,
  snapshotImplicitHydrogenPlacement,
  snapshotPairPosition,
  snapshotViewBox,
} from "./molecule-snapshot-geometry";

function distance(first: { x: number; y: number }, second: { x: number; y: number }): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

describe("molecule snapshot geometry", () => {
  it("keeps mapping labels clear of every lone-pair site", () => {
    for (const problem of previewProblemCatalog) {
      for (const state of Object.values(problem.states)) {
        for (const atom of state.atoms) {
          const label = snapshotLabelPlacement([state], atom);
          for (const site of state.lonePairSites.filter((candidate) => candidate.atomId === atom.id)) {
            const pair = snapshotPairPosition(state, site.id);
            expect(pair, `${problem.id}/${state.id}/${site.id}`).not.toBeNull();
            expect(distance(label, pair!), `${problem.id}/${state.id}/${atom.label}/${site.id}`).toBeGreaterThan(24);
          }
        }
      }
    }
  });

  it("moves implicit-hydrogen annotations away from lone pairs and atom-map labels", () => {
    for (const problem of previewProblemCatalog) {
      for (const step of problem.steps) {
        const states = [problem.states[step.fromStateId], problem.states[step.toStateId]];
        for (const state of states) {
          for (const atom of state.atoms.filter((candidate) => candidate.implicitHydrogenCount > 0)) {
            const annotation = snapshotImplicitHydrogenPlacement(states, atom);
            const mapLabel = snapshotLabelPlacement(states, atom);
            expect(
              distance(annotation, mapLabel),
              `${problem.id}/${state.id}/${atom.label}/map`,
            ).toBeGreaterThan(28);
            for (const site of state.lonePairSites.filter((candidate) => candidate.atomId === atom.id)) {
              const pair = snapshotPairPosition(state, site.id)!;
              expect(
                distance(annotation, pair),
                `${problem.id}/${state.id}/${atom.label}/${site.id}`,
              ).toBeGreaterThan(22);
            }
          }
        }
      }
    }
  });

  it("includes every rendered atom feature inside the shared comparison viewport", () => {
    for (const problem of previewProblemCatalog) {
      const viewport = snapshotViewBox(Object.values(problem.states));
      for (const state of Object.values(problem.states)) {
        for (const atom of state.atoms) {
          const label = snapshotLabelPlacement(Object.values(problem.states), atom);
          expect(label.x).toBeGreaterThan(viewport.x);
          expect(label.x).toBeLessThan(viewport.x + viewport.width);
          expect(label.y).toBeGreaterThan(viewport.y);
          expect(label.y).toBeLessThan(viewport.y + viewport.height);
          expect(atom.position.x - 34).toBeGreaterThan(viewport.x);
          expect(atom.position.x + 34).toBeLessThan(viewport.x + viewport.width);
          expect(atom.position.y - 34).toBeGreaterThan(viewport.y);
          expect(atom.position.y + 64).toBeLessThan(viewport.y + viewport.height);
          if (atom.implicitHydrogenCount > 0) {
            const annotation = snapshotImplicitHydrogenPlacement(Object.values(problem.states), atom);
            expect(annotation.x).toBeGreaterThan(viewport.x);
            expect(annotation.x).toBeLessThan(viewport.x + viewport.width);
            expect(annotation.y).toBeGreaterThan(viewport.y);
            expect(annotation.y).toBeLessThan(viewport.y + viewport.height);
          }
        }
      }
    }
  });

  it("keeps each mapping label on the same side of its atom across a comparison", () => {
    for (const problem of previewProblemCatalog) {
      const states = Object.values(problem.states);
      const sharedAtomIds = states
        .flatMap((state) => state.atoms.map((atom) => atom.id))
        .filter((atomId, index, all) => all.indexOf(atomId) === index);

      for (const atomId of sharedAtomIds) {
        const placements = states.flatMap((state) => {
          const atom = state.atoms.find((candidate) => candidate.id === atomId);
          if (!atom) return [];
          const label = snapshotLabelPlacement(states, atom);
          return [
            Math.atan2(label.y - atom.position.y, label.x - atom.position.x),
          ];
        });
        expect(new Set(placements.map((angle) => angle.toFixed(6))).size).toBeLessThanOrEqual(1);
      }
    }
  });
});
