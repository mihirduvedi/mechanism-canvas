import { describe, expect, it, vi } from "vitest";
import { REPLAY_REACHED_STEP_EVENT } from "../domain/reaction-replay";
import { createMechanismStore } from "../store/mechanism-store";
import { registerMechanismCanvasTools } from "./register-tools";

function contextHarness() {
  const tools: WebMcpToolDefinition[] = [];
  const context: WebMcpModelContext = {
    registerTool: vi.fn(async (tool) => {
      tools.push(tool);
    }),
  };
  return { tools, context };
}

describe("WebMCP site tool registration", () => {
  it("registers the full sixteen-tool catalog with guarded proposals, history, comparison, and replay", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    const count = await registerMechanismCanvasTools(store, context);
    expect(count).toBe(16);
    expect(tools.map((tool) => tool.name)).toEqual([
      "get_mechanism_state",
      "inspect_mechanism_entities",
      "get_activity_trail",
      "view_mechanism_history_state",
      "compare_reached_step",
      "replay_reached_step",
      "focus_mechanism_entities",
      "propose_draft_arrows",
      "add_draft_arrow",
      "remove_draft_arrow",
      "check_draft_step",
      "request_scaffold",
      "commit_checked_step",
      "undo_last_commit",
      "switch_problem",
      "reset_active_exercise",
    ]);
    expect(tools[0].annotations?.readOnlyHint).toBe(true);
    expect(tools.find((tool) => tool.name === "compare_reached_step")?.annotations?.readOnlyHint).toBe(
      true,
    );
    expect(tools.find((tool) => tool.name === "replay_reached_step")?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    });
    expect(tools.find((tool) => tool.name === "add_draft_arrow")?.inputSchema.additionalProperties).toBe(
      false,
    );
    expect(tools.find((tool) => tool.name === "propose_draft_arrows")?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
    });
    expect(tools.some((tool) => tool.name.includes("accept") && tool.name.includes("proposal"))).toBe(
      false,
    );
    expect(tools.at(-1)?.annotations?.destructiveHint).toBe(true);
  });

  it("stages a revision-bound proposal without changing the draft until learner approval", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context);
    const call = (name: string, input: unknown) =>
      tools.find((tool) => tool.name === name)?.execute(input);

    const proposed = await call("propose_draft_arrows", {
      arrows: [
        {
          sourceType: "lone_pair",
          sourceEntityId: "lp_o_1",
          targetAtomId: "c_electrophile",
        },
      ],
      rationale:
        "Consider whether the nucleophile's available pair should begin the bond-forming move.",
      expectedRevision: 0,
    });

    expect(proposed).toMatchObject({
      ok: true,
      mechanismRevision: 0,
      draftArrowCount: 0,
      awaitingLearnerApproval: true,
      proposal: {
        baseRevision: 0,
        stateId: "sn2_reactants",
        arrows: [
          {
            source: { kind: "lone_pair", entityId: "lp_o_1" },
            target: { kind: "atom", entityId: "c_electrophile" },
          },
        ],
      },
    });
    expect(store.getState()).toMatchObject({
      mechanismRevision: 0,
      draftArrows: [],
      agentProposal: { baseRevision: 0 },
    });
    expect(store.getState().activity.at(-1)).toMatchObject({
      actor: "agent",
      kind: "proposal_staged",
    });

    const stateRead = await call("get_mechanism_state", {});
    expect(stateRead).toMatchObject({
      mechanism: {
        draftArrows: [],
        agentProposal: { stale: false, baseRevision: 0 },
      },
    });

    const proposalId = store.getState().agentProposal?.id ?? "";
    expect(store.acceptAgentProposal(proposalId).ok).toBe(true);
    expect(store.getState()).toMatchObject({
      mechanismRevision: 1,
      agentProposal: null,
    });
    expect(store.getState().draftArrows[0].actor).toBe("agent");
    expect(store.getState().activity.at(-1)).toMatchObject({
      actor: "human",
      kind: "proposal_accepted",
    });
  });

  it("rejects a proposal made against a stale revision", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context);
    const proposal = tools.find((tool) => tool.name === "propose_draft_arrows");
    const result = await proposal?.execute({
      arrows: [
        {
          sourceType: "bond",
          sourceEntityId: "bond_c_br",
          targetAtomId: "br_leaving",
        },
      ],
      rationale: "Account for the leaving-group electron pair in the same step.",
      expectedRevision: 7,
    });

    expect(result).toMatchObject({
      ok: false,
      error: { code: "STALE_STATE" },
      mechanismRevision: 0,
    });
    expect(store.getState().agentProposal).toBeNull();
  });

  it("completes both capstone steps and browses only reached history states", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context);
    const call = (name: string, input: unknown) =>
      tools.find((tool) => tool.name === name)?.execute(input);

    await call("switch_problem", {
      problemId: "ammonia_alkylation_01",
      expectedRevision: 0,
    });
    const unreached = await call("view_mechanism_history_state", {
      stateId: "amine_products",
    });
    expect(unreached).toMatchObject({
      ok: false,
      error: { code: "TARGET_NOT_SUPPORTED" },
    });
    const unreachedComparison = await call("compare_reached_step", {
      beforeStateId: "amine_reactants",
      afterStateId: "methylammonium_intermediate",
    });
    expect(unreachedComparison).toMatchObject({
      ok: false,
      error: { code: "TARGET_NOT_SUPPORTED" },
    });
    const unreachedReplay = await call("replay_reached_step", {
      beforeStateId: "amine_reactants",
      afterStateId: "methylammonium_intermediate",
    });
    expect(unreachedReplay).toMatchObject({
      ok: false,
      error: { code: "TARGET_NOT_SUPPORTED" },
    });

    await call("add_draft_arrow", {
      sourceType: "lone_pair",
      sourceEntityId: "lp_n_attack_1",
      targetAtomId: "c_methyl",
      expectedRevision: 1,
    });
    await call("add_draft_arrow", {
      sourceType: "bond",
      sourceEntityId: "bond_c_br",
      targetAtomId: "br_leaving",
      expectedRevision: 2,
    });
    const firstCheck = (await call("check_draft_step", { expectedRevision: 3 })) as {
      validation: { validationId: string; classification: string };
    };
    expect(firstCheck.validation.classification).toBe("valid");
    await call("commit_checked_step", {
      validationId: firstCheck.validation.validationId,
      expectedRevision: 3,
    });
    expect(store.getState().currentStateId).toBe("methylammonium_intermediate");

    const firstComparison = await call("compare_reached_step", {
      beforeStateId: "amine_reactants",
      afterStateId: "methylammonium_intermediate",
    });
    expect(firstComparison).toMatchObject({
      ok: true,
      problemId: "ammonia_alkylation_01",
      mechanismRevision: 4,
      step: {
        stepIndex: 1,
        stepId: "form_methylammonium",
        performedArrowBundle: expect.arrayContaining([
          expect.objectContaining({ source: { kind: "bond", entityId: "bond_c_br" } }),
        ]),
      },
      comparison: {
        summary: "1 bond formed; 1 bond broken; 4 atom properties changed",
        bondChanges: expect.arrayContaining([
          expect.objectContaining({ change: "formed", afterBondId: "bond_c_n_attack" }),
          expect.objectContaining({ change: "broken", beforeBondId: "bond_c_br" }),
        ]),
      },
    });
    expect(store.getState().activitySequence).toBe(5);

    const replayRequests: CustomEvent[] = [];
    const captureReplay = (event: Event) => {
      replayRequests.push(event as CustomEvent);
    };
    document.addEventListener(REPLAY_REACHED_STEP_EVENT, captureReplay, { once: true });
    const replayed = await call("replay_reached_step", {
      beforeStateId: "amine_reactants",
      afterStateId: "methylammonium_intermediate",
    });
    expect(replayed).toMatchObject({
      ok: true,
      problemId: "ammonia_alkylation_01",
      mechanismRevision: 4,
      activitySequence: 5,
      presented: true,
      step: {
        commitId: expect.any(String),
        stepIndex: 1,
        performedArrowBundle: expect.arrayContaining([
          expect.objectContaining({ source: { kind: "lone_pair", entityId: "lp_n_attack_1" } }),
        ]),
      },
    });
    expect(replayRequests[0]?.detail).toMatchObject({
      commitId: expect.any(String),
      beforeStateId: "amine_reactants",
      afterStateId: "methylammonium_intermediate",
    });
    expect(store.getState().activitySequence).toBe(5);

    const viewed = await call("view_mechanism_history_state", { stateId: "amine_reactants" });
    expect(viewed).toMatchObject({ ok: true, mechanismRevision: 4 });
    expect(store.getState().historyViewStateId).toBe("amine_reactants");
    await call("view_mechanism_history_state", { stateId: "methylammonium_intermediate" });
    expect(store.getState().historyViewStateId).toBeNull();

    await call("add_draft_arrow", {
      sourceType: "lone_pair",
      sourceEntityId: "lp_n_base_1",
      targetAtomId: "h_transfer",
      expectedRevision: 4,
    });
    await call("add_draft_arrow", {
      sourceType: "bond",
      sourceEntityId: "bond_n_attack_h_transfer",
      targetAtomId: "n_attacker",
      expectedRevision: 5,
    });
    const secondCheck = (await call("check_draft_step", { expectedRevision: 6 })) as {
      validation: { validationId: string; classification: string };
    };
    expect(secondCheck.validation.classification).toBe("valid");
    await call("commit_checked_step", {
      validationId: secondCheck.validation.validationId,
      expectedRevision: 6,
    });

    const final = await call("get_mechanism_state", {});
    expect(final).toMatchObject({
      problem: { id: "ammonia_alkylation_01" },
      mechanism: {
        currentStateId: "amine_products",
        complete: true,
        activeCommitCount: 2,
        currentStep: null,
        reachableHistoryStates: [
          { id: "amine_reactants" },
          { id: "methylammonium_intermediate" },
          { id: "amine_products", current: true },
        ],
        availableStepComparisons: [
          { stepIndex: 1, beforeStateId: "amine_reactants", afterStateId: "methylammonium_intermediate" },
          { stepIndex: 2, beforeStateId: "methylammonium_intermediate", afterStateId: "amine_products" },
        ],
      },
    });
  });

  it("switches problems and completes proton transfer through the same site-tool store", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context);
    const call = (name: string, input: unknown) =>
      tools.find((tool) => tool.name === name)?.execute(input);

    const switched = await call("switch_problem", {
      problemId: "proton_transfer_01",
      expectedRevision: 0,
    });
    expect(switched).toMatchObject({
      ok: true,
      currentStateId: "proton_transfer_reactants",
      mechanismRevision: 1,
    });
    await call("add_draft_arrow", {
      sourceType: "lone_pair",
      sourceEntityId: "lp_n_1",
      targetAtomId: "h_transfer",
      expectedRevision: 1,
    });
    await call("add_draft_arrow", {
      sourceType: "bond",
      sourceEntityId: "bond_o_h_transfer",
      targetAtomId: "o_acid",
      expectedRevision: 2,
    });
    const check = (await call("check_draft_step", { expectedRevision: 3 })) as {
      validation: { validationId: string; classification: string };
    };
    expect(check.validation.classification).toBe("valid");
    const commit = await call("commit_checked_step", {
      validationId: check.validation.validationId,
      expectedRevision: 3,
    });
    expect(commit).toMatchObject({
      ok: true,
      currentStateId: "proton_transfer_products",
      mechanismRevision: 4,
    });
  });

  it("runs the complete clean-demo judge journey with visible, reversible state", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context, "demo");
    const call = (name: string, input: unknown) =>
      tools.find((tool) => tool.name === name)?.execute(input);

    const initial = await call("get_mechanism_state", {});
    expect(initial).toMatchObject({
      ok: true,
      session: { mode: "demo" },
      problem: { id: "sn2_01" },
      mechanism: { mechanismRevision: 0, draftArrows: [] },
    });

    await call("switch_problem", {
      problemId: "proton_transfer_01",
      expectedRevision: 0,
    });
    const inspected = await call("inspect_mechanism_entities", {
      entityIds: ["lp_n_1", "h_transfer", "bond_o_h_transfer", "o_acid"],
    });
    expect(inspected).toMatchObject({
      ok: true,
      mechanismRevision: 1,
      entities: [
        { kind: "lone_pair", id: "lp_n_1" },
        { kind: "atom", id: "h_transfer" },
        { kind: "bond", id: "bond_o_h_transfer" },
        { kind: "atom", id: "o_acid" },
      ],
    });

    await call("add_draft_arrow", {
      sourceType: "lone_pair",
      sourceEntityId: "lp_n_1",
      targetAtomId: "h_transfer",
      expectedRevision: 1,
    });
    const incomplete = (await call("check_draft_step", {
      expectedRevision: 2,
    })) as { validation: { classification: string; issues: Array<{ code: string }> } };
    expect(incomplete.validation.classification).toBe("incomplete");
    expect(incomplete.validation.issues).toContainEqual(
      expect.objectContaining({ code: "INCOMPLETE_CONCERTED_STEP" }),
    );

    await call("add_draft_arrow", {
      sourceType: "bond",
      sourceEntityId: "bond_o_h_transfer",
      targetAtomId: "o_acid",
      expectedRevision: 2,
    });
    const accepted = (await call("check_draft_step", {
      expectedRevision: 3,
    })) as { validation: { validationId: string; classification: string } };
    expect(accepted.validation.classification).toBe("valid");
    await call("commit_checked_step", {
      validationId: accepted.validation.validationId,
      expectedRevision: 3,
    });
    expect(store.getState().currentStateId).toBe("proton_transfer_products");

    const activity = await call("get_activity_trail", { limit: 20 });
    expect(activity).toMatchObject({
      ok: true,
      problemId: "proton_transfer_01",
      latestSequence: 6,
      hasMore: false,
    });
    expect(store.getState().activity.map((event) => event.actor)).toEqual([
      "agent",
      "agent",
      "validator",
      "agent",
      "validator",
      "agent",
    ]);

    const undone = await call("undo_last_commit", { expectedRevision: 4 });
    expect(undone).toMatchObject({
      ok: true,
      currentStateId: "proton_transfer_reactants",
      mechanismRevision: 5,
    });
    expect(store.getState().activity.at(-1)).toMatchObject({
      actor: "agent",
      kind: "commit_undone",
    });
  });

  it("keeps read tools free of activity side effects", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context, "demo");
    const before = store.getState().activitySequence;
    const getState = tools.find((tool) => tool.name === "get_mechanism_state");
    const inspect = tools.find((tool) => tool.name === "inspect_mechanism_entities");
    const activity = tools.find((tool) => tool.name === "get_activity_trail");
    const stateResult = await getState?.execute({});
    const inspectResult = await inspect?.execute({ entityIds: ["o_nucleophile"] });
    const activityResult = await activity?.execute({});
    expect(stateResult).toMatchObject({
      ok: true,
      session: {
        mode: "demo",
        persistence: "memory only; resets on refresh",
      },
    });
    expect(inspectResult).toMatchObject({ ok: true });
    expect(activityResult).toMatchObject({ ok: true, events: [] });
    expect(store.getState().activitySequence).toBe(before);
  });

  it("reads the shared activity trail incrementally without adding activity", async () => {
    const store = createMechanismStore(undefined, null);
    store.focusEntities(["o_nucleophile"], "human");
    store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_o_1" },
      target: { kind: "atom", entityId: "c_electrophile" },
      actor: "human",
    });
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context);
    const activity = tools.find((tool) => tool.name === "get_activity_trail");
    const before = store.getState().activitySequence;
    const result = await activity?.execute({ afterSequence: 1, limit: 1 });

    expect(result).toMatchObject({
      ok: true,
      problemId: "sn2_01",
      latestSequence: 2,
      hasMore: false,
      events: [
        {
          sequence: 2,
          actor: "human",
          kind: "arrow_added",
          entityIds: ["lp_o_1", "c_electrophile"],
        },
      ],
    });
    expect(store.getState().activitySequence).toBe(before);
  });

  it("requires explicit confirmation and a current revision before an agent reset", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context);
    const call = (name: string, input: unknown) =>
      tools.find((tool) => tool.name === name)?.execute(input);

    await call("add_draft_arrow", {
      sourceType: "lone_pair",
      sourceEntityId: "lp_o_1",
      targetAtomId: "c_electrophile",
      expectedRevision: 0,
    });
    const unconfirmed = await call("reset_active_exercise", {
      confirmReset: false,
      expectedRevision: 1,
    });
    expect(unconfirmed).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(store.getState().draftArrows).toHaveLength(1);

    const stale = await call("reset_active_exercise", {
      confirmReset: true,
      expectedRevision: 0,
    });
    expect(stale).toMatchObject({ ok: false, error: { code: "STALE_STATE" } });
    expect(store.getState().draftArrows).toHaveLength(1);

    const reset = await call("reset_active_exercise", {
      confirmReset: true,
      expectedRevision: 1,
    });
    expect(reset).toMatchObject({
      ok: true,
      currentStateId: "sn2_reactants",
      mechanismRevision: 2,
      draftArrowCount: 0,
    });
    expect(store.getState().activity).toMatchObject([
      { sequence: 1, actor: "agent", kind: "problem_reset" },
    ]);
  });

  it("completes the same add, check, commit, and undo journey through site tools", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context);
    const call = (name: string, input: unknown) =>
      tools.find((tool) => tool.name === name)?.execute(input);

    const first = await call("add_draft_arrow", {
      sourceType: "lone_pair",
      sourceEntityId: "lp_o_3",
      targetAtomId: "c_electrophile",
      expectedRevision: 0,
    });
    expect(first).toMatchObject({ ok: true, mechanismRevision: 1 });
    const second = await call("add_draft_arrow", {
      sourceType: "bond",
      sourceEntityId: "bond_c_br",
      targetAtomId: "br_leaving",
      expectedRevision: 1,
    });
    expect(second).toMatchObject({ ok: true, mechanismRevision: 2 });

    const check = (await call("check_draft_step", { expectedRevision: 2 })) as {
      validation: { validationId: string; classification: string };
    };
    expect(check.validation.classification).toBe("valid");
    const commit = await call("commit_checked_step", {
      validationId: check.validation.validationId,
      expectedRevision: 2,
    });
    expect(commit).toMatchObject({ ok: true, currentStateId: "sn2_products", mechanismRevision: 3 });
    const undo = await call("undo_last_commit", { expectedRevision: 3 });
    expect(undo).toMatchObject({ ok: true, currentStateId: "sn2_reactants", mechanismRevision: 4 });
    expect(store.getState().activity.some((event) => event.actor === "agent")).toBe(true);
  });

  it("returns a verifiable stale-revision error instead of changing the draft", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context);
    const add = tools.find((tool) => tool.name === "add_draft_arrow");
    const result = await add?.execute({
      sourceType: "lone_pair",
      sourceEntityId: "lp_o_1",
      targetAtomId: "c_electrophile",
      expectedRevision: 99,
    });
    expect(result).toMatchObject({
      ok: false,
      error: { code: "STALE_STATE" },
      mechanismRevision: 0,
    });
    expect(store.getState().draftArrows).toHaveLength(0);
  });
});
