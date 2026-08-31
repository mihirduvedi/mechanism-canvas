import type { ToolReceipt } from "./tool-receipt-ledger";

export type WebMcpRunVerdict = "in_progress" | "proof_complete" | "needs_attention";
export type WebMcpRunCheckStatus = "passed" | "pending";

export interface WebMcpRunCheck {
  id: string;
  label: string;
  detail: string;
  status: WebMcpRunCheckStatus;
}

export interface WebMcpExploreRunReport {
  sessionId: string;
  presetLabel: string;
  problemId: string;
  stateId: string;
  actionBudget: number;
  usedActionNumbers: number[];
  toolSequence: string[];
  verdict: WebMcpRunVerdict;
  checks: WebMcpRunCheck[];
  passedCheckCount: number;
  mainRevisionStart: number;
  mainRevisionEnd: number;
  labRevisionStart: number | null;
  labRevisionEnd: number | null;
  latestReceiptSequence: number;
}

function check(
  id: string,
  label: string,
  passed: boolean,
  passedDetail: string,
  pendingDetail: string,
): WebMcpRunCheck {
  return {
    id,
    label,
    status: passed ? "passed" : "pending",
    detail: passed ? passedDetail : pendingDetail,
  };
}

function isNonValidClassification(receipt: ToolReceipt): boolean {
  const classification = receipt.evidence?.validationClassification;
  return Boolean(classification && classification !== "valid");
}

export function buildLatestExploreRunReport(
  receipts: readonly ToolReceipt[],
): WebMcpExploreRunReport | null {
  const latestExploreReceipt = [...receipts].reverse().find(
    (receipt) => receipt.delegation?.presetId === "explore",
  );
  const sessionId = latestExploreReceipt?.delegation?.sessionId;
  if (!latestExploreReceipt?.delegation || !sessionId) return null;

  const sessionReceipts = receipts.filter(
    (receipt) => receipt.delegation?.sessionId === sessionId,
  );
  const workReceipts = sessionReceipts.filter(
    (receipt) => receipt.delegation?.actionNumber !== null,
  );
  const actionBudget = latestExploreReceipt.delegation.actionBudget;
  const actionNumbers = workReceipts
    .map((receipt) => receipt.delegation?.actionNumber)
    .filter((value): value is number => value !== null && value !== undefined);
  const uniqueActionNumbers = [...new Set(actionNumbers)].sort((left, right) => left - right);
  const expectedActionNumbers = Array.from({ length: actionBudget }, (_, index) => index + 1);

  const scoped = workReceipts.length > 0 && workReceipts.every((receipt) =>
    receipt.delegation?.problemId === latestExploreReceipt.delegation?.problemId &&
    receipt.delegation?.stateId === latestExploreReceipt.delegation?.stateId
  );
  const setBranches = new Set(
    workReceipts
      .filter((receipt) => receipt.toolName === "set_hypothesis_branch" && receipt.outcome === "succeeded")
      .map((receipt) => receipt.evidence?.hypothesisBranchId)
      .filter((value): value is string => Boolean(value)),
  );
  const checkReceipts = workReceipts.filter(
    (receipt) => receipt.toolName === "check_hypothesis_branch" && receipt.outcome === "succeeded",
  );
  const firstNonValidIndex = checkReceipts.findIndex(isNonValidClassification);
  const validAfterCorrection = firstNonValidIndex >= 0 && checkReceipts
    .slice(firstNonValidIndex + 1)
    .some((receipt) => receipt.evidence?.validationClassification === "valid");
  const compared = workReceipts.some(
    (receipt) =>
      receipt.toolName === "compare_hypothesis_branches" &&
      receipt.outcome === "succeeded" &&
      Boolean(receipt.evidence?.comparedBranchIds),
  );
  const recommended = workReceipts.some(
    (receipt) =>
      receipt.toolName === "recommend_hypothesis_branch" &&
      receipt.outcome === "succeeded" &&
      receipt.evidence?.awaitingLearnerApproval === true,
  );
  const mainStayedSealed = workReceipts.length > 0 && workReceipts.every((receipt) =>
    !receipt.changed.chemistry &&
    !receipt.changed.draft &&
    receipt.before.mechanismRevision === receipt.after.mechanismRevision &&
    receipt.before.draftArrowCount === receipt.after.draftArrowCount
  );
  const budgetClosed =
    uniqueActionNumbers.length === expectedActionNumbers.length &&
    uniqueActionNumbers.every((value, index) => value === expectedActionNumbers[index]);

  const checks = [
    check(
      "scope",
      "One frozen scope",
      scoped,
      `All ${workReceipts.length} work calls stayed on ${latestExploreReceipt.delegation.problemId} · ${latestExploreReceipt.delegation.stateId}.`,
      "Waiting for the first scoped work call.",
    ),
    check(
      "alternatives",
      "Competing branches",
      setBranches.size >= 2,
      `${setBranches.size} distinct hypothesis branches were built through Site Tools.`,
      `${setBranches.size} of 2 distinct branches built.`,
    ),
    check(
      "correction",
      "Evidence-driven correction",
      validAfterCorrection,
      "A non-valid branch check was followed by a validator-approved alternative.",
      "Waiting for a non-valid check followed by a valid check.",
    ),
    check(
      "comparison",
      "Structured comparison",
      compared,
      "Checked branch evidence was compared in a separate Site Tool call.",
      "Waiting for checked branches to be compared.",
    ),
    check(
      "handoff",
      "Validated handoff",
      recommended,
      "A valid branch was staged for learner approval, not applied.",
      "Waiting for a validator-gated recommendation.",
    ),
    check(
      "seal",
      "Main work stayed sealed",
      mainStayedSealed,
      "Every metered call left the main draft and mechanism revision unchanged.",
      "The run has not yet produced enough page-side seal evidence.",
    ),
    check(
      "budget",
      "Finite budget closed",
      budgetClosed,
      `Actions 1 through ${actionBudget} are accounted for; the work surface can close.`,
      `${uniqueActionNumbers.length} of ${actionBudget} metered action ordinals recorded.`,
    ),
  ];

  const proofComplete = checks.every((candidate) => candidate.status === "passed");
  const hasExecutionProblem = workReceipts.some((receipt) => receipt.outcome !== "succeeded");
  const verdict: WebMcpRunVerdict = proofComplete
    ? "proof_complete"
    : hasExecutionProblem || budgetClosed
      ? "needs_attention"
      : "in_progress";
  const firstWork = workReceipts[0] ?? latestExploreReceipt;
  const lastWork = workReceipts.at(-1) ?? latestExploreReceipt;

  return {
    sessionId,
    presetLabel: latestExploreReceipt.delegation.presetLabel,
    problemId: latestExploreReceipt.delegation.problemId,
    stateId: latestExploreReceipt.delegation.stateId,
    actionBudget,
    usedActionNumbers: uniqueActionNumbers,
    toolSequence: workReceipts.map((receipt) => receipt.toolName),
    verdict,
    checks,
    passedCheckCount: checks.filter((candidate) => candidate.status === "passed").length,
    mainRevisionStart: firstWork.before.mechanismRevision,
    mainRevisionEnd: lastWork.after.mechanismRevision,
    labRevisionStart: firstWork.before.hypothesisLabRevision,
    labRevisionEnd: lastWork.after.hypothesisLabRevision,
    latestReceiptSequence: latestExploreReceipt.sequence,
  };
}
