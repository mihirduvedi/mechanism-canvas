import type { Atom, Bond, ElementSymbol, MoleculeState } from "./types";

export interface Vector3Value {
  x: number;
  y: number;
  z: number;
}

export interface MolecularAtom3D {
  id: string;
  sourceAtomId: string;
  label: string;
  element: ElementSymbol;
  formalCharge: number;
  lonePairCount: number;
  electronegativity: number;
  mass: number;
  displayRadius: number;
  position: Vector3Value;
  virtual: boolean;
}

export interface MolecularBond3D {
  id: string;
  atomIds: readonly [string, string];
  order: number;
  lengthAngstrom: number;
  electronegativityDelta: number;
  negativeEndAtomId: string | null;
  virtual: boolean;
}

export interface LonePairDomain3D {
  id: string;
  atomId: string;
  direction: Vector3Value;
  position: Vector3Value;
}

export interface AtomGeometrySummary {
  atomId: string;
  electronDomainCount: number;
  electronGeometry: string;
  molecularGeometry: string;
  bondedAtomCount: number;
  lonePairCount: number;
  meanBondAngle: number | null;
  bondOrderSum: number;
  strongestPolarity: number;
}

export interface MolecularGeometry3D {
  atoms: MolecularAtom3D[];
  bonds: MolecularBond3D[];
  lonePairs: LonePairDomain3D[];
  atomGeometry: AtomGeometrySummary[];
  center: Vector3Value;
  radius: number;
}

interface ElementProperties {
  mass: number;
  covalentRadius: number;
  displayRadius: number;
  electronegativity: number;
}

export const ELEMENT_PROPERTIES: Record<ElementSymbol, ElementProperties> = {
  H: { mass: 1.008, covalentRadius: 0.31, displayRadius: 0.25, electronegativity: 2.2 },
  C: { mass: 12.011, covalentRadius: 0.76, displayRadius: 0.42, electronegativity: 2.55 },
  N: { mass: 14.007, covalentRadius: 0.71, displayRadius: 0.4, electronegativity: 3.04 },
  O: { mass: 15.999, covalentRadius: 0.66, displayRadius: 0.39, electronegativity: 3.44 },
  Cl: { mass: 35.45, covalentRadius: 1.02, displayRadius: 0.48, electronegativity: 3.16 },
  Br: { mass: 79.904, covalentRadius: 1.2, displayRadius: 0.54, electronegativity: 2.96 },
  I: { mass: 126.9, covalentRadius: 1.39, displayRadius: 0.59, electronegativity: 2.66 },
};

const add = (a: Vector3Value, b: Vector3Value): Vector3Value => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});

const subtract = (a: Vector3Value, b: Vector3Value): Vector3Value => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

const scale = (vector: Vector3Value, factor: number): Vector3Value => ({
  x: vector.x * factor,
  y: vector.y * factor,
  z: vector.z * factor,
});

const dot = (a: Vector3Value, b: Vector3Value): number => a.x * b.x + a.y * b.y + a.z * b.z;

const cross = (a: Vector3Value, b: Vector3Value): Vector3Value => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

const magnitude = (vector: Vector3Value): number => Math.hypot(vector.x, vector.y, vector.z);

const normalize = (vector: Vector3Value): Vector3Value => {
  const length = Math.max(magnitude(vector), 1e-9);
  return scale(vector, 1 / length);
};

const rotateAroundAxis = (
  vector: Vector3Value,
  axisValue: Vector3Value,
  angle: number,
): Vector3Value => {
  const axis = normalize(axisValue);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return add(
    add(scale(vector, cosine), scale(cross(axis, vector), sine)),
    scale(axis, dot(axis, vector) * (1 - cosine)),
  );
};

function rotateFromTo(
  vector: Vector3Value,
  fromValue: Vector3Value,
  toValue: Vector3Value,
): Vector3Value {
  const from = normalize(fromValue);
  const to = normalize(toValue);
  const cosine = Math.min(1, Math.max(-1, dot(from, to)));
  if (cosine > 0.999999) return vector;
  if (cosine < -0.999999) {
    const helper = Math.abs(from.x) < 0.8 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    return rotateAroundAxis(vector, cross(from, helper), Math.PI);
  }
  const axis = normalize(cross(from, to));
  return rotateAroundAxis(vector, axis, Math.acos(cosine));
}

