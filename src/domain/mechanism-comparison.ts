import { reachableHistoryStateIds } from "./problem-steps";
import type {
  ArrowDraft,
  Atom,
  BondOrder,
  MechanismState,
  MoleculeState,
  ProblemDefinition,
} from "./types";

export type AtomComparisonProperty =
  | "formalCharge"
  | "lonePairCount"
  | "implicitHydrogenCount";

export interface AtomComparisonChange {
  kind: "atom";
  atomId: string;
  atomLabel: string;
  element: Atom["element"];
  property: AtomComparisonProperty;
  before: number;
  after: number;
}

export interface BondComparisonChange {
  kind: "bond";
  change: "formed" | "broken" | "order_changed";
  atomIds: readonly [string, string];
  atomLabels: readonly [string, string];
  beforeBondId: string | null;
  afterBondId: string | null;
  beforeOrder: BondOrder | 0;
  afterOrder: BondOrder | 0;
}

export interface MoleculeComparison {
  beforeStateId: string;
  beforeStateLabel: string;
  afterStateId: string;
  afterStateLabel: string;
  summary: string;
  changedEntityIds: string[];
  bondChanges: BondComparisonChange[];
  atomChanges: AtomComparisonChange[];
}

export interface AvailableStepComparison {
  commitId: string;
  stepId: string;
  stepIndex: number;
  stepTitle: string;
  beforeStateId: string;
  beforeStateLabel: string;
  afterStateId: string;
  afterStateLabel: string;
  actor: ArrowDraft["actor"];
  committedAt: string;
  arrowBundle: ArrowDraft[];
}

export interface ReachedStepComparison extends AvailableStepComparison {
  comparison: MoleculeComparison;
}

function pairKey(atomIds: readonly [string, string]): string {
  return [...atomIds].sort().join("::");
}

function atomLabel(atom: Atom): string {
  return `${atom.element} (${atom.label})`;
}

function atomById(state: MoleculeState, atomId: string): Atom | undefined {
  return state.atoms.find((atom) => atom.id === atomId);
}

function bondPairLabels(
  before: MoleculeState,
  after: MoleculeState,
  atomIds: readonly [string, string],
): readonly [string, string] {
  const first = atomById(before, atomIds[0]) ?? atomById(after, atomIds[0]);
  const second = atomById(before, atomIds[1]) ?? atomById(after, atomIds[1]);
  return [first ? atomLabel(first) : atomIds[0], second ? atomLabel(second) : atomIds[1]];
}

function comparisonSummary(
  bondChanges: BondComparisonChange[],
  atomChanges: AtomComparisonChange[],
): string {
  const formed = bondChanges.filter((change) => change.change === "formed").length;
  const broken = bondChanges.filter((change) => change.change === "broken").length;
  const reordered = bondChanges.filter((change) => change.change === "order_changed").length;
  const phrases: string[] = [];

  if (formed > 0) phrases.push(`${formed} bond${formed === 1 ? "" : "s"} formed`);
  if (broken > 0) phrases.push(`${broken} bond${broken === 1 ? "" : "s"} broken`);
  if (reordered > 0) phrases.push(`${reordered} bond order${reordered === 1 ? "" : "s"} changed`);
  if (atomChanges.length > 0) {
    phrases.push(
      `${atomChanges.length} atom propert${atomChanges.length === 1 ? "y" : "ies"} changed`,
    );
  }

  return phrases.length > 0 ? phrases.join("; ") : "No graph or electron-bookkeeping changes.";
}

