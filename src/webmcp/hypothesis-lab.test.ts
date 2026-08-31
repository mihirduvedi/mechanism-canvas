import { describe, expect, it, vi } from "vitest";
import { createMechanismStore } from "../store/mechanism-store";
import type { ProposedArrow } from "../domain/types";
import { createHypothesisLabManager } from "./hypothesis-lab";

const attackArrow: ProposedArrow = {
  source: { kind: "lone_pair", entityId: "lp_o_1" },
  target: { kind: "atom", entityId: "c_electrophile" },
};

const leavingArrow: ProposedArrow = {
  source: { kind: "bond", entityId: "bond_c_br" },
  target: { kind: "atom", entityId: "br_leaving" },
};

describe("Counterfactual Mechanism Lab", () => {
  it("checks competing branches without changing the learner's main draft", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createHypothesisLabManager(store);
    const started = manager.start(2);

    expect(started).toMatchObject({
      status: "active",
      problemId: "sn2_01",
      baseMechanismRevision: 0,
      labRevision: 0,
      branches: [
        { id: "hypothesis_a", label: "Path A", arrows: [] },
        { id: "hypothesis_b", label: "Path B", arrows: [] },
      ],
    });

    expect(manager.setBranch({
      branchId: "hypothesis_a",
      arrows: [attackArrow],
      rationale: "Test bond formation without moving the leaving-group bond pair.",
      expectedLabRevision: 0,
    })).toMatchObject({ ok: true, value: { id: "hypothesis_a" } });
    expect(manager.checkBranch({
      branchId: "hypothesis_a",
      expectedLabRevision: 1,
    })).toMatchObject({
      ok: true,
      value: { validation: { classification: "incomplete" } },
    });

    expect(manager.setBranch({
      branchId: "hypothesis_b",
      arrows: [attackArrow, leavingArrow],
      rationale: "Test the concerted substitution bundle with bond formation and cleavage.",
      expectedLabRevision: 2,
    })).toMatchObject({ ok: true, value: { id: "hypothesis_b" } });
    expect(manager.checkBranch({
      branchId: "hypothesis_b",
      expectedLabRevision: 3,
    })).toMatchObject({
      ok: true,
      value: { validation: { classification: "valid" } },
    });

    expect(store.getState()).toMatchObject({ mechanismRevision: 0, draftArrows: [] });
    expect(manager.getSnapshot()).toMatchObject({ labRevision: 4, status: "active" });
    manager.destroy();
  });

  it("compares checked evidence and stages only a valid branch for learner review", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createHypothesisLabManager(store);
    manager.start(2);
    manager.setBranch({
      branchId: "hypothesis_a",
      arrows: [attackArrow],
      rationale: "Single bond-forming move.",
      expectedLabRevision: 0,
    });
    manager.checkBranch({ branchId: "hypothesis_a", expectedLabRevision: 1 });
    manager.setBranch({
      branchId: "hypothesis_b",
      arrows: [attackArrow, leavingArrow],
      rationale: "Concerted substitution bundle.",
      expectedLabRevision: 2,
    });
    manager.checkBranch({ branchId: "hypothesis_b", expectedLabRevision: 3 });

    expect(manager.compareBranches({
      leftBranchId: "hypothesis_a",
      rightBranchId: "hypothesis_b",
      expectedLabRevision: 4,
    })).toMatchObject({
      ok: true,
      value: {
        sharedArrows: [attackArrow],
        leftOnlyArrows: [],
        rightOnlyArrows: [leavingArrow],
      },
    });
    expect(manager.recommendBranch({
      branchId: "hypothesis_a",
      rationale: "Use the shorter path.",
      expectedLabRevision: 5,
      expectedMechanismRevision: 0,
    })).toMatchObject({ ok: false, error: { code: "HYPOTHESIS_NOT_VALID" } });

    const recommended = manager.recommendBranch({
      branchId: "hypothesis_b",
      rationale: "Path B is the only branch that passes the deterministic concerted-step check.",
      expectedLabRevision: 5,
      expectedMechanismRevision: 0,
    });
    expect(recommended).toMatchObject({
      ok: true,
      value: { baseRevision: 0, arrows: [attackArrow, leavingArrow] },
    });
    expect(manager.getSnapshot()).toMatchObject({
      status: "recommended",
      labRevision: 6,
      recommendedBranchId: "hypothesis_b",
    });
    expect(store.getState()).toMatchObject({
      mechanismRevision: 0,
      draftArrows: [],
      agentProposal: { baseRevision: 0 },
    });

    const proposalId = store.getState().agentProposal?.id ?? "";
    expect(store.acceptAgentProposal(proposalId).ok).toBe(true);
    expect(store.getState()).toMatchObject({ mechanismRevision: 1 });
    expect(store.getState().draftArrows).toHaveLength(2);
    expect(store.getState().draftArrows.every((arrow) => arrow.actor === "agent")).toBe(true);
    manager.destroy();
  });

  it("guards stale lab writes and invalid entity or duplicate-source bundles", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createHypothesisLabManager(store);
    manager.start(2);

    expect(manager.setBranch({
      branchId: "hypothesis_a",
      arrows: [attackArrow],
      rationale: "A current branch.",
      expectedLabRevision: 7,
    })).toMatchObject({ ok: false, error: { code: "HYPOTHESIS_LAB_STALE" } });
    expect(manager.setBranch({
      branchId: "hypothesis_a",
      arrows: [attackArrow, attackArrow],
      rationale: "Move one source twice.",
      expectedLabRevision: 0,
    })).toMatchObject({ ok: false, error: { code: "HYPOTHESIS_INPUT_INVALID" } });
    expect(manager.setBranch({
      branchId: "hypothesis_a",
      arrows: [{
        source: { kind: "bond", entityId: "missing_bond" },
        target: { kind: "atom", entityId: "c_electrophile" },
      }],
      rationale: "Use an absent source.",
      expectedLabRevision: 0,
    })).toMatchObject({ ok: false, error: { code: "HYPOTHESIS_INPUT_INVALID" } });
    expect(manager.getSnapshot()?.labRevision).toBe(0);
    manager.destroy();
  });

  it("drifts immediately when the learner changes the bound main revision", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createHypothesisLabManager(store);
    const listener = vi.fn();
    manager.subscribe(listener);
    manager.start(2);

    store.addDraftArrow({
      source: attackArrow.source,
      target: attackArrow.target,
      actor: "human",
    });

    expect(manager.getSnapshot()).toMatchObject({
      status: "drifted",
      driftReason: expect.stringContaining("main draft"),
    });
    expect(listener).toHaveBeenCalled();
    expect(manager.checkBranch({
      branchId: "hypothesis_a",
      expectedLabRevision: 0,
    })).toMatchObject({ ok: false, error: { code: "HYPOTHESIS_LAB_DRIFTED" } });
    manager.destroy();
  });

  it("keeps the sealed branch evidence readable after the learner switches exercises", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createHypothesisLabManager(store);
    manager.start(2);
    manager.setBranch({
      branchId: "hypothesis_a",
      arrows: [attackArrow],
      rationale: "Preserve this isolated hypothesis after scope drift.",
      expectedLabRevision: 0,
    });

    expect(store.switchProblem("proton_transfer_01", "human").ok).toBe(true);
    expect(manager.getSnapshot()).toMatchObject({
      problemId: "sn2_01",
      stateId: "sn2_reactants",
      status: "drifted",
      labRevision: 1,
      branches: expect.arrayContaining([
        expect.objectContaining({ id: "hypothesis_a", arrows: [attackArrow] }),
      ]),
      driftReason: expect.stringContaining("different exercise"),
    });
    manager.destroy();
  });

  it("keeps the learner as the only lab lifecycle authority", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createHypothesisLabManager(store);
    const started = manager.start(3);
    expect(started.branches).toHaveLength(3);
    expect(() => manager.start(2)).toThrow(
      "End the current Counterfactual Lab before starting another.",
    );
    expect(manager.end()?.id).toBe(started.id);
    expect(manager.getSnapshot()).toBeNull();
    expect(manager.checkBranch({
      branchId: "hypothesis_a",
      expectedLabRevision: 0,
    })).toMatchObject({ ok: false, error: { code: "HYPOTHESIS_LAB_INACTIVE" } });
    manager.destroy();
  });
});
