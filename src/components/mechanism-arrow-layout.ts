import type { ArrowDraft, ElectronSource, MoleculeState, Point } from "../domain/types";
import {
  buildMechanismArrowRoutes,
  preferredMechanismArrowTargetAngle,
  type MechanismArrowRoute,
} from "./mechanism-arrow-routing";

export function electronPairPosition(state: MoleculeState, siteId: string): Point | null {
  const site = state.lonePairSites.find((candidate) => candidate.id === siteId);
  const atom = state.atoms.find((candidate) => candidate.id === site?.atomId);
  if (!site || !atom) return null;
  const radians = (site.angle * Math.PI) / 180;
  return {
    x: atom.position.x + Math.cos(radians) * 38,
    y: atom.position.y + Math.sin(radians) * 38,
  };
}

export function bondMidpoint(state: MoleculeState, bondId: string): Point | null {
  const bond = state.bonds.find((candidate) => candidate.id === bondId);
  if (!bond) return null;
  const first = state.atoms.find((atom) => atom.id === bond.atomIds[0]);
  const second = state.atoms.find((atom) => atom.id === bond.atomIds[1]);
  if (!first || !second) return null;
  return {
    x: (first.position.x + second.position.x) / 2,
    y: (first.position.y + second.position.y) / 2,
  };
}

export function electronSourcePosition(
  state: MoleculeState,
  source: ElectronSource,
): Point | null {
  return source.kind === "lone_pair"
    ? electronPairPosition(state, source.entityId)
    : bondMidpoint(state, source.entityId);
}

function targetObstacleAngles(state: MoleculeState, atomId: string): number[] {
  const atom = state.atoms.find((candidate) => candidate.id === atomId);
  if (!atom) return [];

  const angles = state.lonePairSites
    .filter((site) => site.atomId === atomId)
    .map((site) => (site.angle * Math.PI) / 180);

  for (const bond of state.bonds) {
    if (!bond.atomIds.includes(atomId)) continue;
    const otherAtomId = bond.atomIds.find((candidate) => candidate !== atomId);
    const otherAtom = state.atoms.find((candidate) => candidate.id === otherAtomId);
    if (otherAtom) {
      angles.push(
        Math.atan2(
          otherAtom.position.y - atom.position.y,
          otherAtom.position.x - atom.position.x,
        ),
      );
    }
  }

  if (atom.formalCharge !== 0) angles.push(-Math.PI / 4);
  if (atom.implicitHydrogenCount > 0) angles.push(Math.PI / 2);
  return angles;
}

export function arrowBundleRoutes(
  molecule: MoleculeState,
  arrows: ReadonlyArray<Pick<ArrowDraft, "source" | "target">>,
): Map<number, MechanismArrowRoute> {
  return buildMechanismArrowRoutes(
    arrows.flatMap((arrow, index) => {
      const source = electronSourcePosition(molecule, arrow.source);
      const target = molecule.atoms.find(
        (atom) => atom.id === arrow.target.entityId,
      )?.position;
      return source && target
        ? [
            {
              index,
              targetId: arrow.target.entityId,
              source,
              target,
              preferredTargetAngle: preferredMechanismArrowTargetAngle(
                source,
                target,
                index,
                arrow.source.kind,
              ),
              targetObstacleAngles: targetObstacleAngles(
                molecule,
                arrow.target.entityId,
              ),
            },
          ]
        : [];
    }),
  );
}

const COMPARISON_REPLAY_ARCH_Y = 72;
const COMPARISON_REPLAY_ARCH_DISTANCE = 220;

export function comparisonReplayArrowRoutes(
  molecule: MoleculeState,
  arrows: ReadonlyArray<Pick<ArrowDraft, "source" | "target">>,
): Map<number, MechanismArrowRoute> {
  const routes = arrowBundleRoutes(molecule, arrows);
  arrows.forEach((arrow, index) => {
    const source = electronSourcePosition(molecule, arrow.source);
    const target = molecule.atoms.find(
      (atom) => atom.id === arrow.target.entityId,
    )?.position;
    if (!source || !target || Math.hypot(target.x - source.x, target.y - source.y) < COMPARISON_REPLAY_ARCH_DISTANCE) {
      return;
    }
    const existing = routes.get(index);
    routes.set(index, {
      targetAngle:
        existing?.targetAngle ??
        preferredMechanismArrowTargetAngle(
          source,
          target,
          index,
          arrow.source.kind,
        ),
      curveLane: existing?.curveLane,
      archY: COMPARISON_REPLAY_ARCH_Y,
    });
  });
  return routes;
}
