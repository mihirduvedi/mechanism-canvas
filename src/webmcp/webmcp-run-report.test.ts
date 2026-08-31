import { describe, expect, it } from "vitest";
import type { ToolReceipt, ToolReceiptEvidence } from "./tool-receipt-ledger";
import { buildLatestExploreRunReport } from "./webmcp-run-report";

function evidence(overrides: Partial<ToolReceiptEvidence>): ToolReceiptEvidence {
  return {
    hypothesisBranchId: null,
    hypothesisArrowCount: null,
    validationClassification: null,
    comparedBranchIds: null,
    comparisonArrowCounts: null,
    awaitingLearnerApproval: null,
    ...overrides,
  };
}

function receipt(
  sequence: number,
  toolName: string,
  actionNumber: number,
  labBefore: number,
  labAfter: number,
  toolEvidence: ToolReceiptEvidence,
): ToolReceipt {
  const stamp = (labRevision: number) => ({
    problemId: "sn2_01",
    currentStateId: "sn2_reactants",
    mechanismRevision: 0,
    activitySequence: 0,
    draftArrowCount: 0,
    collaborationMode: "coach" as const,
    contractRevision: 0,
    hypothesisLabId: "hypothesis_lab_1",
    hypothesisLabStatus: "active" as const,
    hypothesisLabRevision: labRevision,
  });
  return {
    id: `receipt_${sequence}`,
    sequence,
    toolName,
    kind: "write",
    outcome: "succeeded",
    intent: toolName,
    result: "Verified.",
    code: null,
    entityIds: [],
    evidence: toolEvidence,
    delegation: {
      sessionId: "delegation_session_1",
      presetId: "explore",
      presetLabel: "Compare hypotheses",
      statusAtStart: "active",
      problemId: "sn2_01",
      stateId: "sn2_reactants",
      actionNumber,
      actionBudget: 6,
    },
    startedAt: "2026-08-31T18:00:00.000Z",
    completedAt: "2026-08-31T18:00:00.001Z",
    durationMs: 1,
    before: stamp(labBefore),
    after: stamp(labAfter),
    changed: {
      problem: false,
      chemistry: false,
      draft: false,
      activity: false,
      contract: false,
      hypothesisLab: true,
    },
  };
}

const completeRun = [
  receipt(1, "set_hypothesis_branch", 1, 0, 1, evidence({ hypothesisBranchId: "hypothesis_a", hypothesisArrowCount: 1 })),
  receipt(2, "check_hypothesis_branch", 2, 1, 2, evidence({ hypothesisBranchId: "hypothesis_a", validationClassification: "incomplete" })),
  receipt(3, "set_hypothesis_branch", 3, 2, 3, evidence({ hypothesisBranchId: "hypothesis_b", hypothesisArrowCount: 2 })),
  receipt(4, "check_hypothesis_branch", 4, 3, 4, evidence({ hypothesisBranchId: "hypothesis_b", validationClassification: "valid" })),
  receipt(5, "compare_hypothesis_branches", 5, 4, 5, evidence({ comparedBranchIds: ["hypothesis_a", "hypothesis_b"], comparisonArrowCounts: { shared: 1, leftOnly: 0, rightOnly: 1 } })),
  receipt(6, "recommend_hypothesis_branch", 6, 5, 6, evidence({ hypothesisBranchId: "hypothesis_b", awaitingLearnerApproval: true })),
];

describe("WebMCP Explore run report", () => {
  it("recognizes the complete evidence-driven six-call journey", () => {
    expect(buildLatestExploreRunReport(completeRun)).toMatchObject({
      verdict: "proof_complete",
      actionBudget: 6,
      usedActionNumbers: [1, 2, 3, 4, 5, 6],
      passedCheckCount: 7,
      mainRevisionStart: 0,
      mainRevisionEnd: 0,
      labRevisionStart: 0,
      labRevisionEnd: 6,
    });
  });

  it("keeps a partial run in progress and flags an exhausted incomplete run", () => {
    const partial = buildLatestExploreRunReport(completeRun.slice(0, 3));
    expect(partial).toMatchObject({ verdict: "in_progress", passedCheckCount: 3 });

    const exhaustedWrongOrder = completeRun.map((entry, index) =>
      index === 5
        ? { ...entry, toolName: "check_hypothesis_branch", evidence: evidence({ hypothesisBranchId: "hypothesis_b", validationClassification: "valid" }) }
        : entry
    );
    expect(buildLatestExploreRunReport(exhaustedWrongOrder)).toMatchObject({
      verdict: "needs_attention",
      passedCheckCount: 6,
    });
  });

  it("ignores ordinary receipts when no Explore session exists", () => {
    expect(buildLatestExploreRunReport([{ ...completeRun[0], delegation: null }])).toBeNull();
  });
});
