import { describe, expect, it } from "vitest";
import { createMechanismStore } from "./mechanism-store";

function addAcceptedBundle(store: ReturnType<typeof createMechanismStore>) {
  const first = store.addDraftArrow({
    source: { kind: "lone_pair", entityId: "lp_o_1" },
    target: { kind: "atom", entityId: "c_electrophile" },
    actor: "human",
  });
  const second = store.addDraftArrow({
    source: { kind: "bond", entityId: "bond_c_br" },
    target: { kind: "atom", entityId: "br_leaving" },
    actor: "human",
  });
  expect(first.ok).toBe(true);
  expect(second.ok).toBe(true);
}

function addAcceptedProtonTransferBundle(store: ReturnType<typeof createMechanismStore>) {
  expect(store.switchProblem("proton_transfer_01", "human").ok).toBe(true);
  expect(
    store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_n_1" },
      target: { kind: "atom", entityId: "h_transfer" },
      actor: "human",
    }).ok,
  ).toBe(true);
  expect(
    store.addDraftArrow({
      source: { kind: "bond", entityId: "bond_o_h_transfer" },
      target: { kind: "atom", entityId: "o_acid" },
      actor: "human",
    }).ok,
  ).toBe(true);
}

describe("mechanism command store", () => {
  it("checks, commits, and reverses the complete SN2 journey", () => {
    const store = createMechanismStore(undefined, null);
    addAcceptedBundle(store);

    const checked = store.checkDraftStep("human");
    expect(checked.ok).toBe(true);
    expect(checked.value?.classification).toBe("valid");

    const commit = store.commitCheckedStep(checked.value?.validationId ?? "", "human");
    expect(commit.ok).toBe(true);
    expect(store.getState().currentStateId).toBe("sn2_products");
    expect(store.getState().history).toHaveLength(1);

    const undo = store.undoLastCommit("human");
    expect(undo.ok).toBe(true);
    expect(store.getState().currentStateId).toBe("sn2_reactants");
    expect(store.getState().history[0].undoneAt).not.toBeNull();
  });

  it("checks, commits, and reverses the complete proton-transfer journey", () => {
    const store = createMechanismStore(undefined, null);
    addAcceptedProtonTransferBundle(store);

    const checked = store.checkDraftStep("human");
    expect(checked.value?.classification).toBe("valid");
    expect(checked.value?.problemId).toBe("proton_transfer_01");
    expect(store.commitCheckedStep(checked.value?.validationId ?? "", "human").ok).toBe(true);
    expect(store.getState().currentStateId).toBe("proton_transfer_products");
    expect(store.getState().activity.at(-1)?.summary).toContain("proton-transfer");
    expect(store.undoLastCommit("human").ok).toBe(true);
    expect(store.getState().currentStateId).toBe("proton_transfer_reactants");
  });

  it("invalidates a check token after a draft mutation", () => {
    const store = createMechanismStore(undefined, null);
    addAcceptedBundle(store);
    const checked = store.checkDraftStep("human");
    expect(checked.value?.classification).toBe("valid");

    const arrowId = store.getState().draftArrows[0].id;
    store.removeDraftArrow(arrowId, "human");
    const commit = store.commitCheckedStep(checked.value?.validationId ?? "", "human");
    expect(commit.ok).toBe(false);
    expect(commit.error?.code).toBe("STALE_VALIDATION");
  });

  it("rejects writes made against a stale mechanism revision", () => {
    const store = createMechanismStore(undefined, null);
    const result = store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_o_1" },
      target: { kind: "atom", entityId: "c_electrophile" },
      actor: "agent",
      expectedRevision: 12,
    });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("STALE_STATE");
    expect(store.getState().draftArrows).toHaveLength(0);
  });

  it("tracks scaffold help without changing the mechanism revision", () => {
    const store = createMechanismStore(undefined, null);
    const before = store.getState().mechanismRevision;
    const result = store.requestScaffold(3, "agent");
    expect(result.ok).toBe(true);
    expect(store.getState().mechanismRevision).toBe(before);
    expect(store.getState().highestScaffoldLevel).toBe(3);
    expect(store.getState().hintCount).toBe(1);
    expect(store.getState().activity.at(-1)?.actor).toBe("agent");
  });

  it("persists work but deliberately drops validation capability on restore", () => {
    const storage = window.localStorage;
    const first = createMechanismStore(undefined, storage);
    addAcceptedBundle(first);
    const checked = first.checkDraftStep("human");
    expect(checked.value?.classification).toBe("valid");

    const restored = createMechanismStore(undefined, storage);
    expect(restored.getState().draftArrows).toHaveLength(2);
    expect(restored.getState().latestValidation).toBeNull();
    const commit = restored.commitCheckedStep(checked.value?.validationId ?? "", "human");
    expect(commit.ok).toBe(false);
    expect(commit.error?.code).toBe("STALE_VALIDATION");
  });

  it("preserves separate progress while one authoritative store switches problems", () => {
    const storage = window.localStorage;
    const first = createMechanismStore(undefined, storage);
    expect(
      first.addDraftArrow({
        source: { kind: "lone_pair", entityId: "lp_o_1" },
        target: { kind: "atom", entityId: "c_electrophile" },
        actor: "human",
      }).ok,
    ).toBe(true);
    expect(first.switchProblem("proton_transfer_01", "human").ok).toBe(true);
    expect(
      first.addDraftArrow({
        source: { kind: "lone_pair", entityId: "lp_n_1" },
        target: { kind: "atom", entityId: "h_transfer" },
        actor: "human",
      }).ok,
    ).toBe(true);

    const restored = createMechanismStore(undefined, storage);
    expect(restored.getProblem().id).toBe("proton_transfer_01");
    expect(restored.getState().draftArrows).toHaveLength(1);
    expect(restored.switchProblem("sn2_01", "human").ok).toBe(true);
    expect(restored.getState().draftArrows).toHaveLength(1);
    expect(restored.getState().draftArrows[0].source.entityId).toBe("lp_o_1");
    expect(restored.getState().latestValidation).toBeNull();
  });

  it("resets every exercise artifact while keeping the revision monotonic", () => {
    const store = createMechanismStore(undefined, null);
    addAcceptedBundle(store);
    store.requestScaffold(4, "human");
    const beforeReset = store.getState().mechanismRevision;

    const reset = store.resetProblem("human");

    expect(reset.ok).toBe(true);
    expect(store.getState()).toMatchObject({
      currentStateId: "sn2_reactants",
      draftArrows: [],
      history: [],
      highestScaffoldLevel: 0,
      attemptCount: 0,
      hintCount: 0,
      mechanismRevision: beforeReset + 1,
    });
    expect(store.getState().activity).toHaveLength(1);
    expect(store.getState().activity[0].kind).toBe("problem_reset");
  });
});
