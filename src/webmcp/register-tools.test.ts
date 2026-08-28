import { describe, expect, it, vi } from "vitest";
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
  it("registers the full twelve-tool catalog with narrow schemas", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    const count = await registerMechanismCanvasTools(store, context);
    expect(count).toBe(12);
    expect(tools.map((tool) => tool.name)).toEqual([
      "get_mechanism_state",
      "inspect_mechanism_entities",
      "get_activity_trail",
      "focus_mechanism_entities",
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
    expect(tools[4].inputSchema.additionalProperties).toBe(false);
    expect(tools[11].annotations?.destructiveHint).toBe(true);
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

  it("keeps read tools free of activity side effects", async () => {
    const store = createMechanismStore(undefined, null);
    const { tools, context } = contextHarness();
    await registerMechanismCanvasTools(store, context);
    const before = store.getState().activitySequence;
    const getState = tools.find((tool) => tool.name === "get_mechanism_state");
    const inspect = tools.find((tool) => tool.name === "inspect_mechanism_entities");
    const activity = tools.find((tool) => tool.name === "get_activity_trail");
    const stateResult = await getState?.execute({});
    const inspectResult = await inspect?.execute({ entityIds: ["o_nucleophile"] });
    const activityResult = await activity?.execute({});
    expect(stateResult).toMatchObject({ ok: true });
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