function templateDirections(domainCount: number): Vector3Value[] {
  if (domainCount <= 1) return [{ x: 1, y: 0, z: 0 }];
  if (domainCount === 2) return [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
  ];
  if (domainCount === 3) {
    const y = Math.sqrt(3) / 2;
    return [
      { x: 1, y: 0, z: 0 },
      { x: -0.5, y, z: 0 },
      { x: -0.5, y: -y, z: 0 },
    ];
  }
  if (domainCount === 4) {
    return [
      normalize({ x: 1, y: 1, z: 1 }),
      normalize({ x: 1, y: -1, z: -1 }),
      normalize({ x: -1, y: 1, z: -1 }),
      normalize({ x: -1, y: -1, z: 1 }),
    ];
  }
  if (domainCount === 5) {
    const y = Math.sqrt(3) / 2;
    return [
      { x: 0, y: 1, z: 0 },
      { x: 0, y: -1, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: -0.5, y: 0, z: y },
      { x: -0.5, y: 0, z: -y },
    ];
  }
  return [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
  ];
}

function geometryNames(domainCount: number, bondedCount: number): [string, string] {
  const electronGeometry =
    domainCount <= 1
      ? "single domain"
      : domainCount === 2
        ? "linear"
        : domainCount === 3
          ? "trigonal planar"
          : domainCount === 4
            ? "tetrahedral"
            : domainCount === 5
              ? "trigonal bipyramidal"
              : "octahedral";
  if (bondedCount <= 1) return [electronGeometry, bondedCount === 0 ? "isolated atom or ion" : "terminal atom"];
  if (domainCount === 2) return [electronGeometry, "linear"];
  if (domainCount === 3) return [electronGeometry, bondedCount === 2 ? "bent" : "trigonal planar"];
  if (domainCount === 4) {
    return [
      electronGeometry,
      bondedCount === 2 ? "bent" : bondedCount === 3 ? "trigonal pyramidal" : "tetrahedral",
    ];
  }
  if (domainCount === 5) {
    return [
      electronGeometry,
      bondedCount === 2 ? "linear" : bondedCount === 3 ? "T-shaped" : bondedCount === 4 ? "seesaw" : electronGeometry,
    ];
  }
  return [
    electronGeometry,
    bondedCount === 4 ? "square planar" : bondedCount === 5 ? "square pyramidal" : electronGeometry,
  ];
}

function bondLength(first: Atom, second: Atom, order: number): number {
  const base = ELEMENT_PROPERTIES[first.element].covalentRadius + ELEMENT_PROPERTIES[second.element].covalentRadius;
  const orderFactor = order === 1 ? 1 : order === 2 ? 0.9 : 0.84;
  return base * orderFactor;
}

interface ExpandedGraph {
  atoms: Map<string, Atom & { sourceAtomId: string; virtual: boolean }>;
  bonds: Array<Bond & { virtual: boolean }>;
}

function expandImplicitHydrogens(molecule: MoleculeState): ExpandedGraph {
  const atoms = new Map(
    molecule.atoms.map((atom) => [atom.id, { ...atom, sourceAtomId: atom.id, virtual: false }]),
  );
  const bonds: ExpandedGraph["bonds"] = molecule.bonds.map((bond) => ({ ...bond, virtual: false }));

  for (const atom of molecule.atoms) {
    for (let index = 0; index < atom.implicitHydrogenCount; index += 1) {
      const id = `implicit_${atom.id}_h_${index + 1}`;
      atoms.set(id, {
        id,
        sourceAtomId: atom.id,
        label: `H${index + 1}`,
        element: "H",
        formalCharge: 0,
        lonePairCount: 0,
        implicitHydrogenCount: 0,
        position: atom.position,
        virtual: true,
      });
      bonds.push({
        id: `implicit_bond_${atom.id}_h_${index + 1}`,
        atomIds: [atom.id, id],
        order: 1,
        virtual: true,
      });
    }
  }
  return { atoms, bonds };
}

function connectedComponents(atomIds: string[], adjacency: Map<string, string[]>): string[][] {
  const unseen = new Set(atomIds);
  const components: string[][] = [];
  while (unseen.size > 0) {
    const start = unseen.values().next().value as string;
    const stack = [start];
    const component: string[] = [];
    unseen.delete(start);
    while (stack.length > 0) {
      const current = stack.pop()!;
      component.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!unseen.has(neighbor)) continue;
        unseen.delete(neighbor);
        stack.push(neighbor);
      }
    }
    components.push(component);
  }
  return components;
}

