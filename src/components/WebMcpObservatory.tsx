import { useMemo, useSyncExternalStore } from "react";
import type { CollaborationContract as CollaborationContractState } from "../domain/types";
import type { DelegationSession } from "../webmcp/delegation-session";
import type { HypothesisLab } from "../webmcp/hypothesis-lab";
import {
  type CapabilitySurfaceRecorder,
  type CapabilitySurfaceEvent,
  type WebMcpHostStatus,
} from "../webmcp/capability-surface-recorder";
import { enabledToolNames } from "../webmcp/register-tools";
import {
  MECHANISM_TOOL_COUNT,
  WEBMCP_TOOL_CATALOG,
  WEBMCP_TOOL_GROUPS,
  toolAvailabilityReason,
} from "../webmcp/tool-catalog";
import type { ToolReceiptLedger } from "../webmcp/tool-receipt-ledger";
import { buildLatestExploreRunReport } from "../webmcp/webmcp-run-report";

interface WebMcpObservatoryProps {
  contract: CollaborationContractState;
  delegationSession: DelegationSession | null;
  hypothesisLab: HypothesisLab | null;
  hostStatus: WebMcpHostStatus;
  recorder: CapabilitySurfaceRecorder;
  receiptLedger: ToolReceiptLedger;
}

const hostStatusCopy = {
  ready: {
    eyebrow: "Host attested",
    detail: "registerTool batch accepted",
  },
  manual: {
    eyebrow: "Policy preview",
    detail: "compatible host unavailable",
  },
  error: {
    eyebrow: "Registration issue",
    detail: "last accepted surface retained",
  },
} as const;

const verdictCopy = {
  in_progress: { label: "Run in progress", detail: "Proof is assembling from real callbacks." },
  proof_complete: { label: "Journey proof complete", detail: "All seven page-side claims are evidenced." },
  needs_attention: { label: "Run needs review", detail: "The budget closed or a call did not succeed." },
} as const;

function sameToolSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((name) => rightSet.has(name));
}

