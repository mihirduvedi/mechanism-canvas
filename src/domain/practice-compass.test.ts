import { describe, expect, it } from "vitest";
import type { MechanismState } from "./types";
import { buildLearningProfile } from "./practice-compass";
import { sn2Problem } from "../problems/sn2-01";
import { protonTransferProblem } from "../problems/proton-transfer-01";

function state(problemId: string): MechanismState {
  return {
    problemId,
    currentStateId: problemId === sn2Problem.id ? sn2Problem.currentStateId : protonTransferProblem.currentStateId,
    draftArrows: [], agentProposal: null, selection: { source: null }, latestValidation: null,
    mechanismRevision: 0, activitySequence: 0, activity: [], history: [], historyViewStateId: null,
    focusEntityIds: [], highestScaffoldLevel: 0, visibleScaffoldLevel: 0,
    attemptCount: 0, hintCount: 0, learningSignals: [], hydrated: true,
  };
}

describe("Practice Compass", () => {
  it("starts with honest empty evidence and deterministic recommendations", () => {
    const profile = buildLearningProfile([
      { problem: sn2Problem, state: state(sn2Problem.id) },
      { problem: protonTransferProblem, state: state(protonTransferProblem.id) },
    ]);
    expect(profile.completedSteps).toBe(0);
    expect(profile.skills.every((skill) => skill.status === "not_started")).toBe(true);
    expect(profile.recommendations.map((item) => item.problemId)).toEqual([
      protonTransferProblem.id,
      sn2Problem.id,
    ]);
  });

  it("uses exact validation evidence and changes its stable revision", () => {
    const sn2State = state(sn2Problem.id);
    const before = buildLearningProfile([{ problem: sn2Problem, state: sn2State }]);
    sn2State.attemptCount = 1;
    sn2State.learningSignals = [{
      id: "signal_1", problemId: sn2Problem.id, stepId: sn2Problem.steps[0].id,
      checkedAt: "2026-08-29T00:00:00.000Z", mechanismRevision: 0, draftArrowCount: 1,
      classification: "incomplete", reasonCodes: ["INCOMPLETE_CONCERTED_STEP"],
    }];
    const after = buildLearningProfile([{ problem: sn2Problem, state: sn2State }]);
    expect(after.profileRevision).not.toBe(before.profileRevision);
    expect(after.skills.find((skill) => skill.id === "concerted_steps")).toMatchObject({
      status: "building", checkCount: 1, issueCount: 1,
    });
  });
});
