import { describe, expect, it } from "vitest";
import { createMechanismStore } from "../store/mechanism-store";
import {
  MAX_TOOL_RECEIPTS,
  buildToolReceiptExport,
  captureToolState,
  changedToolState,
  createToolReceiptLedger,
  receiptEntityIds,
  serializeToolReceiptExport,
  summarizeToolIntent,
  summarizeToolReceipts,
  summarizeToolResult,
  toolKind,
  type ToolReceipt,
} from "./tool-receipt-ledger";

function receipt(sequence: number, overrides: Partial<ToolReceipt> = {}): Omit<ToolReceipt, "id" | "sequence"> {
  const stamp = {
    problemId: "sn2_01",
    currentStateId: "reactants",
    mechanismRevision: 0,
    activitySequence: 0,
    draftArrowCount: 0,
    collaborationMode: "coach" as const,
    contractRevision: 0,
  };
  return {
    toolName: "get_mechanism_state",
    kind: "read",
    outcome: "succeeded",
    intent: `Read state ${sequence}.`,
    result: "Completed with shared page state unchanged.",
    code: null,
    entityIds: [],
    delegation: null,
    startedAt: "2026-08-30T00:00:00.000Z",
    completedAt: "2026-08-30T00:00:00.001Z",
    durationMs: 1,
    before: stamp,
    after: stamp,
    changed: {
      problem: false,
      chemistry: false,
      draft: false,
      activity: false,
      contract: false,
    },
    ...overrides,
  };
}

describe("WebMCP Agent Proof Ledger", () => {
  it("creates bounded, privacy-minimized intent summaries without retaining rationale text", () => {
    const input = {
      arrows: [
        {
          sourceType: "lone_pair",
          sourceEntityId: "lp_n_attack_1",
          targetAtomId: "c_methyl",
        },
      ],
      rationale: "PRIVATE FREE-FORM AGENT RATIONALE THAT MUST NOT ENTER THE RECEIPT",
      expectedRevision: 4,
    };

    const summary = summarizeToolIntent("propose_draft_arrows", input);
    expect(summary).toBe("Stage 1 reviewable draft arrow at revision 4.");
    expect(summary).not.toContain("PRIVATE");
    expect(receiptEntityIds(input)).toEqual(["lp_n_attack_1", "c_methyl"]);
    expect(toolKind("propose_draft_arrows")).toBe("propose");
    expect(toolKind("add_draft_arrow")).toBe("write");

    const allowlisted = {
      entityIds: new Set(["lp_n_attack_1", "c_methyl"]),
      problemIds: new Set(["sn2_01"]),
      stateIds: new Set(["reactants"]),
      draftArrowIds: new Set<string>(),
    };
    const hostileInput = {
      entityIds: ["lp_n_attack_1", "PRIVATE_AGENT_TEXT"],
      validationId: "PRIVATE_VALIDATION_TOKEN",
      expectedRevision: 4,
    };
    expect(receiptEntityIds(hostileInput, allowlisted.entityIds)).toEqual(["lp_n_attack_1"]);
    expect(summarizeToolIntent("commit_checked_step", hostileInput, allowlisted)).toBe(
      "Commit a checked step at revision 4.",
    );
    expect(summarizeToolIntent("commit_checked_step", hostileInput, allowlisted)).not.toContain("PRIVATE");
  });

  it("captures separate chemistry, activity, draft, contract, and problem evidence", () => {
    const store = createMechanismStore(undefined, null);
    const before = captureToolState(store);
    store.setCollaborationContract({
      mode: "collaborate",
      maxAgentScaffoldLevel: 4,
      learnerCommitsOnly: true,
    });
    const after = captureToolState(store);

    expect(changedToolState(before, after)).toEqual({
      problem: false,
      chemistry: false,
      draft: false,
      activity: true,
      contract: true,
    });
    expect(summarizeToolResult("succeeded", null, before, after)).toBe(
      "Activity 0 → 1; chemistry revision unchanged.",
    );
  });

  it("caps session receipts, keeps monotonic sequence IDs after clearing, and exports an allowlisted record", () => {
    const ledger = createToolReceiptLedger("receipt_session_test");
    for (let index = 1; index <= MAX_TOOL_RECEIPTS + 3; index += 1) {
      ledger.append(receipt(index));
    }

    expect(ledger.getSnapshot()).toHaveLength(MAX_TOOL_RECEIPTS);
    expect(ledger.getSnapshot()[0].sequence).toBe(4);
    expect(ledger.getSnapshot().at(-1)?.sequence).toBe(MAX_TOOL_RECEIPTS + 3);

    const record = buildToolReceiptExport(ledger, "demo", "2026-08-30T01:00:00.000Z");
    expect(record).toMatchObject({
      schemaVersion: 2,
      application: "Mechanism Canvas",
      sessionId: "receipt_session_test",
      sessionMode: "demo",
      summary: { total: MAX_TOOL_RECEIPTS, reads: MAX_TOOL_RECEIPTS, succeeded: MAX_TOOL_RECEIPTS },
    });
    expect(serializeToolReceiptExport(record)).toMatch(/"privacy":/);

    ledger.clear();
    expect(ledger.getSnapshot()).toEqual([]);
    expect(ledger.append(receipt(99)).sequence).toBe(MAX_TOOL_RECEIPTS + 4);
  });

  it("summarizes success, rejection, failure, and cancellation independently", () => {
    const entries = [
      { ...receipt(1), outcome: "succeeded" as const, kind: "read" as const },
      { ...receipt(2), outcome: "rejected" as const, kind: "write" as const },
      { ...receipt(3), outcome: "failed" as const, kind: "propose" as const },
      { ...receipt(4), outcome: "canceled" as const, kind: "present" as const },
    ].map((entry, index) => ({ ...entry, id: `r${index}`, sequence: index + 1 }));

    expect(summarizeToolReceipts(entries)).toEqual({
      total: 4,
      reads: 1,
      presentations: 1,
      proposals: 1,
      writes: 1,
      succeeded: 1,
      rejected: 1,
      failed: 1,
      canceled: 1,
    });
  });
});
