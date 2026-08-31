import { describe, expect, it, vi } from "vitest";
import { createMechanismStore } from "../store/mechanism-store";
import {
  createDelegationSessionManager,
  delegationPresetToolNames,
  effectiveDelegationToolNames,
} from "./delegation-session";

const FULL_TOOL_SURFACE = [
  "get_mechanism_state",
  "get_collaboration_contract",
  "get_delegation_session",
  "get_agent_action_receipts",
  "get_learning_profile",
  "inspect_mechanism_entities",
  "get_activity_trail",
  "view_mechanism_history_state",
  "compare_reached_step",
  "replay_reached_step",
  "focus_mechanism_entities",
  "propose_practice_plan",
  "propose_draft_arrows",
  "add_draft_arrow",
  "remove_draft_arrow",
  "check_draft_step",
  "request_scaffold",
  "commit_checked_step",
  "undo_last_commit",
  "switch_problem",
  "reset_active_exercise",
];

describe("intent-bound WebMCP delegation sessions", () => {
  it("freezes the purpose-specific grant and never widens with a later contract surface", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createDelegationSessionManager(store);
    const coachSurface = FULL_TOOL_SURFACE.filter(
      (name) => !["add_draft_arrow", "remove_draft_arrow", "commit_checked_step"].includes(name),
    );
    const session = manager.start({
      presetId: "coauthor",
      maxActions: 6,
      contractToolNames: coachSurface,
    });

    expect(session.grantedToolNames).toEqual(
      coachSurface.filter((name) => delegationPresetToolNames("coauthor").includes(name)),
    );
    expect(session.grantedToolNames).not.toContain("add_draft_arrow");
    expect(effectiveDelegationToolNames(session, FULL_TOOL_SURFACE)).not.toContain(
      "add_draft_arrow",
    );
    manager.destroy();
  });

  it("spends one action for an authorized call and follows its agent-authored revision", () => {
    const store = createMechanismStore(undefined, null);
    store.setCollaborationContract({
      mode: "collaborate",
      maxAgentScaffoldLevel: 2,
      learnerCommitsOnly: true,
    });
    const manager = createDelegationSessionManager(store);
    manager.start({ presetId: "coauthor", maxActions: 4, contractToolNames: FULL_TOOL_SURFACE });

    const decision = manager.beginToolExecution("add_draft_arrow");
    expect(decision).toMatchObject({
      allowed: true,
      token: { metered: true, evidence: { actionNumber: 1, actionBudget: 4 } },
    });
    if (!decision.allowed) throw new Error("Expected the delegated edit to be allowed.");
    const result = store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_o_1" },
      target: { kind: "atom", entityId: "c_electrophile" },
      actor: "agent",
      expectedRevision: 0,
    });
    expect(result.ok).toBe(true);
    manager.finishToolExecution(decision.token);

    expect(manager.getSnapshot()).toMatchObject({
      status: "active",
      usedActions: 1,
      expectedMechanismRevision: 1,
    });
    manager.destroy();
  });

  it("invalidates immediately when the learner changes the scoped revision", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createDelegationSessionManager(store);
    const listener = vi.fn();
    manager.subscribe(listener);
    manager.start({ presetId: "diagnose", maxActions: 4, contractToolNames: FULL_TOOL_SURFACE });

    store.addDraftArrow({
      source: { kind: "lone_pair", entityId: "lp_o_1" },
      target: { kind: "atom", entityId: "c_electrophile" },
      actor: "human",
    });

    expect(manager.getSnapshot()).toMatchObject({
      status: "drifted",
      usedActions: 0,
      driftReason: expect.stringContaining("outside this session"),
    });
    expect(listener).toHaveBeenCalled();
    const blocked = manager.beginToolExecution("check_draft_step");
    expect(blocked).toMatchObject({
      allowed: false,
      code: "DELEGATION_SCOPE_CHANGED",
    });
    manager.destroy();
  });

  it("keeps evidence controls unmetered and collapses an exhausted session to them", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createDelegationSessionManager(store);
    manager.start({ presetId: "inspect", maxActions: 4, contractToolNames: FULL_TOOL_SURFACE });

    const control = manager.beginToolExecution("get_delegation_session");
    expect(control).toMatchObject({ allowed: true, token: { metered: false } });
    manager.finishToolExecution(control.allowed ? control.token : null);
    expect(manager.getSnapshot()?.usedActions).toBe(0);

    for (let action = 1; action <= 4; action += 1) {
      const decision = manager.beginToolExecution("get_mechanism_state");
      if (!decision.allowed) throw new Error(`Action ${action} should be allowed.`);
      manager.finishToolExecution(decision.token);
    }

    const exhausted = manager.getSnapshot();
    expect(exhausted).toMatchObject({ status: "exhausted", usedActions: 4 });
    expect(effectiveDelegationToolNames(exhausted, FULL_TOOL_SURFACE)).toEqual([
      "get_collaboration_contract",
      "get_delegation_session",
      "get_agent_action_receipts",
    ]);
    expect(manager.beginToolExecution("get_mechanism_state")).toMatchObject({
      allowed: false,
      code: "DELEGATION_SESSION_EXHAUSTED",
    });
    manager.destroy();
  });

  it("restores the contract surface only after the learner ends the session", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createDelegationSessionManager(store);
    const started = manager.start({
      presetId: "inspect",
      maxActions: 8,
      contractToolNames: FULL_TOOL_SURFACE,
    });
    expect(effectiveDelegationToolNames(started, FULL_TOOL_SURFACE)).toHaveLength(10);

    expect(manager.end()?.id).toBe(started.id);
    expect(manager.getSnapshot()).toBeNull();
    expect(effectiveDelegationToolNames(null, FULL_TOOL_SURFACE)).toEqual(FULL_TOOL_SURFACE);
    manager.destroy();
  });

  it("refuses to replace a learner-granted session without an explicit end", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createDelegationSessionManager(store);
    const started = manager.start({
      presetId: "inspect",
      maxActions: 4,
      contractToolNames: FULL_TOOL_SURFACE,
    });

    expect(() => manager.start({
      presetId: "coauthor",
      maxActions: 8,
      contractToolNames: FULL_TOOL_SURFACE,
    })).toThrow("End the current delegation session before starting another.");
    expect(manager.getSnapshot()).toBe(started);
    manager.destroy();
  });
});
