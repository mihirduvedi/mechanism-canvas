import type { Atom, MoleculeState, Point } from "../domain/types";

export interface SnapshotLabelPlacement extends Point {
  textAnchor: "start" | "middle" | "end";
}

export type SnapshotAnnotationPlacement = SnapshotLabelPlacement;

export interface SnapshotViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const LABEL_RADIUS = 56;
const PAIR_RADIUS = 38;
const IMPLICIT_HYDROGEN_RADIUS = 50;
const VIEWBOX_PADDING = 28;

const labelCandidates = [
  { angle: 270, preference: 8 },
  { angle: 225, preference: 7 },
  { angle: 315, preference: 6 },
  { angle: 135, preference: 4 },
  { angle: 45, preference: 3 },
  { angle: 90, preference: 1 },
] as const;

const annotationCandidates = [
  { angle: 90, preference: 8 },
  { angle: 0, preference: 6 },
  { angle: 180, preference: 5 },
  { angle: 270, preference: 3 },
] as const;

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function angleDistance(first: number, second: number): number {
  const difference = Math.abs(normalizeAngle(first) - normalizeAngle(second));
  return Math.min(difference, 360 - difference);
}

function pointAt(origin: Point, angle: number, radius: number): Point {
  const radians = (angle * Math.PI) / 180;
  return {
    x: origin.x + Math.cos(radians) * radius,
    y: origin.y + Math.sin(radians) * radius,
  };
}

function bondAngles(state: MoleculeState, atom: Atom): number[] {
  return state.bonds.flatMap((bond) => {
    if (!bond.atomIds.includes(atom.id)) return [];
    const otherId = bond.atomIds.find((candidate) => candidate !== atom.id);
    const other = state.atoms.find((candidate) => candidate.id === otherId);
    if (!other) return [];
    return [
      normalizeAngle(
        (Math.atan2(other.position.y - atom.position.y, other.position.x - atom.position.x) *
          180) /
          Math.PI,
      ),
    ];
  });
}

function occupiedAngles(states: readonly MoleculeState[], atomId: string): number[] {
  return states.flatMap((state) => {
    const atom = state.atoms.find((candidate) => candidate.id === atomId);
    if (!atom) return [];
    const occupied = [
      ...bondAngles(state, atom),
      ...state.lonePairSites
        .filter((site) => site.atomId === atom.id)
        .map((site) => normalizeAngle(site.angle)),
    ];
    if (atom.formalCharge !== 0) occupied.push(315);
    if (atom.implicitHydrogenCount > 0) occupied.push(90);
    return occupied;
  });
}

export function snapshotLabelPlacement(
  states: readonly MoleculeState[],
  atom: Atom,
): SnapshotLabelPlacement {
  const occupied = occupiedAngles(states, atom.id);
  const chosen = labelCandidates
    .map((candidate) => ({
      ...candidate,
      clearance:
        occupied.length === 0
          ? 180
          : Math.min(...occupied.map((angle) => angleDistance(candidate.angle, angle))),
    }))
    .sort(
      (first, second) =>
        second.clearance - first.clearance || second.preference - first.preference,
    )[0];
  const position = pointAt(atom.position, chosen.angle, LABEL_RADIUS);
  const horizontalDirection = Math.cos((chosen.angle * Math.PI) / 180);
  return {
    ...position,
    textAnchor:
      horizontalDirection > 0.35 ? "start" : horizontalDirection < -0.35 ? "end" : "middle",
  };
}

export function snapshotPairPosition(state: MoleculeState, siteId: string): Point | null {
  const site = state.lonePairSites.find((candidate) => candidate.id === siteId);
  const atom = state.atoms.find((candidate) => candidate.id === site?.atomId);
  if (!site || !atom) return null;
  return pointAt(atom.position, site.angle, PAIR_RADIUS);
}

function annotationOccupiedAngles(
  states: readonly MoleculeState[],
  atomId: string,
): number[] {
  return states.flatMap((state) => {
    const atom = state.atoms.find((candidate) => candidate.id === atomId);
    if (!atom) return [];
    const label = snapshotLabelPlacement(states, atom);
    const occupied = [
      ...bondAngles(state, atom),
      ...state.lonePairSites
        .filter((site) => site.atomId === atom.id)
        .map((site) => normalizeAngle(site.angle)),
      normalizeAngle(
        (Math.atan2(label.y - atom.position.y, label.x - atom.position.x) * 180) /
          Math.PI,
      ),
    ];
    if (atom.formalCharge !== 0) occupied.push(315);
    return occupied;
  });
}

export function snapshotImplicitHydrogenPlacement(
  states: readonly MoleculeState[],
  atom: Atom,
): SnapshotAnnotationPlacement {
  const occupied = annotationOccupiedAngles(states, atom.id);
  const chosen = annotationCandidates
    .map((candidate) => ({
      ...candidate,
      clearance:
        occupied.length === 0
          ? 180
          : Math.min(...occupied.map((angle) => angleDistance(candidate.angle, angle))),
    }))
    .sort(
      (first, second) =>
        second.clearance - first.clearance || second.preference - first.preference,
    )[0];
  const position = pointAt(atom.position, chosen.angle, IMPLICIT_HYDROGEN_RADIUS);
  return {
    ...position,
    textAnchor: chosen.angle === 0 ? "start" : chosen.angle === 180 ? "end" : "middle",
  };
}

function includePoint(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  point: Point,
  horizontalExtent: number,
  verticalExtent = horizontalExtent,
): void {
  bounds.minX = Math.min(bounds.minX, point.x - horizontalExtent);
  bounds.maxX = Math.max(bounds.maxX, point.x + horizontalExtent);
  bounds.minY = Math.min(bounds.minY, point.y - verticalExtent);
  bounds.maxY = Math.max(bounds.maxY, point.y + verticalExtent);
}

export function snapshotViewBox(states: readonly MoleculeState[]): SnapshotViewBox {
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  for (const state of states) {
    for (const atom of state.atoms) {
      includePoint(bounds, atom.position, 34);
      includePoint(bounds, snapshotLabelPlacement(states, atom), 24, 14);
      if (atom.formalCharge !== 0) {
        includePoint(bounds, { x: atom.position.x + 28, y: atom.position.y - 24 }, 14, 16);
      }
      if (atom.implicitHydrogenCount > 0) {
        includePoint(bounds, snapshotImplicitHydrogenPlacement(states, atom), 24, 14);
      }
    }
    for (const site of state.lonePairSites) {
      const position = snapshotPairPosition(state, site.id);
      if (position) includePoint(bounds, position, 9);
    }
    for (const separator of state.separators ?? []) includePoint(bounds, separator, 18, 22);
  }

  if (!Number.isFinite(bounds.minX)) return { x: 0, y: 0, width: 760, height: 330 };

  return {
    x: Math.floor(bounds.minX - VIEWBOX_PADDING),
    y: Math.floor(bounds.minY - VIEWBOX_PADDING),
    width: Math.ceil(bounds.maxX - bounds.minX + VIEWBOX_PADDING * 2),
    height: Math.ceil(bounds.maxY - bounds.minY + VIEWBOX_PADDING * 2),
  };
}

export function viewBoxValue(viewBox: SnapshotViewBox): string {
  return `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
}
