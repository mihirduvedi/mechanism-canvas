import { describe, expect, it } from "vitest";
import { ammoniaAlkylationProblem } from "../problems/ammonia-alkylation-01";
import { protonTransferProblem } from "../problems/proton-transfer-01";
import { sn2Problem } from "../problems/sn2-01";
import { createMechanismStore } from "../store/mechanism-store";
import {
  availableStepComparisons,
  compareMoleculeStates,
  compareReachedStep,
} from "./mechanism-comparison";

function commitSn2Step() {
  const store = createMechanismStore(undefined, null);
  store.addDraftArrow({
    source: { kind: "lone_pair", entityId: "lp_o_1" },
    target: { kind: "atom", entityId: "c_electrophile" },
    actor: "human",
  });
  store.addDraftArrow({
    source: { kind: "bond", entityId: "bond_c_br" },
    target: { kind: "atom", entityId: "br_leaving" },
    actor: "human",
  });
  const checked = store.checkDraftStep("human");
  store.commitCheckedStep(checked.value?.validationId ?? "", "human");
  return store;
}

describe("mechanism state comparison", () => {
  it("reports exact bond and electron-bookkeeping changes for SN2", () => {
    const comparison = compareMoleculeStates(
      sn2Problem.states.sn2_reactants,
      sn2Problem.states.sn2_products,
    );

    expect(comparison.summary).toBe("1 bond formed; 1 bond broken; 4 atom properties changed");
    expect(comparison.bondChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          change: "formed",
          atomIds: expect.arrayContaining(["c_electrophile", "o_nucleophile"]),
          beforeOrder: 0,
          afterOrder: 1,
        }),
        expect.objectContaining({
          change: "broken",
          atomIds: expect.arrayContaining(["c_electrophile", "br_leaving"]),
          beforeOrder: 1,
          afterOrder: 0,
        }),
      ]),
    );
    expect(comparison.atomChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          atomId: "o_nucleophile",
          property: "formalCharge",
          before: -1,
          after: 0,
        }),
        expect.objectContaining({
          atomId: "br_leaving",
          property: "lonePairCount",
          before: 3,
          after: 4,
        }),
      ]),
    );
  });

  it("tracks the mapped proton and charge redistribution in proton transfer", () => {
    const comparison = compareMoleculeStates(
      protonTransferProblem.states.proton_transfer_reactants,
      protonTransferProblem.states.proton_transfer_products,
    );

    expect(comparison.bondChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ change: "formed", atomIds: ["n_base", "h_transfer"] }),
        expect.objectContaining({ change: "broken", atomIds: ["o_acid", "h_transfer"] }),
      ]),
    );
    expect(comparison.atomChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ atomId: "n_base", property: "formalCharge", after: 1 }),
        expect.objectContaining({ atomId: "o_acid", property: "formalCharge", after: 0 }),
      ]),
    );
    expect(comparison.changedEntityIds).toContain("h_transfer");
  });

  it("keeps each capstone transition separate", () => {
    const first = compareMoleculeStates(
      ammoniaAlkylationProblem.states.amine_reactants,
      ammoniaAlkylationProblem.states.methylammonium_intermediate,
    );
    const second = compareMoleculeStates(
      ammoniaAlkylationProblem.states.methylammonium_intermediate,
      ammoniaAlkylationProblem.states.amine_products,
    );

    expect(first.bondChanges.map((change) => change.change)).toEqual(
      expect.arrayContaining(["formed", "broken"]),
    );
    expect(first.atomChanges.some((change) => change.atomId === "br_leaving")).toBe(true);
    expect(second.bondChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ change: "broken", atomIds: ["n_attacker", "h_transfer"] }),
        expect.objectContaining({ change: "formed", atomIds: ["n_base", "h_transfer"] }),
      ]),
    );
    expect(second.atomChanges.some((change) => change.atomId === "br_leaving")).toBe(false);
  });

  it("offers only currently active reached transitions and relocks an undone product", () => {
    const store = commitSn2Step();
    const available = availableStepComparisons(store.getProblem(), store.getState());

    expect(available).toHaveLength(1);
    expect(available[0]).toMatchObject({
      stepIndex: 1,
      beforeStateId: "sn2_reactants",
      afterStateId: "sn2_products",
      arrowBundle: expect.arrayContaining([
        expect.objectContaining({ source: { kind: "bond", entityId: "bond_c_br" } }),
      ]),
    });
    expect(
      compareReachedStep(store.getProblem(), store.getState(), "sn2_reactants", "sn2_products"),
    ).toMatchObject({ comparison: { summary: expect.stringContaining("bond formed") } });

    expect(store.undoLastCommit("human").ok).toBe(true);
    expect(availableStepComparisons(store.getProblem(), store.getState())).toEqual([]);
    expect(
      compareReachedStep(store.getProblem(), store.getState(), "sn2_reactants", "sn2_products"),
    ).toBeNull();
    expect(store.viewHistoryState("sn2_products", "human")).toMatchObject({
      ok: false,
      error: { code: "TARGET_NOT_SUPPORTED" },
    });
  });
});
