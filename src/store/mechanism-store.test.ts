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

function addCapstoneStepOne(store: ReturnType<typeof createMechanismStore>) {
  expect(store.switchProblem("ammonia_alkylation_01", "human").ok).toBe(true);
  expect(
    store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_n_attack_1" },
      target: { kind: "atom", entityId: "c_methyl" },
      actor: "human",
    }).ok,
  ).toBe(true);
  expect(
    store.addDraftArrow({
      source: { kind: "bond", entityId: "bond_c_br" },
      target: { kind: "atom", entityId: "br_leaving" },
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

  it("commits a two-step capstone, guards future states, and undoes one step at a time", () => {
    const store = createMechanismStore(undefined, null);
    addCapstoneStepOne(store);

    expect(store.viewHistoryState("amine_products", "human")).toMatchObject({
      ok: false,
      error: { code: "TARGET_NOT_SUPPORTED" },
    });
    const firstCheck = store.checkDraftStep("human");
    expect(firstCheck.value?.classification).toBe("valid");
    expect(store.commitCheckedStep(firstCheck.value?.validationId ?? "", "human").ok).toBe(true);
    expect(store.getState()).toMatchObject({
      currentStateId: "methylammonium_intermediate",
      historyViewStateId: null,
      highestScaffoldLevel: 0,
    });

    const revisionAfterFirstCommit = store.getState().mechanismRevision;
    expect(store.viewHistoryState("amine_reactants", "human").ok).toBe(true);
    expect(store.getState().historyViewStateId).toBe("amine_reactants");
    expect(store.getState().mechanismRevision).toBe(revisionAfterFirstCommit);
    expect(store.viewHistoryState("methylammonium_intermediate", "human").ok).toBe(true);
    expect(store.getState().historyViewStateId).toBeNull();

    store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_n_base_1" },
      target: { kind: "atom", entityId: "h_transfer" },
      actor: "human",
    });
    store.addDraftArrow({
      source: { kind: "bond", entityId: "bond_n_attack_h_transfer" },
      target: { kind: "atom", entityId: "n_attacker" },
      actor: "human",
    });
    const secondCheck = store.checkDraftStep("human");
    expect(secondCheck.value?.classification).toBe("valid");
    expect(store.commitCheckedStep(secondCheck.value?.validationId ?? "", "human").ok).toBe(true);
    expect(store.getState().currentStateId).toBe("amine_products");
    expect(store.getState().history.filter((record) => record.undoneAt === null)).toHaveLength(2);

    expect(store.undoLastCommit("human").ok).toBe(true);
    expect(store.getState().currentStateId).toBe("methylammonium_intermediate");
    expect(store.undoLastCommit("human").ok).toBe(true);
    expect(store.getState().currentStateId).toBe("amine_reactants");
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
    expect(store.getState().visibleScaffoldLevel).toBe(3);
    expect(store.getState().hintCount).toBe(1);
    expect(store.getState().activity.at(-1)?.actor).toBe("agent");
  });

  it("lets the learner hide a hint without forgetting unlocked help", () => {
    const store = createMechanismStore(undefined, null);
    store.requestScaffold(4, "human");
    store.dismissScaffold();
    expect(store.getState()).toMatchObject({
      highestScaffoldLevel: 4,
      visibleScaffoldLevel: 0,
      hintCount: 1,
      focusEntityIds: [],
    });
  });

  it("hides an open hint when the learner starts drawing", () => {
    const store = createMechanismStore(undefined, null);
    store.requestScaffold(4, "human");
    store.selectSource({ kind: "lone_pair", entityId: "lp_o_1" });
    expect(store.getState().visibleScaffoldLevel).toBe(0);
    expect(store.getState().highestScaffoldLevel).toBe(4);
  });

  it("hides a reopened hint when the learner clears the draft", () => {
    const store = createMechanismStore(undefined, null);
    store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_o_1" },
      target: { kind: "atom", entityId: "c_electrophile" },
      actor: "human",
    });
    store.requestScaffold(4, "human");
    store.clearDraft("human");
    expect(store.getState().visibleScaffoldLevel).toBe(0);
    expect(store.getState().draftArrows).toHaveLength(0);
  });

  it("records check outcomes for the visible activity status", () => {
    const store = createMechanismStore(undefined, null);
    store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_o_1" },
      target: { kind: "atom", entityId: "c_electrophile" },
      actor: "human",
    });
    store.checkDraftStep("human");
    expect(store.getState().activity.at(-1)).toMatchObject({
      kind: "step_checked",
      outcome: "warning",
    });

    store.addDraftArrow({
      source: { kind: "bond", entityId: "bond_c_br" },
      target: { kind: "atom", entityId: "br_leaving" },
      actor: "human",
    });
    store.checkDraftStep("human");
    expect(store.getState().activity.at(-1)).toMatchObject({
      kind: "step_checked",
      outcome: "success",
    });
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

  it("keeps learner reflections attached to exact commits without changing chemistry authority", () => {
    const storage = window.localStorage;
    const first = createMechanismStore(undefined, storage);
    addAcceptedBundle(first);
    const checked = first.checkDraftStep("human");
    expect(first.commitCheckedStep(checked.value?.validationId ?? "", "human").ok).toBe(true);

    const revisionBeforeReflection = first.getState().mechanismRevision;
    const activityBeforeReflection = first.getState().activitySequence;
    expect(first.saveCommitReflection("commit_1", "x".repeat(1201))).toMatchObject({
      ok: false,
      error: { code: "REFLECTION_TOO_LONG" },
    });
    expect(first.getState().mechanismRevision).toBe(revisionBeforeReflection);
    expect(
      first.saveCommitReflection(
        "commit_1",
        "The oxygen lone pair forms the new bond while bromide leaves, so carbon keeps an octet.",
      ).ok,
    ).toBe(true);
    expect(first.getState()).toMatchObject({
      mechanismRevision: revisionBeforeReflection,
      activitySequence: activityBeforeReflection + 1,
    });
    expect(first.getState().history[0]).toMatchObject({
      id: "commit_1",
      reflection:
        "The oxygen lone pair forms the new bond while bromide leaves, so carbon keeps an octet.",
    });
    expect(first.getState().activity.at(-1)).toMatchObject({
      actor: "human",
      kind: "reflection_saved",
    });

    const restored = createMechanismStore(undefined, storage);
    expect(restored.getState().history[0].reflection).toContain("carbon keeps an octet");
    expect(restored.undoLastCommit("human").ok).toBe(true);
    expect(restored.getState().history[0]).toMatchObject({
      undoneAt: expect.any(String),
      reflection:
        "The oxygen lone pair forms the new bond while bromide leaves, so carbon keeps an octet.",
    });
  });

  it("migrates v2 workspaces with empty reflection fields into the v3 schema", () => {
    const storage = window.localStorage;
    const first = createMechanismStore(undefined, storage);
    addAcceptedBundle(first);
    const checked = first.checkDraftStep("human");
    expect(first.commitCheckedStep(checked.value?.validationId ?? "", "human").ok).toBe(true);

    const current = JSON.parse(
      storage.getItem("mechanism-canvas:workspace:v3") ?? "{}",
    ) as {
      version: number;
      workspaces: Record<string, { history: Array<Record<string, unknown>> }>;
    };
    current.version = 2;
    for (const workspace of Object.values(current.workspaces)) {
      workspace.history = workspace.history.map(({ reflection: _reflection, reflectionUpdatedAt: _updated, ...record }) => record);
    }
    storage.removeItem("mechanism-canvas:workspace:v3");
    storage.setItem("mechanism-canvas:workspace:v2", JSON.stringify(current));

    const restored = createMechanismStore(undefined, storage);
    expect(restored.getState().history[0]).toMatchObject({
      id: "commit_1",
      reflection: null,
      reflectionUpdatedAt: null,
    });
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
