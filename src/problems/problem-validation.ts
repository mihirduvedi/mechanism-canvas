import {
  applyArrowBundle,
  calculateFormalCharge,
  stateSignature,
  totalFormalCharge,
  validateDraftStep,
} from "../domain/chemistry";
import type {
  AcceptedArrow,
  ArrowDraft,
  MoleculeState,
  ProblemDefinition,
} from "../domain/types";

function entityIds(state: MoleculeState): Set<string> {
  return new Set([
    ...state.atoms.map((atom) => atom.id),
    ...state.bonds.map((bond) => bond.id),
    ...state.lonePairSites.map((site) => site.id),
  ]);
}

function arrowDrafts(arrows: AcceptedArrow[], prefix: string): ArrowDraft[] {
  return arrows.map((arrow, index) => ({
    id: `${prefix}_${index + 1}`,
    source: arrow.source,
    target: arrow.target,
    actor: "human",
  }));
}

function normalizedPair(first: string, second: string): string {
  return [first, second].sort().join("::");
}

export function problemDefinitionErrors(problem: ProblemDefinition): string[] {
  const errors: string[] = [];
  const add = (message: string) => errors.push(`${problem.id}: ${message}`);
  const initial = problem.states[problem.currentStateId];
  const completed = problem.states[problem.completedStateId];

  if (!problem.id.trim()) add("problem ID is empty");
  if (!initial) add(`initial state ${problem.currentStateId} does not exist`);
  if (!completed) add(`completed state ${problem.completedStateId} does not exist`);
  if (problem.currentStateId === problem.completedStateId) add("initial and completed states must differ");
  if (problem.stepCount !== 1) add("this milestone supports exactly one authored step per problem");
  if (problem.acceptedBundles.length === 0) add("at least one accepted arrow bundle is required");
  if (problem.negativeCases.length < 4) add("at least four named negative cases are required");
  if (problem.review.sources.length < 2) add("at least two chemistry sources are required");
  if (problem.scaffold.map((entry) => entry.level).join(",") !== "1,2,3,4") {
    add("scaffold levels must appear exactly once in the order 1,2,3,4");
  }

  const stateList = Object.values(problem.states);
  for (const state of stateList) {
    const ids = [
      ...state.atoms.map((atom) => atom.id),
      ...state.bonds.map((bond) => bond.id),
      ...state.lonePairSites.map((site) => site.id),
    ];
    if (new Set(ids).size !== ids.length) add(`state ${state.id} contains duplicate entity IDs`);
    if (state.id === "" || problem.states[state.id] !== state) {
      add(`state map key and authored ID disagree for ${state.id || "an unnamed state"}`);
    }

    const atomIds = new Set(state.atoms.map((atom) => atom.id));
    const bondPairs = new Set<string>();
    for (const atom of state.atoms) {
      if (!Number.isFinite(atom.position.x) || !Number.isFinite(atom.position.y)) {
        add(`atom ${atom.id} has non-finite coordinates in ${state.id}`);
      }
      if (atom.lonePairCount < 0 || atom.implicitHydrogenCount < 0) {
        add(`atom ${atom.id} has a negative electron or hydrogen count in ${state.id}`);
      }
      if (calculateFormalCharge(state, atom) !== atom.formalCharge) {
        add(`atom ${atom.id} has a stored formal charge that disagrees with its Lewis structure in ${state.id}`);
      }
      const siteCount = state.lonePairSites.filter((site) => site.atomId === atom.id).length;
      if (siteCount !== atom.lonePairCount) {
        add(`atom ${atom.id} has ${atom.lonePairCount} lone pairs but ${siteCount} authored sites in ${state.id}`);
      }
    }
    for (const bond of state.bonds) {
      if (!atomIds.has(bond.atomIds[0]) || !atomIds.has(bond.atomIds[1])) {
        add(`bond ${bond.id} references a missing atom in ${state.id}`);
      }
      const pair = normalizedPair(bond.atomIds[0], bond.atomIds[1]);
      if (bondPairs.has(pair)) add(`state ${state.id} contains duplicate bonds for ${pair}`);
      bondPairs.add(pair);
    }
    for (const site of state.lonePairSites) {
      if (!atomIds.has(site.atomId)) add(`lone pair ${site.id} references a missing atom in ${state.id}`);
      if (!Number.isFinite(site.angle)) add(`lone pair ${site.id} has a non-finite angle in ${state.id}`);
    }
  }

  if (initial && completed) {
    const initialAtoms = [...initial.atoms]
      .map((atom) => `${atom.id}:${atom.element}`)
      .sort()
      .join("|");
    const completedAtoms = [...completed.atoms]
      .map((atom) => `${atom.id}:${atom.element}`)
      .sort()
      .join("|");
    if (initialAtoms !== completedAtoms) add("atom inventory or element identity changes between states");
    if (totalFormalCharge(initial) !== totalFormalCharge(completed)) {
      add("net formal charge changes between initial and completed states");
    }

    const initialIds = entityIds(initial);
    const feedbackGroups = [
      problem.feedback.incomplete,
      problem.feedback.accepted,
      problem.feedback.notAccepted,
      ...problem.feedback.bondDirection,
    ];
    for (const feedback of feedbackGroups) {
      const missing = feedback.focusEntityIds.find((id) => !initialIds.has(id));
      if (missing) add(`feedback references missing initial-state entity ${missing}`);
    }
    for (const diagnostic of problem.feedback.bondDirection) {
      if (!initial.bonds.some((bond) => bond.id === diagnostic.sourceBondId)) {
        add(`bond-direction diagnostic references missing bond ${diagnostic.sourceBondId}`);
      }
      if (!initial.atoms.some((atom) => atom.id === diagnostic.incorrectTargetAtomId)) {
        add(`bond-direction diagnostic references missing target ${diagnostic.incorrectTargetAtomId}`);
      }
    }
    for (const scaffold of problem.scaffold) {
      const missing = scaffold.focusEntityIds.find((id) => !initialIds.has(id));
      if (missing) add(`scaffold ${scaffold.level} references missing initial-state entity ${missing}`);
    }

    for (const [bundleIndex, bundle] of problem.acceptedBundles.entries()) {
      const draft = arrowDrafts(bundle, `accepted_${bundleIndex + 1}`);
      const transformation = applyArrowBundle(initial, draft);
      if (!transformation.ok) {
        add(`accepted bundle ${bundleIndex + 1} fails transformation with ${transformation.issue.code}`);
      } else if (stateSignature(transformation.state) !== stateSignature(completed)) {
        add(`accepted bundle ${bundleIndex + 1} does not produce the completed state`);
      }
      const validation = validateDraftStep(problem, problem.currentStateId, draft, 0);
      if (validation.classification !== "valid") {
        add(`accepted bundle ${bundleIndex + 1} validates as ${validation.classification}`);
      }
    }

    for (const negativeCase of problem.negativeCases) {
      const result = validateDraftStep(
        problem,
        problem.currentStateId,
        arrowDrafts(negativeCase.arrows, negativeCase.id),
        0,
      );
      if (result.classification !== negativeCase.expectedClassification) {
        add(
          `negative case ${negativeCase.id} expected ${negativeCase.expectedClassification} but received ${result.classification}`,
        );
      }
      if (result.issues[0]?.code !== negativeCase.expectedReasonCode) {
        add(
          `negative case ${negativeCase.id} expected ${negativeCase.expectedReasonCode} but received ${result.issues[0]?.code ?? "no reason code"}`,
        );
      }
    }
  }

  return errors;
}

export function assertProblemDefinition(problem: ProblemDefinition): void {
  const errors = problemDefinitionErrors(problem);
  if (errors.length > 0) throw new Error(`Invalid chemistry fixture:\n${errors.join("\n")}`);
}

export function assertProblemCatalog(problems: readonly ProblemDefinition[]): void {
  const ids = problems.map((problem) => problem.id);
  if (new Set(ids).size !== ids.length) throw new Error("Problem catalog contains duplicate IDs.");
  for (const problem of problems) assertProblemDefinition(problem);
}

export function createProductionProblemCatalog(
  problems: readonly ProblemDefinition[],
): readonly ProblemDefinition[] {
  assertProblemCatalog(problems);
  const unverified = problems.filter((problem) => problem.review.status !== "verified");
  if (unverified.length > 0) {
    throw new Error(
      `Production catalog rejected unverified fixtures: ${unverified.map((problem) => problem.id).join(", ")}`,
    );
  }
  return Object.freeze([...problems]);
}
