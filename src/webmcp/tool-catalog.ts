import type { CollaborationContract } from "../domain/types";
import type { DelegationSession } from "./delegation-session";
import type { HypothesisLab } from "./hypothesis-lab";

export const WEBMCP_TOOL_GROUPS = [
  { id: "evidence", label: "State & proof", shortLabel: "Evidence" },
  { id: "inspection", label: "Inspect & present", shortLabel: "Inspect" },
  { id: "coaching", label: "Coach & propose", shortLabel: "Coach" },
  { id: "workspace", label: "Direct workspace", shortLabel: "Edit" },
  { id: "lab", label: "Counterfactual Lab", shortLabel: "Lab" },
] as const;

export type WebMcpToolGroupId = (typeof WEBMCP_TOOL_GROUPS)[number]["id"];
export type WebMcpToolGate =
  | "always"
  | "coach"
  | "scaffold"
  | "collaborate"
  | "shared_commit"
  | "lab_read"
  | "lab_work";

export interface WebMcpToolCatalogEntry {
  name: string;
  label: string;
  groupId: WebMcpToolGroupId;
  gate: WebMcpToolGate;
}

export const WEBMCP_TOOL_CATALOG = [
  { name: "get_mechanism_state", label: "Read mechanism state", groupId: "evidence", gate: "always" },
  { name: "get_collaboration_contract", label: "Read learner contract", groupId: "evidence", gate: "always" },
  { name: "get_delegation_session", label: "Read bounded session", groupId: "evidence", gate: "always" },
  { name: "get_agent_action_receipts", label: "Read proof receipts", groupId: "evidence", gate: "always" },
  { name: "get_learning_profile", label: "Read learning profile", groupId: "evidence", gate: "always" },
  { name: "get_activity_trail", label: "Read activity trail", groupId: "evidence", gate: "always" },
  { name: "inspect_mechanism_entities", label: "Inspect semantic entities", groupId: "inspection", gate: "always" },
  { name: "view_mechanism_history_state", label: "Present reached state", groupId: "inspection", gate: "always" },
  { name: "compare_reached_step", label: "Compare reached step", groupId: "inspection", gate: "always" },
  { name: "replay_reached_step", label: "Replay electron flow", groupId: "inspection", gate: "always" },
  { name: "focus_mechanism_entities", label: "Focus canvas evidence", groupId: "inspection", gate: "always" },
  { name: "propose_practice_plan", label: "Propose practice plan", groupId: "coaching", gate: "coach" },
  { name: "propose_draft_arrows", label: "Propose draft arrows", groupId: "coaching", gate: "coach" },
  { name: "check_draft_step", label: "Check current draft", groupId: "coaching", gate: "coach" },
  { name: "request_scaffold", label: "Request bounded hint", groupId: "coaching", gate: "scaffold" },
  { name: "switch_problem", label: "Switch exercise", groupId: "coaching", gate: "coach" },
  { name: "add_draft_arrow", label: "Add draft arrow", groupId: "workspace", gate: "collaborate" },
  { name: "remove_draft_arrow", label: "Remove draft arrow", groupId: "workspace", gate: "collaborate" },
  { name: "undo_last_commit", label: "Undo last commit", groupId: "workspace", gate: "collaborate" },
  { name: "reset_active_exercise", label: "Reset active exercise", groupId: "workspace", gate: "collaborate" },
  { name: "commit_checked_step", label: "Commit checked step", groupId: "workspace", gate: "shared_commit" },
  { name: "get_hypothesis_lab", label: "Read isolated lab", groupId: "lab", gate: "lab_read" },
  { name: "set_hypothesis_branch", label: "Set hypothesis branch", groupId: "lab", gate: "lab_work" },
  { name: "check_hypothesis_branch", label: "Check hypothesis branch", groupId: "lab", gate: "lab_work" },
  { name: "compare_hypothesis_branches", label: "Compare lab evidence", groupId: "lab", gate: "lab_work" },
  { name: "recommend_hypothesis_branch", label: "Recommend checked branch", groupId: "lab", gate: "lab_work" },
] as const satisfies readonly WebMcpToolCatalogEntry[];

export type MechanismToolName = (typeof WEBMCP_TOOL_CATALOG)[number]["name"];
export const MECHANISM_TOOL_COUNT = WEBMCP_TOOL_CATALOG.length;

function baseGateReason(
  tool: WebMcpToolCatalogEntry,
  contract: CollaborationContract,
  lab: HypothesisLab | null,
): string | null {
  if (tool.gate === "lab_read" && !lab) return "Lab closed";
  if (tool.gate === "lab_work" && !lab) return "Lab closed";
  if (tool.gate === "lab_work" && lab?.status !== "active") return "Lab no longer active";
  if ((tool.gate === "coach" || tool.gate === "scaffold" || tool.gate === "lab_work") && contract.mode === "observe") {
    return "Observe keeps work read-only";
  }
  if (tool.gate === "scaffold" && contract.maxAgentScaffoldLevel === 0) {
    return "Hint ceiling is zero";
  }
  if ((tool.gate === "collaborate" || tool.gate === "shared_commit") && contract.mode !== "collaborate") {
    return `${contract.mode === "coach" ? "Coach" : "Observe"} does not allow direct edits`;
  }
  if (tool.gate === "shared_commit" && contract.learnerCommitsOnly) {
    return "Commit is learner-only";
  }
  return null;
}

export function toolAvailabilityReason(
  tool: WebMcpToolCatalogEntry,
  activeToolNames: ReadonlySet<string>,
  contract: CollaborationContract,
  delegation: DelegationSession | null,
  lab: HypothesisLab | null,
): string {
  if (activeToolNames.has(tool.name)) return "Discoverable now";
  const gateReason = baseGateReason(tool, contract, lab);
  if (gateReason) return gateReason;
  if (!delegation) return "Not relevant in this state";
  if (delegation.status === "exhausted") return "Action budget spent";
  if (delegation.status === "drifted") return "Delegated scope changed";
  return `Outside ${delegation.presetLabel} grant`;
}