export function compareMoleculeStates(
  before: MoleculeState,
  after: MoleculeState,
): MoleculeComparison {
  const beforeBonds = new Map(before.bonds.map((bond) => [pairKey(bond.atomIds), bond]));
  const afterBonds = new Map(after.bonds.map((bond) => [pairKey(bond.atomIds), bond]));
  const bondKeys = [...new Set([...beforeBonds.keys(), ...afterBonds.keys()])].sort();
  const bondChanges: BondComparisonChange[] = [];

  for (const key of bondKeys) {
    const beforeBond = beforeBonds.get(key);
    const afterBond = afterBonds.get(key);
    if (beforeBond?.order === afterBond?.order) continue;
    const atomIds = (beforeBond?.atomIds ?? afterBond?.atomIds) as readonly [string, string];
    bondChanges.push({
      kind: "bond",
      change: !beforeBond ? "formed" : !afterBond ? "broken" : "order_changed",
      atomIds,
      atomLabels: bondPairLabels(before, after, atomIds),
      beforeBondId: beforeBond?.id ?? null,
      afterBondId: afterBond?.id ?? null,
      beforeOrder: beforeBond?.order ?? 0,
      afterOrder: afterBond?.order ?? 0,
    });
  }

  const afterAtoms = new Map(after.atoms.map((atom) => [atom.id, atom]));
  const properties: AtomComparisonProperty[] = [
    "formalCharge",
    "lonePairCount",
    "implicitHydrogenCount",
  ];
  const atomChanges: AtomComparisonChange[] = [];

  for (const beforeAtom of [...before.atoms].sort((a, b) => a.id.localeCompare(b.id))) {
    const afterAtom = afterAtoms.get(beforeAtom.id);
    if (!afterAtom) continue;
    for (const property of properties) {
      if (beforeAtom[property] === afterAtom[property]) continue;
      atomChanges.push({
        kind: "atom",
        atomId: beforeAtom.id,
        atomLabel: beforeAtom.label,
        element: beforeAtom.element,
        property,
        before: beforeAtom[property],
        after: afterAtom[property],
      });
    }
  }

  const changedEntityIds = [
    ...bondChanges.flatMap((change) => [
      ...change.atomIds,
      ...(change.beforeBondId ? [change.beforeBondId] : []),
      ...(change.afterBondId ? [change.afterBondId] : []),
    ]),
    ...atomChanges.map((change) => change.atomId),
  ];

  return {
    beforeStateId: before.id,
    beforeStateLabel: before.label,
    afterStateId: after.id,
    afterStateLabel: after.label,
    summary: comparisonSummary(bondChanges, atomChanges),
    changedEntityIds: [...new Set(changedEntityIds)],
    bondChanges,
    atomChanges,
  };
}

export function availableStepComparisons(
  problem: ProblemDefinition,
  state: MechanismState,
): AvailableStepComparison[] {
  const reachable = new Set(reachableHistoryStateIds(problem, state.history));
  return state.history.flatMap((record) => {
    if (
      record.undoneAt !== null ||
      !reachable.has(record.fromStateId) ||
      !reachable.has(record.toStateId)
    ) {
      return [];
    }
    const stepIndex = problem.steps.findIndex(
      (step) =>
        step.fromStateId === record.fromStateId && step.toStateId === record.toStateId,
    );
    const step = problem.steps[stepIndex];
    if (!step) return [];
    return [
      {
        commitId: record.id,
        stepId: step.id,
        stepIndex: stepIndex + 1,
        stepTitle: step.title,
        beforeStateId: record.fromStateId,
        beforeStateLabel: problem.states[record.fromStateId].label,
        afterStateId: record.toStateId,
        afterStateLabel: problem.states[record.toStateId].label,
        actor: record.actor,
        committedAt: record.committedAt,
        arrowBundle: record.arrowBundle.map((arrow) => ({
          ...arrow,
          source: { ...arrow.source },
          target: { ...arrow.target },
        })),
      },
    ];
  });
}

export function compareReachedStep(
  problem: ProblemDefinition,
  state: MechanismState,
  beforeStateId: string,
  afterStateId: string,
): ReachedStepComparison | null {
  const available = availableStepComparisons(problem, state).find(
    (candidate) =>
      candidate.beforeStateId === beforeStateId && candidate.afterStateId === afterStateId,
  );
  if (!available) return null;
  return {
    ...available,
    comparison: compareMoleculeStates(
      problem.states[available.beforeStateId],
      problem.states[available.afterStateId],
    ),
  };
}
