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
    store.setCollaborationContract({
      mode: "collaborate",
      maxAgentScaffoldLevel: 4,
      learnerCommitsOnly: false,
    });
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

  it("enforces the default Coach contract in the store, not only in WebMCP registration", () => {
    const store = createMechanismStore(undefined, null);
    expect(store.getCollaborationContract()).toMatchObject({
      mode: "coach",
      maxAgentScaffoldLevel: 2,
      learnerCommitsOnly: true,
      revision: 0,
    });

    expect(
      store.addDraftArrow({
        source: { kind: "lone_pair", entityId: "lp_o_1" },
        target: { kind: "atom", entityId: "c_electrophile" },
        actor: "agent",
      }),
    ).toMatchObject({ ok: false, error: { code: "LEARNER_CONTROLLED" } });
    expect(store.requestScaffold(2, "agent").ok).toBe(true);
    expect(store.requestScaffold(3, "agent")).toMatchObject({
      ok: false,
      error: { code: "LEARNER_CONTROLLED" },
    });
    expect(store.getState().highestScaffoldLevel).toBe(2);
  });

  it("lets only the learner widen agent authority and keeps commits separately bounded", () => {
    const store = createMechanismStore(undefined, null);
    const chemistryRevision = store.getState().mechanismRevision;
    const updated = store.setCollaborationContract({
      mode: "collaborate",
      maxAgentScaffoldLevel: 4,
      learnerCommitsOnly: true,
    });
    expect(updated).toMatchObject({
      ok: true,
      value: { mode: "collaborate", revision: 1, learnerCommitsOnly: true },
    });
    expect(store.getState().mechanismRevision).toBe(chemistryRevision);
    expect(store.getState().activity.at(-1)?.kind).toBe("collaboration_contract_changed");

    addAcceptedBundle(store);
    const checked = store.checkDraftStep("agent");
    expect(checked.value?.classification).toBe("valid");
    expect(
      store.commitCheckedStep(checked.value?.validationId ?? "", "agent"),
    ).toMatchObject({ ok: false, error: { code: "LEARNER_CONTROLLED" } });

    store.setCollaborationContract({
      mode: "collaborate",
      maxAgentScaffoldLevel: 4,
      learnerCommitsOnly: false,
    });
    expect(store.commitCheckedStep(checked.value?.validationId ?? "", "agent").ok).toBe(true);
  });

  it("makes Observe mode read-and-focus only", () => {
    const store = createMechanismStore(undefined, null);
    store.setCollaborationContract({
      mode: "observe",
      maxAgentScaffoldLevel: 4,
      learnerCommitsOnly: false,
    });
    expect(store.focusEntities(["o_nucleophile"], "agent").ok).toBe(true);
    expect(store.switchProblem("proton_transfer_01", "agent")).toMatchObject({
      ok: false,
      error: { code: "LEARNER_CONTROLLED" },
    });
    expect(
      store.stageAgentProposal({
        arrows: [
          {
            source: { kind: "lone_pair", entityId: "lp_o_1" },
            target: { kind: "atom", entityId: "c_electrophile" },
          },
        ],
        rationale: "Offer a visible suggestion.",
      }),
    ).toMatchObject({ ok: false, error: { code: "LEARNER_CONTROLLED" } });
    expect(store.checkDraftStep("agent")).toMatchObject({
      ok: false,
      error: { code: "LEARNER_CONTROLLED" },
    });
  });

  it("keeps an agent proposal outside the draft until the learner accepts it", () => {
    const store = createMechanismStore(undefined, null);
    expect(
      store.addDraftArrow({
        source: { kind: "lone_pair", entityId: "lp_o_1" },
        target: { kind: "atom", entityId: "c_electrophile" },
        actor: "human",
      }).ok,
    ).toBe(true);

    const staged = store.stageAgentProposal({
      arrows: [
        {
          source: { kind: "bond", entityId: "bond_c_br" },
          target: { kind: "atom", entityId: "br_leaving" },
        },
      ],
      rationale:
        "The companion arrow accounts for the carbon–bromine electron pair while the new bond forms.",
      expectedRevision: 1,
    });

    expect(staged.ok).toBe(true);
    expect(store.getState()).toMatchObject({
      mechanismRevision: 1,
      draftArrows: [expect.objectContaining({ actor: "human" })],
      agentProposal: {
        id: "proposal_2",
        baseRevision: 1,
        stateId: "sn2_reactants",
      },
    });
    expect(store.getState().activity.at(-1)).toMatchObject({
      actor: "agent",
      kind: "proposal_staged",
    });

    const accepted = store.acceptAgentProposal(staged.value?.id ?? "");
    expect(accepted.ok).toBe(true);
    expect(store.getState()).toMatchObject({
      mechanismRevision: 2,
      agentProposal: null,
    });
    expect(store.getState().draftArrows).toHaveLength(2);
    expect(store.getState().draftArrows[1]).toMatchObject({
      actor: "agent",
      source: { kind: "bond", entityId: "bond_c_br" },
      target: { kind: "atom", entityId: "br_leaving" },
    });
    expect(store.getState().activity.at(-1)).toMatchObject({
      actor: "human",
      kind: "proposal_accepted",
    });
    expect(store.checkDraftStep("human").value?.classification).toBe("valid");
  });

  it("lets the learner decline a proposal without changing the chemistry revision", () => {
    const store = createMechanismStore(undefined, null);
    const staged = store.stageAgentProposal({
      arrows: [
        {
          source: { kind: "lone_pair", entityId: "lp_o_1" },
          target: { kind: "atom", entityId: "c_electrophile" },
        },
      ],
      rationale: "Consider beginning with the nucleophile's available lone pair.",
      expectedRevision: 0,
    });
    expect(staged.ok).toBe(true);

    const declined = store.declineAgentProposal(staged.value?.id ?? "");
    expect(declined.ok).toBe(true);
    expect(store.getState()).toMatchObject({
      mechanismRevision: 0,
      draftArrows: [],
      agentProposal: null,
    });
    expect(store.getState().activity.at(-1)).toMatchObject({
      actor: "human",
      kind: "proposal_declined",
    });
  });

  it("refuses to accept an outdated proposal after the draft changes", () => {
    const store = createMechanismStore(undefined, null);
    const staged = store.stageAgentProposal({
      arrows: [
        {
          source: { kind: "bond", entityId: "bond_c_br" },
          target: { kind: "atom", entityId: "br_leaving" },
        },
      ],
      rationale: "Account for the leaving-group bond as part of the same elementary step.",
      expectedRevision: 0,
    });
    expect(staged.ok).toBe(true);
    store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_o_1" },
      target: { kind: "atom", entityId: "c_electrophile" },
      actor: "human",
    });

    expect(store.acceptAgentProposal(staged.value?.id ?? "")).toMatchObject({
      ok: false,
      error: { code: "STALE_STATE" },
    });
    expect(store.getState().agentProposal?.baseRevision).toBe(0);
    expect(store.declineAgentProposal(staged.value?.id ?? "").ok).toBe(true);
  });

  it("rejects proposals that duplicate an electron source already in the draft", () => {
    const store = createMechanismStore(undefined, null);
    store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_o_1" },
      target: { kind: "atom", entityId: "c_electrophile" },
      actor: "human",
    });
    expect(
      store.stageAgentProposal({
        arrows: [
          {
            source: { kind: "lone_pair", entityId: "lp_o_1" },
            target: { kind: "atom", entityId: "c_electrophile" },
          },
        ],
        rationale: "Repeat the learner's existing arrow.",
        expectedRevision: 1,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "DUPLICATE_ELECTRON_SOURCE" },
    });
    expect(store.getState().agentProposal).toBeNull();
  });

  it("tracks scaffold help without changing the mechanism revision", () => {
    const store = createMechanismStore(undefined, null);
    store.setCollaborationContract({
      mode: "coach",
      maxAgentScaffoldLevel: 3,
      learnerCommitsOnly: true,
    });
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

  it("persists the learner-owned collaboration contract in v6", () => {
    const storage = window.localStorage;
    const first = createMechanismStore(undefined, storage);
    first.setCollaborationContract({
      mode: "observe",
      maxAgentScaffoldLevel: 1,
      learnerCommitsOnly: true,
    });

    const persisted = JSON.parse(
      storage.getItem("mechanism-canvas:workspace:v6") ?? "{}",
    );
    expect(persisted).toMatchObject({
      version: 6,
      collaborationContract: {
        mode: "observe",
        maxAgentScaffoldLevel: 1,
        learnerCommitsOnly: true,
        revision: 1,
      },
    });
    expect(createMechanismStore(undefined, storage).getCollaborationContract()).toMatchObject({
      mode: "observe",
      revision: 1,
    });
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

  it("migrates v2 workspaces with empty reflection fields into the v6 schema", () => {
    const storage = window.localStorage;
    const first = createMechanismStore(undefined, storage);
    addAcceptedBundle(first);
    const checked = first.checkDraftStep("human");
    expect(first.commitCheckedStep(checked.value?.validationId ?? "", "human").ok).toBe(true);

    const current = JSON.parse(
      storage.getItem("mechanism-canvas:workspace:v6") ?? "{}",
    ) as {
      version: number;
      workspaces: Record<string, { history: Array<Record<string, unknown>> }>;
    };
    current.version = 2;
    for (const workspace of Object.values(current.workspaces)) {
      workspace.history = workspace.history.map(({ reflection: _reflection, reflectionUpdatedAt: _updated, ...record }) => record);
    }
    storage.removeItem("mechanism-canvas:workspace:v6");
    storage.setItem("mechanism-canvas:workspace:v2", JSON.stringify(current));

    const restored = createMechanismStore(undefined, storage);
    expect(restored.getState().history[0]).toMatchObject({
      id: "commit_1",
      reflection: null,
      reflectionUpdatedAt: null,
    });
  });

  it("persists a current arrow proposal and its learner-review boundary in v6", () => {
    const storage = window.localStorage;
    const first = createMechanismStore(undefined, storage);
    const staged = first.stageAgentProposal({
      arrows: [
        {
          source: { kind: "lone_pair", entityId: "lp_o_1" },
          target: { kind: "atom", entityId: "c_electrophile" },
        },
      ],
      rationale: "Start by considering the nucleophile's available electron pair.",
      expectedRevision: 0,
    });
    expect(staged.ok).toBe(true);

    const restored = createMechanismStore(undefined, storage);
    expect(restored.getState().agentProposal).toMatchObject({
      id: staged.value?.id,
      baseRevision: 0,
      rationale: "Start by considering the nucleophile's available electron pair.",
    });
    expect(restored.getState().draftArrows).toHaveLength(0);
    expect(restored.acceptAgentProposal(staged.value?.id ?? "").ok).toBe(true);
    expect(restored.getState().draftArrows[0].actor).toBe("agent");
  });

  it("migrates the immediately previous v3 workspace with no invented proposal", () => {
    const storage = window.localStorage;
    const first = createMechanismStore(undefined, storage);
    first.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_o_1" },
      target: { kind: "atom", entityId: "c_electrophile" },
      actor: "human",
    });
    const previous = JSON.parse(
      storage.getItem("mechanism-canvas:workspace:v6") ?? "{}",
    ) as {
      version: number;
      workspaces: Record<string, Record<string, unknown>>;
    };
    previous.version = 3;
    for (const workspace of Object.values(previous.workspaces)) {
      delete workspace.agentProposal;
    }
    storage.removeItem("mechanism-canvas:workspace:v6");
    storage.setItem("mechanism-canvas:workspace:v3", JSON.stringify(previous));

    const restored = createMechanismStore(undefined, storage);
    expect(restored.getState()).toMatchObject({
      mechanismRevision: 1,
      agentProposal: null,
    });
    expect(restored.getState().draftArrows[0].source.entityId).toBe("lp_o_1");
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

  it("derives a cross-exercise profile from exact checks and completed steps", () => {
    const store = createMechanismStore(undefined, null);
    const initialRevision = store.getLearningProfile().profileRevision;
    store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_o_1" },
      target: { kind: "atom", entityId: "c_electrophile" },
      actor: "human",
    });
    store.checkDraftStep("human");

    const profile = store.getLearningProfile();
    expect(profile.profileRevision).not.toBe(initialRevision);
    expect(profile.problems.find((item) => item.problemId === "sn2_01")).toMatchObject({
      attemptCount: 1,
      status: "in_progress",
    });
    expect(profile.skills.find((skill) => skill.id === "concerted_steps")).toMatchObject({
      status: "building",
      issueCount: 1,
    });
  });

  it("keeps an agent practice plan outside learner progress until human approval", () => {
    const storage = window.localStorage;
    const store = createMechanismStore(undefined, storage);
    const profile = store.getLearningProfile();
    const mechanismRevision = store.getState().mechanismRevision;
    const staged = store.stagePracticePlan({
      problemIds: ["proton_transfer_01", "sn2_01"],
      rationale: "Start with a focused proton transfer, then compare the same two-arrow discipline in substitution.",
      expectedProfileRevision: profile.profileRevision,
    });

    expect(staged.ok).toBe(true);
    expect(store.getState().mechanismRevision).toBe(mechanismRevision);
    expect(store.getProblem().id).toBe("sn2_01");
    expect(store.getPracticePlanProposal()).toMatchObject({
      problemIds: ["proton_transfer_01", "sn2_01"],
      baseProfileRevision: profile.profileRevision,
    });

    const restored = createMechanismStore(undefined, storage);
    expect(restored.getPracticePlanProposal()?.id).toBe(staged.value?.id);
    expect(restored.acceptPracticePlan(staged.value?.id ?? "").ok).toBe(true);
    expect(restored.getProblem().id).toBe("proton_transfer_01");
    expect(restored.getPracticePlanProposal()).toBeNull();
    expect(restored.getState().activity.at(-1)?.kind).toBe("practice_plan_accepted");
  });

  it("rejects a stale practice plan after new learning evidence arrives", () => {
    const store = createMechanismStore(undefined, null);
    const staged = store.stagePracticePlan({
      problemIds: ["sn2_01"],
      rationale: "Continue with the current substitution exercise.",
      expectedProfileRevision: store.getLearningProfile().profileRevision,
    });
    addAcceptedBundle(store);
    store.checkDraftStep("human");

    expect(store.acceptPracticePlan(staged.value?.id ?? "")).toMatchObject({
      ok: false,
      error: { code: "STALE_STATE" },
    });
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
