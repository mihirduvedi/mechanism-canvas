import type {
  ArrowDraft,
  Atom,
  Bond,
  CommandResult,
  ElectronSource,
  MoleculeState,
  ProblemDefinition,
  ProblemStepDefinition,
  ReasonCode,
  ValidationIssue,
  ValidationResult,
} from "./types";
import { problemStepForState } from "./problem-steps";

const VALENCE_ELECTRONS = {
  H: 1,
  C: 4,
  N: 5,
  O: 6,
  Cl: 7,
  Br: 7,
  I: 7,
} as const;

const LONE_PAIR_ANGLES = [-90, 0, 90, 180, -45, 45];

interface TransformationSuccess {
  ok: true;
  state: MoleculeState;
}

interface TransformationFailure {
  ok: false;
  issue: ValidationIssue;
}

export type TransformationResult = TransformationSuccess | TransformationFailure;

function issue(
  code: ReasonCode,
  message: string,
  focusEntityIds: string[] = [],
): ValidationIssue {
  return { code, message, focusEntityIds };
}

function getAtom(state: MoleculeState, atomId: string): Atom | undefined {
  return state.atoms.find((atom) => atom.id === atomId);
}

function getBond(state: MoleculeState, bondId: string): Bond | undefined {
  return state.bonds.find((bond) => bond.id === bondId);
}

function pairKey(atomA: string, atomB: string): string {
  return [atomA, atomB].sort().join("::");
}

function sourceKey(source: ElectronSource): string {
  return `${source.kind}:${source.entityId}`;
}

export function ownerAtomIdForSource(
  state: MoleculeState,
  source: ElectronSource,
): string | null {
  if (source.kind === "lone_pair") {
    return state.lonePairSites.find((site) => site.id === source.entityId)?.atomId ?? null;
  }
  return null;
}

export function describeEntity(state: MoleculeState, entityId: string): string {
  const atom = getAtom(state, entityId);
  if (atom) return `${atom.element} (${atom.label})`;

  const bond = getBond(state, entityId);
  if (bond) {
    const [first, second] = bond.atomIds.map((atomId) => getAtom(state, atomId));
    return `${first?.element ?? "?"}–${second?.element ?? "?"} bond`;
  }

  const site = state.lonePairSites.find((candidate) => candidate.id === entityId);
  if (site) {
    const owner = getAtom(state, site.atomId);
    return `lone pair on ${owner?.element ?? "unknown atom"}`;
  }

  return entityId;
}

export function describeArrow(state: MoleculeState, arrow: ArrowDraft): string {
  return `${describeEntity(state, arrow.source.entityId)} → ${describeEntity(
    state,
    arrow.target.entityId,
  )}`;
}

function canonicalArrowDescriptor(
  state: MoleculeState,
  source: ElectronSource,
  targetId: string,
): string {
  if (source.kind === "lone_pair") {
    const ownerId = ownerAtomIdForSource(state, source);
    return `lone_pair_on:${ownerId ?? source.entityId}->atom:${targetId}`;
  }
  return `bond:${source.entityId}->atom:${targetId}`;
}

export function draftSignature(state: MoleculeState, arrows: ArrowDraft[]): string {
  return arrows
    .map((arrow) => canonicalArrowDescriptor(state, arrow.source, arrow.target.entityId))
    .sort()
    .join("|");
}

function acceptedSignature(
  state: MoleculeState,
  bundle: ProblemStepDefinition["acceptedBundles"][number],
): string {
  return bundle
    .map((arrow) => canonicalArrowDescriptor(state, arrow.source, arrow.target.entityId))
    .sort()
    .join("|");
}

function descriptorSet(state: MoleculeState, arrows: ArrowDraft[]): Set<string> {
  return new Set(
    arrows.map((arrow) => canonicalArrowDescriptor(state, arrow.source, arrow.target.entityId)),
  );
}