function meanAngle(vectors: Vector3Value[]): number | null {
  if (vectors.length < 2) return null;
  let total = 0;
  let count = 0;
  for (let first = 0; first < vectors.length; first += 1) {
    for (let second = first + 1; second < vectors.length; second += 1) {
      const cosine = Math.min(1, Math.max(-1, dot(normalize(vectors[first]), normalize(vectors[second]))));
      total += (Math.acos(cosine) * 180) / Math.PI;
      count += 1;
    }
  }
  return total / count;
}

export function buildMolecularGeometry(molecule: MoleculeState): MolecularGeometry3D {
  const graph = expandImplicitHydrogens(molecule);
  const adjacency = new Map([...graph.atoms.keys()].map((id) => [id, [] as string[]]));
  const bondByPair = new Map<string, ExpandedGraph["bonds"][number]>();
  for (const bond of graph.bonds) {
    adjacency.get(bond.atomIds[0])?.push(bond.atomIds[1]);
    adjacency.get(bond.atomIds[1])?.push(bond.atomIds[0]);
    bondByPair.set([...bond.atomIds].sort().join("|"), bond);
  }

  const explicitPositions = molecule.atoms.map((atom) => atom.position.x);
  const sourceCenterX = explicitPositions.reduce((sum, x) => sum + x, 0) / Math.max(explicitPositions.length, 1);
  const positions = new Map<string, Vector3Value>();
  const domainDirections = new Map<string, Vector3Value[]>();
  const components = connectedComponents([...graph.atoms.keys()], adjacency);

  for (const component of components) {
    const rootId = [...component].sort((firstId, secondId) => {
      const degreeDifference = (adjacency.get(secondId)?.length ?? 0) - (adjacency.get(firstId)?.length ?? 0);
      if (degreeDifference !== 0) return degreeDifference;
      const first = graph.atoms.get(firstId)!;
      const second = graph.atoms.get(secondId)!;
      if (first.virtual !== second.virtual) return first.virtual ? 1 : -1;
      return ELEMENT_PROPERTIES[second.element].mass - ELEMENT_PROPERTIES[first.element].mass;
    })[0];
    const componentExplicit = component.map((id) => graph.atoms.get(id)!).filter((atom) => !atom.virtual);
    const componentCenterX =
      componentExplicit.reduce((sum, atom) => sum + atom.position.x, 0) / Math.max(componentExplicit.length, 1);
    const anchor = { x: (componentCenterX - sourceCenterX) / 72, y: 0, z: 0 };
    positions.set(rootId, anchor);

    const place = (atomId: string, parentId: string | null) => {
      const atom = graph.atoms.get(atomId)!;
      const neighbors = [...(adjacency.get(atomId) ?? [])].sort((firstId, secondId) => {
        if (firstId === parentId) return -1;
        if (secondId === parentId) return 1;
        const first = graph.atoms.get(firstId)!;
        const second = graph.atoms.get(secondId)!;
        if (first.virtual !== second.virtual) return first.virtual ? 1 : -1;
        return ELEMENT_PROPERTIES[second.element].mass - ELEMENT_PROPERTIES[first.element].mass;
      });
      const domainCount = Math.min(6, Math.max(1, neighbors.length + atom.lonePairCount));
      let directions = templateDirections(domainCount);
      if (parentId) {
        const atomPosition = positions.get(atomId)!;
        const parentPosition = positions.get(parentId)!;
        const parentDirection = normalize(subtract(parentPosition, atomPosition));
        directions = directions.map((direction) => rotateFromTo(direction, directions[0], parentDirection));
      } else {
        directions = directions.map((direction) =>
          rotateAroundAxis(rotateAroundAxis(direction, { x: 0, y: 1, z: 0 }, -0.38), { x: 1, y: 0, z: 0 }, 0.2),
        );
      }
      domainDirections.set(atomId, directions);

      neighbors.forEach((neighborId, index) => {
        if (neighborId === parentId || positions.has(neighborId)) return;
        const neighbor = graph.atoms.get(neighborId)!;
        const bond = bondByPair.get([atomId, neighborId].sort().join("|"))!;
        const length = bondLength(atom, neighbor, bond.order);
        positions.set(neighborId, add(positions.get(atomId)!, scale(directions[index], length)));
        place(neighborId, atomId);
      });
    };
    place(rootId, null);
  }

  const atoms: MolecularAtom3D[] = [...graph.atoms.values()].map((atom) => {
    const properties = ELEMENT_PROPERTIES[atom.element];
    return {
      id: atom.id,
      sourceAtomId: atom.sourceAtomId,
      label: atom.label,
      element: atom.element,
      formalCharge: atom.formalCharge,
      lonePairCount: atom.lonePairCount,
      electronegativity: properties.electronegativity,
      mass: properties.mass,
      displayRadius: properties.displayRadius,
      position: positions.get(atom.id) ?? { x: 0, y: 0, z: 0 },
      virtual: atom.virtual,
    };
  });

  const bonds: MolecularBond3D[] = graph.bonds.map((bond) => {
    const first = graph.atoms.get(bond.atomIds[0])!;
    const second = graph.atoms.get(bond.atomIds[1])!;
    const delta = ELEMENT_PROPERTIES[second.element].electronegativity - ELEMENT_PROPERTIES[first.element].electronegativity;
    return {
      id: bond.id,
      atomIds: bond.atomIds,
      order: bond.order,
      lengthAngstrom: bondLength(first, second, bond.order),
      electronegativityDelta: Math.abs(delta),
      negativeEndAtomId: Math.abs(delta) < 0.15 ? null : delta > 0 ? second.id : first.id,
      virtual: bond.virtual,
    };
  });

  const lonePairs: LonePairDomain3D[] = [];
  for (const atom of atoms) {
    if (atom.lonePairCount === 0) continue;
    const neighbors = adjacency.get(atom.id) ?? [];
    const directions = domainDirections.get(atom.id) ?? templateDirections(atom.lonePairCount);
    for (let index = 0; index < atom.lonePairCount; index += 1) {
      const direction = directions[neighbors.length + index] ?? directions[index % directions.length];
      lonePairs.push({
        id: `domain_${atom.id}_lp_${index + 1}`,
        atomId: atom.id,
        direction,
        position: add(atom.position, scale(direction, atom.displayRadius + 0.52)),
      });
    }
  }

  const atomById = new Map(atoms.map((atom) => [atom.id, atom]));
  const atomGeometry: AtomGeometrySummary[] = atoms
    .filter((atom) => !atom.virtual)
    .map((atom) => {
      const neighbors = adjacency.get(atom.id) ?? [];
      const vectors = neighbors.map((id) => subtract(atomById.get(id)!.position, atom.position));
      const domainCount = neighbors.length + atom.lonePairCount;
      const [electronGeometry, molecularGeometry] = geometryNames(domainCount, neighbors.length);
      const connectedBonds = bonds.filter((bond) => bond.atomIds.includes(atom.id));
      return {
        atomId: atom.id,
        electronDomainCount: domainCount,
        electronGeometry,
        molecularGeometry,
        bondedAtomCount: neighbors.length,
        lonePairCount: atom.lonePairCount,
        meanBondAngle: meanAngle(vectors),
        bondOrderSum: connectedBonds.reduce((sum, bond) => sum + bond.order, 0),
        strongestPolarity: connectedBonds.reduce(
          (strongest, bond) => Math.max(strongest, bond.electronegativityDelta),
          0,
        ),
      };
    });

  const bounds = atoms.reduce(
    (current, atom) => ({
      min: {
        x: Math.min(current.min.x, atom.position.x - atom.displayRadius),
        y: Math.min(current.min.y, atom.position.y - atom.displayRadius),
        z: Math.min(current.min.z, atom.position.z - atom.displayRadius),
      },
      max: {
        x: Math.max(current.max.x, atom.position.x + atom.displayRadius),
        y: Math.max(current.max.y, atom.position.y + atom.displayRadius),
        z: Math.max(current.max.z, atom.position.z + atom.displayRadius),
      },
    }),
    {
      min: { x: Infinity, y: Infinity, z: Infinity },
      max: { x: -Infinity, y: -Infinity, z: -Infinity },
    },
  );
  const normalizedCenter = scale(add(bounds.min, bounds.max), 0.5);
  const radius = atoms.reduce(
    (largest, atom) => Math.max(largest, magnitude(subtract(atom.position, normalizedCenter)) + atom.displayRadius),
    1,
  );

  return { atoms, bonds, lonePairs, atomGeometry, center: normalizedCenter, radius };
}
