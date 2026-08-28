import { describe, expect, it } from "vitest";
import {
  applyArrowBundle,
  calculateFormalCharge,
  stateSignature,
  validateDraftStep,
} from "./chemistry";
import type { ArrowDraft } from "./types";
import { protonTransferProblem } from "../problems/proton-transfer-01";
import { sn2Problem } from "../problems/sn2-01";

const attackArrow: ArrowDraft = {
  id: "test_attack",
  source: { kind: "lone_pair", entityId: "lp_o_2" },
  target: { kind: "atom", entityId: "c_electrophile" },
  actor: "human",
};

const departureArrow: ArrowDraft = {
  id: "test_departure",
  source: { kind: "bond", entityId: "bond_c_br" },
  target: { kind: "atom", entityId: "br_leaving" },
  actor: "human",
};

describe("SN2 chemistry engine", () => {
  const reactants = sn2Problem.states.sn2_reactants;

  it("derives the authored formal charges from electrons and bond order", () => {
    const oxygen = reactants.atoms.find((atom) => atom.id === "o_nucleophile");
    const bromine = reactants.atoms.find((atom) => atom.id === "br_leaving");
    expect(oxygen && calculateFormalCharge(reactants, oxygen)).toBe(-1);
    expect(bromine && calculateFormalCharge(reactants, bromine)).toBe(0);
  });

  it("diagnoses a correct attack arrow as an incomplete concerted step", () => {
    const result = validateDraftStep(sn2Problem, "sn2_reactants", [attackArrow], 1);
    expect(result.classification).toBe("incomplete");
    expect(result.issues[0].code).toBe("INCOMPLETE_CONCERTED_STEP");
    expect(result.nextStateId).toBeNull();
  });

  it("applies both arrows atomically and reaches the authored product graph", () => {
    const sourceSnapshot = stateSignature(reactants);
    const result = applyArrowBundle(reactants, [attackArrow, departureArrow]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(stateSignature(result.state)).toBe(stateSignature(sn2Problem.states.sn2_products));
    expect(stateSignature(reactants)).toBe(sourceSnapshot);
  });

  it("accepts any equivalent authored oxygen lone-pair site", () => {
    const result = validateDraftStep(
      sn2Problem,
      "sn2_reactants",
      [departureArrow, attackArrow],
      2,
    );
    expect(result.classification).toBe("valid");
    expect(result.issues[0].code).toBe("VALID_ACCEPTED_STEP");
    expect(result.nextStateId).toBe("sn2_products");
  });

  it("reports a bond arrow aimed back at carbon as a directional reasoning error", () => {
    const wrongDeparture: ArrowDraft = {
      ...departureArrow,
      id: "wrong_departure",
      target: { kind: "atom", entityId: "c_electrophile" },
    };
    const result = validateDraftStep(
      sn2Problem,
      "sn2_reactants",
      [attackArrow, wrongDeparture],
      2,
    );
    expect(result.classification).toBe("not_accepted_path");
    expect(result.issues[0].code).toBe("WRONG_LEAVING_GROUP_DIRECTION");
  });

  it("rejects reusing the exact same electron pair twice", () => {
    const duplicateAttack: ArrowDraft = {
      ...attackArrow,
      id: "duplicate_attack",
      target: { kind: "atom", entityId: "br_leaving" },
    };
    const result = applyArrowBundle(reactants, [attackArrow, duplicateAttack]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issue.code).toBe("DUPLICATE_ELECTRON_SOURCE");
  });
});

describe("proton-transfer chemistry engine", () => {
  const reactants = protonTransferProblem.states.proton_transfer_reactants;
  const acceptanceArrow: ArrowDraft = {
    id: "test_proton_acceptance",
    source: { kind: "lone_pair", entityId: "lp_n_1" },
    target: { kind: "atom", entityId: "h_transfer" },
    actor: "human",
  };
  const bondReturnArrow: ArrowDraft = {
    id: "test_bond_return",
    source: { kind: "bond", entityId: "bond_o_h_transfer" },
    target: { kind: "atom", entityId: "o_acid" },
    actor: "human",
  };

  it("derives the authored hydronium and ammonia formal charges", () => {
    const nitrogen = reactants.atoms.find((atom) => atom.id === "n_base");
    const oxygen = reactants.atoms.find((atom) => atom.id === "o_acid");
    expect(nitrogen && calculateFormalCharge(reactants, nitrogen)).toBe(0);
    expect(oxygen && calculateFormalCharge(reactants, oxygen)).toBe(1);
  });

  it("requires bond formation and bond cleavage in the same elementary step", () => {
    const partial = validateDraftStep(
      protonTransferProblem,
      protonTransferProblem.currentStateId,
      [acceptanceArrow],
      1,
    );
    expect(partial.classification).toBe("incomplete");
    expect(partial.issues[0].code).toBe("INCOMPLETE_CONCERTED_STEP");

    const complete = validateDraftStep(
      protonTransferProblem,
      protonTransferProblem.currentStateId,
      [acceptanceArrow, bondReturnArrow],
      2,
    );
    expect(complete.classification).toBe("valid");
    expect(complete.nextStateId).toBe("proton_transfer_products");
  });

  it("moves the mapped hydrogen from oxygen to nitrogen without changing atom inventory", () => {
    const result = applyArrowBundle(reactants, [acceptanceArrow, bondReturnArrow]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(stateSignature(result.state)).toBe(
      stateSignature(protonTransferProblem.states.proton_transfer_products),
    );
    expect(result.state.atoms.map((atom) => atom.id).sort()).toEqual(
      reactants.atoms.map((atom) => atom.id).sort(),
    );
  });

  it("uses authored proton-transfer copy for the reversed O–H bond arrow", () => {
    const wrongDirection: ArrowDraft = {
      ...bondReturnArrow,
      target: { kind: "atom", entityId: "h_transfer" },
    };
    const result = validateDraftStep(
      protonTransferProblem,
      protonTransferProblem.currentStateId,
      [acceptanceArrow, wrongDirection],
      2,
    );
    expect(result.classification).toBe("not_accepted_path");
    expect(result.issues[0].code).toBe("WRONG_BOND_DIRECTION");
    expect(result.summary).toContain("O–H bond electrons");
  });
});
