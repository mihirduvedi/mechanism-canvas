import type { Atom, MoleculeState, Point } from "../domain/types";
import {
  snapshotLabelPlacement,
  snapshotImplicitHydrogenPlacement,
  snapshotPairPosition,
  type SnapshotViewBox,
} from "./molecule-snapshot-geometry";

export const COMPARISON_VIEWBOX: SnapshotViewBox = {
  x: 0,
  y: 0,
  width: 760,
  height: 360,
};

export const COMPARISON_REACTION_LINE_Y = 190;

const HORIZONTAL_PADDING = 38;
const PREFERRED_COMPONENT_GAP = 76;
const MINIMUM_COMPONENT_GAP = 56;
const ATOM_EXTENT = 35;

export interface ComparisonComponentBounds {
  atomIds: string[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

type Bounds = Omit<ComparisonComponentBounds, "atomIds">;

export interface ComparisonMoleculeLayout {
  states: readonly [MoleculeState, MoleculeState];
  viewBox: SnapshotViewBox;
  reactionLineY: number;
}

function emptyBounds(): Bounds {
  return {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };
}

function includePoint(
  bounds: Bounds,
  point: Point,
  horizontalExtent: number,
  verticalExtent = horizontalExtent,
): void {
  bounds.minX = Math.min(bounds.minX, point.x - horizontalExtent);
  bounds.maxX = Math.max(bounds.maxX, point.x + horizontalExtent);
  bounds.minY = Math.min(bounds.minY, point.y - verticalExtent);
  bounds.maxY = Math.max(bounds.maxY, point.y + verticalExtent);
}

function connectedComponents(state: MoleculeState): Atom[][] {
  const atomsById = new Map(state.atoms.map((atom) => [atom.id, atom]));
  const neighbors = new Map(state.atoms.map((atom) => [atom.id, new Set<string>()]));

  for (const bond of state.bonds) {
    neighbors.get(bond.atomIds[0])?.add(bond.atomIds[1]);
    neighbors.get(bond.atomIds[1])?.add(bond.atomIds[0]);
  }

  const visited = new Set<string>();
  const components: Atom[][] = [];
  for (const atom of state.atoms) {
    if (visited.has(atom.id)) continue;
    const component: Atom[] = [];
    const pending = [atom.id];
    visited.add(atom.id);
    while (pending.length > 0) {
      const atomId = pending.pop()!;
      const member = atomsById.get(atomId);
      if (member) component.push(member);
      for (const neighborId of neighbors.get(atomId) ?? []) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);
        pending.push(neighborId);
      }
    }
    components.push(component);
  }

  return components.sort((first, second) => {
    const firstX = Math.min(...first.map((atom) => atom.position.x));
    const secondX = Math.min(...second.map((atom) => atom.position.x));
    return firstX - secondX;
  });
}

function componentBounds(
  state: MoleculeState,
  comparisonStates: readonly MoleculeState[],
  component: readonly Atom[],
): Bounds {
  const bounds = emptyBounds();
  const atomIds = new Set(component.map((atom) => atom.id));

  for (const atom of component) {
    includePoint(bounds, atom.position, ATOM_EXTENT);
    includePoint(bounds, snapshotLabelPlacement(comparisonStates, atom), 22, 12);
    if (atom.formalCharge !== 0) {
      includePoint(bounds, { x: atom.position.x + 26, y: atom.position.y - 24 }, 13, 15);
    }
    if (atom.implicitHydrogenCount > 0) {
      includePoint(
        bounds,
        snapshotImplicitHydrogenPlacement(comparisonStates, atom),
        24,
        13,
      );
    }
  }

  for (const site of state.lonePairSites) {
    if (!atomIds.has(site.atomId)) continue;
    const position = snapshotPairPosition(state, site.id);
    if (position) includePoint(bounds, position, 9);
  }

  return bounds;
}

function componentAnchorY(component: readonly Atom[]): number {
  const heavyAtoms = component.filter((atom) => atom.element !== "H");
  const anchors = heavyAtoms.length > 0 ? heavyAtoms : component;
  return anchors.reduce((sum, atom) => sum + atom.position.y, 0) / anchors.length;
}

function translateState(
  state: MoleculeState,
  comparisonStates: readonly MoleculeState[],
): MoleculeState {
  const components = connectedComponents(state).map((atoms) => ({
    atoms,
    bounds: componentBounds(state, comparisonStates, atoms),
  }));
  if (components.length === 0) return { ...state, separators: [] };

  const availableWidth = COMPARISON_VIEWBOX.width - HORIZONTAL_PADDING * 2;
  const componentWidth = components.reduce(
    (sum, component) => sum + component.bounds.maxX - component.bounds.minX,
    0,
  );
  const gapCount = Math.max(0, components.length - 1);
  const gap =
    gapCount === 0
      ? 0
      : Math.max(
          MINIMUM_COMPONENT_GAP,
          Math.min(PREFERRED_COMPONENT_GAP, (availableWidth - componentWidth) / gapCount),
        );
  const occupiedWidth = componentWidth + gap * gapCount;
  let cursor = (COMPARISON_VIEWBOX.width - occupiedWidth) / 2;
  const translations = new Map<string, Point>();
  const separators: Point[] = [];

  components.forEach((component, index) => {
    const dx = cursor - component.bounds.minX;
    const dy = COMPARISON_REACTION_LINE_Y - componentAnchorY(component.atoms);
    for (const atom of component.atoms) translations.set(atom.id, { x: dx, y: dy });
    cursor += component.bounds.maxX - component.bounds.minX;
    if (index < components.length - 1) {
      separators.push({ x: cursor + gap / 2, y: COMPARISON_REACTION_LINE_Y });
      cursor += gap;
    }
  });

  return {
    ...state,
    atoms: state.atoms.map((atom) => {
      const translation = translations.get(atom.id) ?? { x: 0, y: 0 };
      return {
        ...atom,
        position: {
          x: atom.position.x + translation.x,
          y: atom.position.y + translation.y,
        },
      };
    }),
    separators,
  };
}

export function comparisonMoleculeLayout(
  states: readonly [MoleculeState, MoleculeState],
): ComparisonMoleculeLayout {
  const before = translateState(states[0], states);
  const after = translateState(states[1], states);
  return {
    states: [before, after],
    viewBox: COMPARISON_VIEWBOX,
    reactionLineY: COMPARISON_REACTION_LINE_Y,
  };
}

export function comparisonComponentAtomGroups(state: MoleculeState): string[][] {
  return connectedComponents(state).map((component) => component.map((atom) => atom.id));
}

export function comparisonComponentBounds(
  state: MoleculeState,
  comparisonStates: readonly MoleculeState[],
): ComparisonComponentBounds[] {
  return connectedComponents(state).map((component) => ({
    atomIds: component.map((atom) => atom.id),
    ...componentBounds(state, comparisonStates, component),
  }));
}
