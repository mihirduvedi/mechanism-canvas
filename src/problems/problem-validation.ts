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
  if (problem.stepCount !== problem.steps.length) add("step count must match the authored step list");
  if (problem.steps.length === 0) add("at least one authored step is required");
  if (problem.review.sources.length < 2) add("at least two chemistry sources are required");

  const stepIds = problem.steps.map((step) => step.id);
  if (new Set(stepIds).size !== stepIds.length) add("authored step IDs must be unique");
  if (problem.steps[0]?.fromStateId !== problem.currentStateId) {
    add("the first authored step must begin at the problem's initial state");
  }
  if (problem.steps.at(-1)?.toStateId !== problem.completedStateId) {
    add("the last authored step must end at the problem's completed state");
  }
  for (let index = 1; index < problem.steps.length; index += 1) {
    if (problem.steps[index - 1].toStateId !== problem.steps[index].fromStateId) {
      add(`step ${problem.steps[index].id} does not continue from the previous authored state`);
    }
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
    for (const state of stateList) {
      const stateAtoms = [...state.atoms]
        .map((atom) => `${atom.id}:${atom.element}`)
        .sort()
        .join("|");
      if (initialAtoms !== stateAtoms) add(`atom inventory or element identity changes in ${state.id}`);
      if (totalFormalCharge(initial) !== totalFormalCharge(state)) {
        add(`net formal charge changes in ${state.id}`);
      }
    }

    for (const step of problem.steps) {
      const from = problem.states[step.fromStateId];
      const to = problem.states[step.toStateId];
      if (!from) {
        add(`step ${step.id} starts from missing state ${step.fromStateId}`);
        continue;
      }
      if (!to) {
        add(`step ${step.id} ends at missing state ${step.toStateId}`);
        continue;
      }
      if (step.fromStateId === step.toStateId) add(`step ${step.id} does not change state`);
      if (step.acceptedBundles.length === 0) add(`step ${step.id} needs an accepted arrow bundle`);
      if (step.negativeCases.length < 4) add(`step ${step.id} needs at least four negative cases`);
      if (step.scaffold.map((entry) => entry.level).join(",") !== "1,2,3,4") {
        add(`step ${step.id} scaffold levels must appear exactly once in the order 1,2,3,4`);
      }

      const fromIds = entityIds(from);
      const feedbackGroups = [
        step.feedback.incomplete,
        step.feedback.accepted,
        step.feedback.notAccepted,
        ...step.feedback.bondDirection,
      ];
      for (const feedback of feedbackGroups) {
        const missing = feedback.focusEntityIds.find((id) => !fromIds.has(id));
        if (missing) add(`step ${step.id} feedback references missing entity ${missing}`);
      }
      for (const diagnostic of step.feedback.bondDirection) {
        if (!from.bonds.some((bond) => bond.id === diagnostic.sourceBondId)) {
          add(`step ${step.id} diagnostic references missing bond ${diagnostic.sourceBondId}`);
        }
        if (!from.atoms.some((atom) => atom.id === diagnostic.incorrectTargetAtomId)) {
          add(`step ${step.id} diagnostic references missing target ${diagnostic.incorrectTargetAtomId}`);
        }
      }
      for (const scaffold of step.scaffold) {
        const missing = scaffold.focusEntityIds.find((id) => !fromIds.has(id));
        if (missing) add(`step ${step.id} scaffold ${scaffold.level} references missing entity ${missing}`);
      }

      for (const [bundleIndex, bundle] of step.acceptedBundles.entries()) {
        const draft = arrowDrafts(bundle, `${step.id}_accepted_${bundleIndex + 1}`);
        const transformation = applyArrowBundle(from, draft);
        if (!transformation.ok) {
          add(`step ${step.id} bundle ${bundleIndex + 1} fails with ${transformation.issue.code}`);
        } else if (stateSignature(transformation.state) !== stateSignature(to)) {
          add(`step ${step.id} bundle ${bundleIndex + 1} does not produce ${to.id}`);
        }
        const validation = validateDraftStep(problem, step.fromStateId, draft, 0);
        if (validation.classification !== "valid") {
          add(`step ${step.id} bundle ${bundleIndex + 1} validates as ${validation.classification}`);
        }
      }

      for (const negativeCase of step.negativeCases) {
        const result = validateDraftStep(
          problem,
          step.fromStateId,
          arrowDrafts(negativeCase.arrows, negativeCase.id),
          0,
        );
        if (result.classification !== negativeCase.expectedClassification) {
          add(`negative case ${negativeCase.id} expected ${negativeCase.expectedClassification} but received ${result.classification}`);
        }
        if (result.issues[0]?.code !== negativeCase.expectedReasonCode) {
          add(`negative case ${negativeCase.id} expected ${negativeCase.expectedReasonCode} but received ${result.issues[0]?.code ?? "no reason code"}`);
        }
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