function formatClock(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

function surfaceCause(event: CapabilitySurfaceEvent): string {
  if (event.scope.delegationSessionId) {
    return `${event.scope.delegationPresetLabel ?? "Bounded"} · ${event.scope.delegationStatus}`;
  }
  if (event.scope.hypothesisLabId) {
    return `Lab ${event.scope.hypothesisLabStatus}`;
  }
  return `${event.scope.collaborationMode} contract`;
}

function diffLabel(event: CapabilitySurfaceEvent): string {
  const additions = event.addedToolNames.length ? `+${event.addedToolNames.length}` : "+0";
  const removals = event.removedToolNames.length ? `−${event.removedToolNames.length}` : "−0";
  return `${additions} / ${removals}`;
}

export function WebMcpObservatory({
  contract,
  delegationSession,
  hypothesisLab,
  hostStatus,
  recorder,
  receiptLedger,
}: WebMcpObservatoryProps) {
  const surfaceSnapshot = useSyncExternalStore(
    recorder.subscribe,
    recorder.getSnapshot,
    recorder.getSnapshot,
  );
  const receipts = useSyncExternalStore(
    receiptLedger.subscribe,
    receiptLedger.getSnapshot,
    receiptLedger.getSnapshot,
  );
  const contractTools = enabledToolNames(contract, null, null);
  const relevantTools = enabledToolNames(contract, null, hypothesisLab);
  const activeTools = enabledToolNames(contract, delegationSession, hypothesisLab);
  const activeToolSet = useMemo(() => new Set(activeTools), [activeTools.join("|")]);
  const report = useMemo(() => buildLatestExploreRunReport(receipts), [receipts]);
  const recentEvents = [...surfaceSnapshot.events].reverse().slice(0, 4);
  const attestedTools = surfaceSnapshot.latest?.toolNames ?? [];
  const hostMatchesPolicy = hostStatus === "ready" && sameToolSet(attestedTools, activeTools);
  const hostCount = hostStatus === "ready" ? attestedTools.length : activeTools.length;
  const statusCopy = hostStatusCopy[hostStatus];

  return (
    <section className="webmcp-observatory" aria-labelledby="webmcp-observatory-heading">
      <div className="webmcp-observatory__masthead">
        <div>
          <p className="section-kicker">Live WebMCP Observatory</p>
          <h2 id="webmcp-observatory-heading">See capability discovery become execution proof.</h2>
          <p>
            Page policy predicts the useful tools; the flight recorder attests a surface only
            after the host accepts its real registration batch. Actual callbacks then assemble
            a deterministic journey report.
          </p>
        </div>
        <div
          className={`webmcp-observatory__seal webmcp-observatory__seal--${hostStatus}`}
          aria-label="WebMCP host registration status"
        >
          <span>{statusCopy.eyebrow}</span>
          <strong>{hostCount}<small> / {MECHANISM_TOOL_COUNT}</small></strong>
          <small>{hostMatchesPolicy ? "policy and host match" : statusCopy.detail}</small>
        </div>
      </div>

      <div className="webmcp-flight-path" aria-label="WebMCP capability narrowing path">
        <div>
          <span>01 · Contract</span>
          <strong>{contractTools.length}</strong>
          <small>{contract.mode} permission base</small>
        </div>
        <div>
          <span>02 · Page state</span>
          <strong>{relevantTools.length}</strong>
          <small>{hypothesisLab ? `Lab ${hypothesisLab.status}` : "Lab closed"}</small>
        </div>
        <div>
          <span>03 · Intent</span>
          <strong>{activeTools.length}</strong>
          <small>{delegationSession ? `${delegationSession.presetLabel} · ${delegationSession.status}` : "No bounded job"}</small>
        </div>
        <div className={`webmcp-flight-path__host webmcp-flight-path__host--${hostStatus}`}>
          <span>04 · Host</span>
          <strong>{hostCount}</strong>
          <small>{hostMatchesPolicy ? "accepted and live" : statusCopy.detail}</small>
        </div>
      </div>

      <div className="webmcp-observatory__evidence-grid">
        <section className="webmcp-run-report" aria-labelledby="webmcp-run-report-heading">
          <div className="webmcp-run-report__heading">
            <div>
              <span>Journey eval</span>
              <h3 id="webmcp-run-report-heading">Compare hypotheses run</h3>
            </div>
            {report && (
              <strong className={`webmcp-run-verdict webmcp-run-verdict--${report.verdict}`}>
                {verdictCopy[report.verdict].label}
              </strong>
            )}
          </div>
          {!report ? (
            <div className="webmcp-run-report__empty">
              <strong>No Explore callbacks yet.</strong>
              <p>
                Open a Lab and start Compare hypotheses. Each metered Site Tool call will fill
                this report without reading the chat transcript.
              </p>
            </div>
          ) : (
            <>
              <div className="webmcp-run-report__metrics">
                <div><span>Claims proved</span><strong>{report.passedCheckCount} / {report.checks.length}</strong></div>
                <div><span>Lab revision</span><strong>{report.labRevisionStart ?? "—"} → {report.labRevisionEnd ?? "—"}</strong></div>
                <div><span>Main revision</span><strong>{report.mainRevisionStart} → {report.mainRevisionEnd}</strong></div>
                <div><span>Actions</span><strong>{report.usedActionNumbers.length} / {report.actionBudget}</strong></div>
              </div>
              <ol className="webmcp-run-checks">
                {report.checks.map((candidate, index) => (
                  <li className={`webmcp-run-check webmcp-run-check--${candidate.status}`} key={candidate.id}>
                    <span aria-hidden="true">{candidate.status === "passed" ? "✓" : String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>{candidate.label}</strong>
                      <small>{candidate.detail}</small>
                    </div>
                    <em>{candidate.status === "passed" ? "Proved" : "Pending"}</em>
                  </li>
                ))}
              </ol>
              <p className="webmcp-run-report__boundary">
                {verdictCopy[report.verdict].detail} This evaluates page-side calls and effects,
                not the quality of the agent’s prose.
              </p>
            </>
          )}
        </section>

        <section className="webmcp-surface-history" aria-labelledby="webmcp-surface-history-heading">
          <div className="webmcp-surface-history__heading">
            <div>
              <span>Registration lifecycle</span>
              <h3 id="webmcp-surface-history-heading">Host-accepted surfaces</h3>
            </div>
            <strong>{surfaceSnapshot.events.length}</strong>
          </div>
          {hostStatus === "manual" && recentEvents.length === 0 ? (
            <div className="webmcp-surface-history__empty">
              <strong>Policy preview only.</strong>
              <p>
                This browser does not expose <code>document.modelContext</code>. Counts remain
                useful for manual inspection, but no host registration is claimed.
              </p>
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="webmcp-surface-history__empty">
              <strong>Waiting for host acknowledgement.</strong>
              <p>The first completed registration batch will appear here.</p>
            </div>
          ) : (
            <ol className="webmcp-surface-event-list">
              {recentEvents.map((event) => (
                <li key={event.sequence}>
                  <span>#{String(event.sequence).padStart(2, "0")}</span>
                  <div>
                    <strong>{event.toolNames.length} tools · {surfaceCause(event)}</strong>
                    <small>{formatClock(event.recordedAt)} · {diffLabel(event)} capabilities</small>
                  </div>
                  <div className="webmcp-surface-event__diff">
                    {event.addedToolNames.length > 0 && <span>Added {event.addedToolNames.length}</span>}
                    {event.removedToolNames.length > 0 && <span>Withdrew {event.removedToolNames.length}</span>}
                    {event.addedToolNames.length === 0 && event.removedToolNames.length === 0 && <span>Re-attested</span>}
                  </div>
                </li>
              ))}
            </ol>
          )}
          {hostStatus === "error" && (
            <p className="webmcp-surface-history__error" role="status">
              {surfaceSnapshot.errorMessage ?? "The latest registration batch was rejected."}
            </p>
          )}
          <div className="webmcp-surface-history__boundary">
            <span>Evidence boundary</span>
            <p>
              “Host accepted” means each <code>registerTool</code> promise resolved for that
              batch. Manual projections and failed refreshes are never relabeled as live proof.
            </p>
          </div>
        </section>
      </div>

      <details className="webmcp-capability-catalog">
        <summary>
          <span>Inspect all {MECHANISM_TOOL_COUNT} capabilities and current withdrawal reasons</span>
          <strong>{activeTools.length} discoverable now</strong>
        </summary>
        <div className="webmcp-capability-catalog__groups">
          {WEBMCP_TOOL_GROUPS.map((group) => {
            const groupTools = WEBMCP_TOOL_CATALOG.filter((tool) => tool.groupId === group.id);
            const groupActiveCount = groupTools.filter((tool) => activeToolSet.has(tool.name)).length;
            return (
              <section key={group.id} aria-labelledby={`webmcp-tool-group-${group.id}`}>
                <div>
                  <h3 id={`webmcp-tool-group-${group.id}`}>{group.label}</h3>
                  <span>{groupActiveCount} / {groupTools.length} live</span>
                </div>
                <ul>
                  {groupTools.map((tool) => {
                    const active = activeToolSet.has(tool.name);
                    return (
                      <li className={active ? "is-active" : "is-dormant"} key={tool.name}>
                        <span aria-hidden="true" />
                        <div><strong>{tool.label}</strong><code>{tool.name}</code></div>
                        <small>{toolAvailabilityReason(tool, activeToolSet, contract, delegationSession, hypothesisLab)}</small>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </details>

      <p className="sr-only" aria-live="polite">
        {report?.verdict === "proof_complete"
          ? `WebMCP journey proof complete with ${report.passedCheckCount} of ${report.checks.length} claims proved.`
          : ""}
      </p>
    </section>
  );
}
