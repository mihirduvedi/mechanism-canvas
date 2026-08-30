import { useMemo, useState, useSyncExternalStore } from "react";
import type { MechanismStore } from "../store/mechanism-store";
import {
  buildToolReceiptExport,
  serializeToolReceiptExport,
  summarizeToolReceipts,
  type ToolReceipt,
  type ToolReceiptLedger,
  type ToolReceiptOutcome,
} from "../webmcp/tool-receipt-ledger";

interface AgentProofLedgerProps {
  ledger: ToolReceiptLedger;
  store: MechanismStore;
  sessionMode: "saved" | "demo";
}

const outcomeLabels: Record<ToolReceiptOutcome, string> = {
  succeeded: "Verified",
  rejected: "Guarded",
  failed: "Failed",
  canceled: "Canceled",
};

const kindLabels = {
  read: "Read",
  present: "Present",
  propose: "Propose",
  write: "Write",
} as const;

function formatTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

function formatDuration(durationMs: number): string {
  if (durationMs < 0.1) return "<0.1 ms";
  if (durationMs < 10) return `${durationMs.toFixed(1)} ms`;
  return `${Math.round(durationMs)} ms`;
}

function exportFilename(timestamp: string): string {
  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  return `mechanism-canvas-agent-proof-${safeTimestamp}.json`;
}

