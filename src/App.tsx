import { useEffect, useState, useSyncExternalStore } from "react";
import { CollaborationContract } from "./components/CollaborationContract";
import { AgentProofLedger } from "./components/AgentProofLedger";
import { DemoNotice } from "./components/DemoNotice";
import { DelegationSession } from "./components/DelegationSession";
import { DraftTray } from "./components/DraftTray";
import { LearningRecord } from "./components/LearningRecord";
import { MechanismCanvas } from "./components/MechanismCanvas";
import { ProblemBrief } from "./components/ProblemBrief";
import { PracticeCompass } from "./components/PracticeCompass";
import { ReactionDiff } from "./components/ReactionDiff";
import { ReasoningPanel } from "./components/ReasoningPanel";
import { demoSessionPath, savedPracticePath } from "./demo/demo-mode";
import { activeSessionMode, mechanismStore } from "./store/active-mechanism-store";
import { useMechanismState } from "./store/use-mechanism";
import { enabledToolCount, MECHANISM_TOOL_COUNT } from "./webmcp/register-tools";
import { COLLABORATION_MODE_LABELS } from "./domain/collaboration-contract";
import { toolReceiptLedger } from "./webmcp/tool-receipt-ledger";
import { delegationSessionManager } from "./webmcp/active-delegation-session";

type ToolStatus = "ready" | "manual" | "error";

export function App() {
  const state = useMechanismState();
  const problem = mechanismStore.getProblem();
  const problems = mechanismStore.getProblems();
  const collaborationContract = mechanismStore.getCollaborationContract();
  const delegationSession = useSyncExternalStore(
    delegationSessionManager.subscribe,
    delegationSessionManager.getSnapshot,
    delegationSessionManager.getSnapshot,
  );
  const activeToolCount = enabledToolCount(collaborationContract, delegationSession);
  const [toolStatus, setToolStatus] = useState<ToolStatus>(
    typeof document !== "undefined" && document.modelContext ? "ready" : "manual",
  );
  const sessionLink =
    activeSessionMode === "demo"
      ? savedPracticePath(window.location.href)
      : demoSessionPath(window.location.href);

  useEffect(() => {
    const handleStatus = (event: Event) => {
      const custom = event as CustomEvent<ToolStatus>;
      setToolStatus(custom.detail);
    };
    document.addEventListener("mechanism-canvas:webmcp-status", handleStatus);
    return () => document.removeEventListener("mechanism-canvas:webmcp-status", handleStatus);
  }, []);

  const reset = () => {
    const confirmed = window.confirm(
      `Reset ${problem.title}? Its draft, activity trail, hints, and committed steps will be replaced with a fresh reactant state.`,
    );
    if (confirmed) mechanismStore.resetProblem("human");
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#mechanism-workspace">
        Skip to mechanism workspace
      </a>
      <header className="topbar">
        <div className="topbar__inner">
          <div className="brand-block">
            <span className="brand-mark" aria-hidden="true">
              <span>e</span>
              <sup>−</sup>
            </span>
            <div>
              <strong>Mechanism Canvas</strong>
              <span>Curved-arrow practice</span>
            </div>
          </div>
          <div className="topbar-meta">
            <span className={`tool-status tool-status--${toolStatus}`}>
              <span aria-hidden="true" />
              {toolStatus === "ready"
                ? `${activeToolCount} of ${MECHANISM_TOOL_COUNT} site tools · ${COLLABORATION_MODE_LABELS[collaborationContract.mode]}`
                : toolStatus === "error"
                  ? "Site tools unavailable"
                  : "Manual mode"}
            </span>
            <a className="session-link" href={sessionLink}>
              {activeSessionMode === "demo" ? "Saved practice" : "Clean demo"}
            </a>
          </div>
        </div>
      </header>

      {activeSessionMode === "demo" && (
        <DemoNotice />
      )}

      <main className="workspace" id="mechanism-workspace">
        <CollaborationContract
          store={mechanismStore}
          sessionMode={activeSessionMode}
          delegationSession={delegationSession}
        />
        <DelegationSession store={mechanismStore} manager={delegationSessionManager} />
        <AgentProofLedger
          ledger={toolReceiptLedger}
          store={mechanismStore}
          sessionMode={activeSessionMode}
        />
        <ProblemBrief
          problem={problem}
          problems={problems}
          state={state}
          demoMode={activeSessionMode === "demo"}
          onProblemChange={(problemId) => mechanismStore.switchProblem(problemId, "human")}
          onReset={reset}
        />
        <div className="workbench-column">
          <MechanismCanvas problem={problem} state={state} store={mechanismStore} />
          <DraftTray problem={problem} state={state} store={mechanismStore} />
          <ReasoningPanel problem={problem} state={state} store={mechanismStore} />
          <PracticeCompass state={state} store={mechanismStore} sessionMode={activeSessionMode} />
          <ReactionDiff problem={problem} state={state} />
          <LearningRecord
            problem={problem}
            state={state}
            store={mechanismStore}
            sessionMode={activeSessionMode}
          />
        </div>
      </main>

      <footer className="app-footer">
        <span>Reviewed library</span>
        <p>{problems.length} chemistry-reviewed fixtures with deterministic checks.</p>
        <a href="https://learn.chatgpt.com/docs/webmcp" target="_blank" rel="noreferrer">
          About site tools
        </a>
      </footer>
    </div>
  );
}