function isStrictAcceptedSubset(
  step: ProblemStepDefinition,
  state: MoleculeState,
  arrows: ArrowDraft[],
): boolean {
  if (arrows.length === 0) return false;
  const actual = descriptorSet(state, arrows);

  return step.acceptedBundles.some((bundle) => {
    const accepted = new Set(
      bundle.map((arrow) => canonicalArrowDescriptor(state, arrow.source, arrow.target.entityId)),
    );
    return actual.size < accepted.size && [...actual].every((entry) => accepted.has(entry));
  });
}

function findBondDirectionDiagnostic(step: ProblemStepDefinition, arrows: ArrowDraft[]) {
  return step.feedback.bondDirection.find((diagnostic) =>
    arrows.some(
      (arrow) =>
        arrow.source.kind === "bond" &&
        arrow.source.entityId === diagnostic.sourceBondId &&
        arrow.target.entityId === diagnostic.incorrectTargetAtomId,
    ),
  );
}

export function bondOrderSum(state: MoleculeState, atomId: string): number {
  const explicit = state.bonds.reduce((sum, bond) => {
    return bond.atomIds.includes(atomId) ? sum + bond.order : sum;
  }, 0);
  return explicit + (getAtom(state, atomId)?.implicitHydrogenCount ?? 0);
}

export function calculateFormalCharge(state: MoleculeState, atom: Atom): number {
  const nonbondingElectrons = atom.lonePairCount * 2;
  return VALENCE_ELECTRONS[atom.element] - nonbondingElectrons - bondOrderSum(state, atom.id);
}

export function totalFormalCharge(state: MoleculeState): number {
  return state.atoms.reduce((sum, atom) => sum + atom.formalCharge, 0);
}

function bondIdForPair(state: MoleculeState, atomA: string, atomB: string): string {
  const existing = state.bonds.find(
    (bond) => pairKey(bond.atomIds[0], bond.atomIds[1]) === pairKey(atomA, atomB),
  );
  if (existing) return existing.id;
  const normalized = [atomA, atomB].sort().map((id) => id.replaceAll("_", "-")).join("__");
  return `bond_${normalized}`;
}

function validateValence(state: MoleculeState): ValidationIssue | null {
  for (const atom of state.atoms) {
    const bondSum = bondOrderSum(state, atom.id);
    const maximum = atom.element === "H" ? 1 : atom.element === "C" ? 4 : atom.element === "N" ? 4 : atom.element === "O" ? 3 : 1;

    if (bondSum > maximum) {
      return issue(
        "VALENCE_EXCEEDED",
        `${atom.element} (${atom.label}) would have bond order ${bondSum}, above the supported valence for this exercise.`,
        [atom.id],
      );
    }
  }
  return null;
}

function rebuildLonePairSites(
  state: MoleculeState,
  consumedSiteIds: Set<string>,
): MoleculeState["lonePairSites"] {
  const rebuilt = state.lonePairSites.filter((site) => !consumedSiteIds.has(site.id));

  for (const atom of state.atoms) {
    const atomSites = rebuilt.filter((site) => site.atomId === atom.id);
    while (atomSites.length > atom.lonePairCount) {
      const removed = atomSites.pop();
      if (removed) rebuilt.splice(rebuilt.findIndex((site) => site.id === removed.id), 1);
    }
    while (atomSites.length < atom.lonePairCount) {
      const suffix = atomSites.length + 1;
      const candidate = {
        id: `lp_${atom.id}_${suffix}`,
        atomId: atom.id,
        angle: LONE_PAIR_ANGLES[atomSites.length] ?? atomSites.length * 60,
      };
      atomSites.push(candidate);
      rebuilt.push(candidate);
    }
  }

  return rebuilt;
}