function downloadProof(ledger: ToolReceiptLedger, sessionMode: "saved" | "demo"): string {
  const record = buildToolReceiptExport(ledger, sessionMode);
  const filename = exportFilename(record.generatedAt);
  const objectUrl = URL.createObjectURL(
    new Blob([serializeToolReceiptExport(record)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return filename;
}

function receiptStateProof(receipt: ToolReceipt): string {
  if (receipt.changed.problem) {
    return `${receipt.before.problemId} → ${receipt.after.problemId}`;
  }
  if (receipt.changed.chemistry) {
    return `rev ${receipt.before.mechanismRevision} → ${receipt.after.mechanismRevision}`;
  }
  if (receipt.changed.activity) {
    return `activity ${receipt.before.activitySequence} → ${receipt.after.activitySequence}`;
  }
  return `rev ${receipt.after.mechanismRevision} unchanged`;
}

export function AgentProofLedger({ ledger, store, sessionMode }: AgentProofLedgerProps) {
  const receipts = useSyncExternalStore(
    ledger.subscribe,
    ledger.getSnapshot,
    ledger.getSnapshot,
  );
  const [status, setStatus] = useState("");
  const summary = useMemo(() => summarizeToolReceipts(receipts), [receipts]);
  const visibleReceipts = useMemo(() => [...receipts].reverse().slice(0, 8), [receipts]);
  const latestReceipt = receipts.at(-1);

  const copyProof = async () => {
    try {
      const record = buildToolReceiptExport(ledger, sessionMode);
      await navigator.clipboard.writeText(serializeToolReceiptExport(record));
      setStatus(`Copied ${record.summary.total} privacy-minimized receipts.`);
    } catch {
      setStatus("The proof record could not be copied. Download the JSON instead.");
    }
  };

  const clearProof = () => {
    const confirmed = window.confirm(
      "Clear the Agent Proof Ledger for this tab? Chemistry, progress, and the shared activity trail will stay unchanged.",
    );
    if (!confirmed) return;
    ledger.clear();
    setStatus("Tab receipts cleared. Chemistry and learner progress were unchanged.");
  };

  const focusReceipt = (receipt: ToolReceipt) => {
    const result = store.focusEntities(receipt.entityIds, "human");
    if (!result.ok) {
      setStatus(result.error?.message ?? "Those receipt entities are not visible in the current state.");
      return;
    }
    setStatus(`Focused the semantic objects from receipt ${receipt.sequence}.`);
  };

  return (
    <section className="agent-proof-ledger" aria-labelledby="agent-proof-heading">
      <div className="agent-proof-ledger__masthead">
        <div>
          <p className="section-kicker">Verified WebMCP execution</p>
          <h2 id="agent-proof-heading">Every Site Tool call leaves a proof receipt.</h2>
          <p>
            The page records what the agent asked, which guard decided, and what actually
            changed—without retaining prompts, rationales, raw inputs, or raw outputs.
          </p>
        </div>
        <div className="agent-proof-ledger__seal" aria-label="Proof receipt count">
          <span>Tab receipts</span>
          <strong>{summary.total}</strong>
          <small>{latestReceipt ? `latest #${latestReceipt.sequence}` : "waiting for WebMCP"}</small>
        </div>
      </div>

      <div className="agent-proof-ledger__summary">
        <dl className="proof-metrics">
          <div><dt>Verified</dt><dd>{summary.succeeded}</dd></div>
          <div><dt>Guarded</dt><dd>{summary.rejected}</dd></div>
          <div><dt>Read / present</dt><dd>{summary.reads + summary.presentations}</dd></div>
          <div><dt>Propose / write</dt><dd>{summary.proposals + summary.writes}</dd></div>
        </dl>
        <div className="agent-proof-ledger__actions">
          <button
            className="button button--secondary"
            type="button"
            disabled={receipts.length === 0}
            onClick={() => {
              const filename = downloadProof(ledger, sessionMode);
              setStatus(`Downloaded ${filename}.`);
            }}
          >
            Download proof JSON
          </button>
          <button
            className="text-button"
            type="button"
            disabled={receipts.length === 0}
            onClick={copyProof}
          >
            Copy proof JSON
          </button>
          {receipts.length > 0 && (
            <button className="text-button text-button--danger" type="button" onClick={clearProof}>
              Clear tab receipts
            </button>
          )}
        </div>
      </div>

      {receipts.length === 0 ? (
        <div className="agent-proof-ledger__empty">
          <span aria-hidden="true">01</span>
          <div>
            <strong>No agent calls in this tab yet.</strong>
            <p>
              Ask the agent to read the collaboration contract or mechanism state. The first
              receipt will appear here while chemistry and learner progress stay untouched.
            </p>
          </div>
        </div>
      ) : (
        <div className="agent-proof-ledger__receipts">
          <div className="agent-proof-ledger__list-heading">
            <strong>Latest execution evidence</strong>
            <span>Showing {visibleReceipts.length} of {receipts.length} retained in this tab</span>
          </div>
          <ol className="proof-receipt-list">
            {visibleReceipts.map((receipt) => {
              const canFocus =
                receipt.entityIds.length > 0 &&
                receipt.after.problemId === store.getProblem().id &&
                receipt.after.currentStateId === store.getState().currentStateId;
              return (
                <li className={`proof-receipt proof-receipt--${receipt.outcome}`} key={receipt.id}>
                  <span className="proof-receipt__sequence">#{String(receipt.sequence).padStart(3, "0")}</span>
                  <div className="proof-receipt__body">
                    <div className="proof-receipt__title">
                      <code>{receipt.toolName}</code>
                      <span>{kindLabels[receipt.kind]}</span>
                    </div>
                    <p>{receipt.intent}</p>
                    <small>{receipt.result}</small>
                  </div>
                  <div className="proof-receipt__evidence">
                    <span className={`proof-outcome proof-outcome--${receipt.outcome}`}>
                      {outcomeLabels[receipt.outcome]}
                    </span>
                    <strong>{receiptStateProof(receipt)}</strong>
                    <span>{receipt.before.collaborationMode} · contract {receipt.before.contractRevision}</span>
                    <time dateTime={receipt.completedAt}>
                      {formatTime(receipt.completedAt)} · {formatDuration(receipt.durationMs)}
                    </time>
                    {canFocus && (
                      <button className="text-button" type="button" onClick={() => focusReceipt(receipt)}>
                        Focus touched items
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="agent-proof-ledger__boundary">
        <span>Privacy boundary</span>
        <p>
          Session-only, capped at 60 calls, and never written to saved practice. This ledger
          proves page effects; ChatGPT still performs its own safety review before invocation.
        </p>
      </div>
      <p className="agent-proof-ledger__status" role="status" aria-live="polite">{status}</p>
      <p className="sr-only" aria-live="polite">
        {latestReceipt
          ? `Proof receipt ${latestReceipt.sequence}: ${latestReceipt.toolName}, ${outcomeLabels[latestReceipt.outcome]}.`
          : ""}
      </p>
    </section>
  );
}