export function applyArrowBundle(
  sourceState: MoleculeState,
  arrows: ArrowDraft[],
): TransformationResult {
  if (arrows.length === 0) {
    return { ok: false, issue: issue("EMPTY_DRAFT", "Add at least one curved arrow before checking.") };
  }

  const sourceKeys = new Set<string>();
  const lonePairDeltas = new Map<string, number>();
  const bondDeltas = new Map<string, { atomIds: readonly [string, string]; delta: number; id: string }>();
  const consumedSites = new Set<string>();

  for (const arrow of arrows) {
    const key = sourceKey(arrow.source);
    if (sourceKeys.has(key)) {
      return {
        ok: false,
        issue: issue(
          "DUPLICATE_ELECTRON_SOURCE",
          "The same electron pair cannot begin two arrows in one elementary step.",
          [arrow.source.entityId],
        ),
      };
    }
    sourceKeys.add(key);

    const targetAtom = getAtom(sourceState, arrow.target.entityId);
    if (!targetAtom) {
      return {
        ok: false,
        issue: issue("TARGET_NOT_SUPPORTED", "This milestone supports atom targets only.", [arrow.target.entityId]),
      };
    }

    if (arrow.source.kind === "lone_pair") {
      const site = sourceState.lonePairSites.find(
        (candidate) => candidate.id === arrow.source.entityId,
      );
      const sourceAtom = site ? getAtom(sourceState, site.atomId) : undefined;
      if (!site || !sourceAtom || sourceAtom.lonePairCount < 1) {
        return {
          ok: false,
          issue: issue(
            "SOURCE_HAS_NO_ELECTRON_PAIR",
            "That lone-pair source is not present in the current structure.",
            [arrow.source.entityId],
          ),
        };
      }
      if (sourceAtom.id === targetAtom.id) {
        return {
          ok: false,
          issue: issue(
            "SELF_BOND_ATTEMPT",
            "A lone pair cannot form a bond from an atom back to itself.",
            [sourceAtom.id],
          ),
        };
      }

      consumedSites.add(site.id);
      lonePairDeltas.set(sourceAtom.id, (lonePairDeltas.get(sourceAtom.id) ?? 0) - 1);
      const pair = pairKey(sourceAtom.id, targetAtom.id);
      const existing = bondDeltas.get(pair);
      bondDeltas.set(pair, {
        atomIds: [sourceAtom.id, targetAtom.id],
        delta: (existing?.delta ?? 0) + 1,
        id: existing?.id ?? bondIdForPair(sourceState, sourceAtom.id, targetAtom.id),
      });
      continue;
    }

    const sourceBond = getBond(sourceState, arrow.source.entityId);
    if (!sourceBond) {
      return {
        ok: false,
        issue: issue(
          "SOURCE_HAS_NO_ELECTRON_PAIR",
          "That bond is not present in the current structure.",
          [arrow.source.entityId],
        ),
      };
    }
    if (!sourceBond.atomIds.includes(targetAtom.id)) {
      return {
        ok: false,
        issue: issue(
          "TARGET_NOT_SUPPORTED",
          "When a bond supplies electrons, this milestone requires the arrow to end at one atom of that bond.",
          [sourceBond.id, targetAtom.id],
        ),
      };
    }

    const pair = pairKey(sourceBond.atomIds[0], sourceBond.atomIds[1]);
    const existing = bondDeltas.get(pair);
    bondDeltas.set(pair, {
      atomIds: sourceBond.atomIds,
      delta: (existing?.delta ?? 0) - 1,
      id: sourceBond.id,
    });
    lonePairDeltas.set(targetAtom.id, (lonePairDeltas.get(targetAtom.id) ?? 0) + 1);
  }

  const nextAtoms = sourceState.atoms.map((atom) => ({
    ...atom,
    position: { ...atom.position },
    lonePairCount: atom.lonePairCount + (lonePairDeltas.get(atom.id) ?? 0),
  }));

  if (nextAtoms.some((atom) => atom.lonePairCount < 0)) {
    return {
      ok: false,
      issue: issue("SOURCE_HAS_NO_ELECTRON_PAIR", "An electron source was consumed more than once."),
    };
  }

  const nextBonds: Bond[] = sourceState.bonds.map((bond) => ({
    ...bond,
    atomIds: [...bond.atomIds] as [string, string],
  }));
  for (const change of bondDeltas.values()) {
    const existingIndex = nextBonds.findIndex(
      (bond) => pairKey(bond.atomIds[0], bond.atomIds[1]) === pairKey(change.atomIds[0], change.atomIds[1]),
    );
    const previousOrder = existingIndex >= 0 ? nextBonds[existingIndex].order : 0;
    const nextOrder = previousOrder + change.delta;

    if (nextOrder < 0) {
      return {
        ok: false,
        issue: issue("NEGATIVE_BOND_ORDER", "The arrow bundle removes more bond order than exists.", [change.id]),
      };
    }
    if (nextOrder > 3) {
      return {
        ok: false,
        issue: issue("VALENCE_EXCEEDED", "This arrow bundle would create an unsupported bond order.", [change.id]),
      };
    }
    if (nextOrder === 0 && existingIndex >= 0) {
      nextBonds.splice(existingIndex, 1);
    } else if (nextOrder > 0 && existingIndex >= 0) {
      nextBonds[existingIndex] = { ...nextBonds[existingIndex], order: nextOrder as 1 | 2 | 3 };
    } else if (nextOrder > 0) {
      nextBonds.push({ id: change.id, atomIds: change.atomIds, order: nextOrder as 1 | 2 | 3 });
    }
  }

  const candidate: MoleculeState = {
    id: `${sourceState.id}_candidate`,
    label: "Candidate state",
    atoms: nextAtoms,
    bonds: nextBonds,
    lonePairSites: [],
  };
  candidate.atoms = candidate.atoms.map((atom) => ({
    ...atom,
    formalCharge: calculateFormalCharge(candidate, atom),
  }));
  candidate.lonePairSites = rebuildLonePairSites(candidate, consumedSites);

  const valenceIssue = validateValence(candidate);
  if (valenceIssue) return { ok: false, issue: valenceIssue };

  if (totalFormalCharge(candidate) !== totalFormalCharge(sourceState)) {
    return {
      ok: false,
      issue: issue(
        "NET_CHARGE_NOT_CONSERVED",
        "The arrow bundle does not conserve the total formal charge.",
        candidate.atoms.map((atom) => atom.id),
      ),
    };
  }

  return { ok: true, state: candidate };
}

export function stateSignature(state: MoleculeState): string {
  const atoms = state.atoms
    .map(
      (atom) =>
        `${atom.id}:${atom.element}:${atom.formalCharge}:${atom.lonePairCount}:${atom.implicitHydrogenCount}`,
    )
    .sort();
  const bonds = state.bonds
    .map((bond) => `${pairKey(bond.atomIds[0], bond.atomIds[1])}:${bond.order}`)
    .sort();
  return `${atoms.join("|")}#${bonds.join("|")}`;
}

function shortHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function validation(
  problem: ProblemDefinition,
  state: MoleculeState,
  arrows: ArrowDraft[],
  mechanismRevision: number,
  classification: ValidationResult["classification"],
  summary: string,
  issues: ValidationIssue[],
  nextStateId: string | null,
): ValidationResult {
  const signature = draftSignature(state, arrows);
  return {
    validationId: `check_${mechanismRevision}_${shortHash(`${problem.id}:${state.id}:${signature}`)}`,
    classification,
    summary,
    issues,
    nextStateId,
    problemId: problem.id,
    stateId: state.id,
    mechanismRevision,
    draftSignature: signature,
  };
}

export function validateDraftStep(
  problem: ProblemDefinition,
  stateId: string,
  arrows: ArrowDraft[],
  mechanismRevision: number,
): ValidationResult {
  const state = problem.states[stateId];
  if (!state) {
    return validation(
      problem,
      problem.states[problem.currentStateId],
      arrows,
      mechanismRevision,
      "invalid_input",
      "The committed state is not part of this exercise.",
      [issue("STALE_STATE", "Refresh the mechanism state before checking again.")],
      null,
    );
  }

  if (arrows.length === 0) {
    return validation(
      problem,
      state,
      arrows,
      mechanismRevision,
      "invalid_input",
      "There is no draft step to check.",
      [issue("EMPTY_DRAFT", "Add at least one arrow, then check the complete elementary step.")],
      null,
    );
  }

  if (stateId === problem.completedStateId) {
    return validation(
      problem,
      state,
      arrows,
      mechanismRevision,
      "not_accepted_path",
      "This authored mechanism is already complete.",
      [issue("NOT_IN_AUTHORED_PATH", "Undo the committed step before drafting another arrow.")],
      null,
    );
  }

  const step = problemStepForState(problem, stateId);
  if (!step) {
    return validation(
      problem,
      state,
      arrows,
      mechanismRevision,
      "invalid_input",
      "This committed state has no authored next step.",
      [issue("STALE_STATE", "Refresh the mechanism state before checking again.")],
      null,
    );
  }

  if (isStrictAcceptedSubset(step, state, arrows)) {
    const feedback = step.feedback.incomplete;
    return validation(
      problem,
      state,
      arrows,
      mechanismRevision,
      "incomplete",
      feedback.summary,
      [
        issue(
          "INCOMPLETE_CONCERTED_STEP",
          feedback.message,
          feedback.focusEntityIds,
        ),
      ],
      null,
    );
  }

  const bondDirectionDiagnostic = findBondDirectionDiagnostic(step, arrows);
  if (bondDirectionDiagnostic) {
    return validation(
      problem,
      state,
      arrows,
      mechanismRevision,
      "not_accepted_path",
      bondDirectionDiagnostic.summary,
      [
        issue(
          bondDirectionDiagnostic.code,
          bondDirectionDiagnostic.message,
          bondDirectionDiagnostic.focusEntityIds,
        ),
      ],
      null,
    );
  }

  const transformation = applyArrowBundle(state, arrows);
  if (!transformation.ok) {
    return validation(
      problem,
      state,
      arrows,
      mechanismRevision,
      "invalid_invariant",
      "The draft violates a supported chemistry invariant.",
      [transformation.issue],
      null,
    );
  }

  const arrowIsAccepted = step.acceptedBundles.some(
    (bundle) => acceptedSignature(state, bundle) === draftSignature(state, arrows),
  );
  const target = problem.states[step.toStateId];
  const stateIsAccepted = stateSignature(transformation.state) === stateSignature(target);

  if (arrowIsAccepted && stateIsAccepted) {
    const feedback = step.feedback.accepted;
    return validation(
      problem,
      state,
      arrows,
      mechanismRevision,
      "valid",
      feedback.summary,
      [
        issue(
          "VALID_ACCEPTED_STEP",
          feedback.message,
          feedback.focusEntityIds,
        ),
      ],
      step.toStateId,
    );
  }

  const feedback = step.feedback.notAccepted;
  return validation(
    problem,
    state,
    arrows,
    mechanismRevision,
    "not_accepted_path",
    feedback.summary,
    [
      issue(
        "NOT_IN_AUTHORED_PATH",
        feedback.message,
        feedback.focusEntityIds,
      ),
    ],
    null,
  );
}

export function assertExpectedRevision<T = undefined>(
  actualRevision: number,
  expectedRevision: number | undefined,
): CommandResult<T> {
  if (expectedRevision !== undefined && expectedRevision !== actualRevision) {
    return {
      ok: false,
      error: {
        code: "STALE_STATE",
        message: `Expected mechanism revision ${expectedRevision}, but the current revision is ${actualRevision}. Read state and try again.`,
      },
    };
  }
  return { ok: true };
}
