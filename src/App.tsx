import { useEffect, useState, useSyncExternalStore } from "react";
import { CollaborationContract } from "./components/CollaborationContract";
import { AgentProofLedger } from "./components/AgentProofLedger";
import { AgentSandboxPreview } from "./components/AgentSandboxPreview";
import { DemoNotice } from "./components/DemoNotice";
import { DelegationSession } from "./components/DelegationSession";
import { HypothesisLab } from "./components/HypothesisLab";
import { WebMcpObservatory } from "./components/WebMcpObservatory";
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
import { hypothesisLabManager } from "./webmcp/active-hypothesis-lab";
import { capabilitySurfaceRecorder } from "./webmcp/capability-surface-recorder";

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
  const hypothesisLab = useSyncExternalStore(
    hypothesisLabManager.subscribe,
    hypothesisLabManager.getSnapshot,
    hypothesisLabManager.getSnapshot,
  );
  const activeToolCount = enabledToolCount(
    collaborationContract,
    delegationSession,
    hypothesisLab,
  );
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

      <main className="workspace" id="mechanism-workspace">
        <AgentSandboxPreview
          problemTitle={problem.title}
          draftArrowCount={state.draftArrows.length}
          lab={hypothesisLab}
          delegationSession={delegationSession}
        />

        <section className="reaction-studio" aria-labelledby="reaction-studio-heading">
          <header className="reaction-studio__intro">
            <p className="section-kicker">Your mechanism</p>
            <h2 id="reaction-studio-heading">Move the electrons. Check the whole step.</h2>
            <p>
              Pick an electron source on the structure, choose its destination, then let the
              deterministic checker read the complete bundle.
            </p>
          </header>

          <div className="reaction-studio__layout">
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
              <div className="workbench-support">
                <DraftTray problem={problem} state={state} store={mechanismStore} />
                <ReasoningPanel problem={problem} state={state} store={mechanismStore} />
              </div>
            </div>
          </div>
        </section>

        <section className="agent-studio" id="agent-studio" aria-labelledby="agent-studio-heading">
          <header className="agent-studio__intro">
            <div>
              <p className="section-kicker">Agent lab</p>
              <h2 id="agent-studio-heading">Open only the part you need.</h2>
            </div>
            <p>
              Set the boundary, test isolated paths, then inspect proof. Each stage stays
              closed until you choose it.
            </p>
          </header>

          {activeSessionMode === "demo" && <DemoNotice />}

          <div className="agent-studio__stages">
            <details className="agent-stage">
              <summary>
                <span className="agent-stage__number">01</span>
                <span className="agent-stage__title">
                  <strong>Set the boundary</strong>
                  <small>Choose what the agent may inspect or change.</small>
                </span>
                <span className="agent-stage__state">
                  {COLLABORATION_MODE_LABELS[collaborationContract.mode]}
                </span>
                <span className="agent-stage__toggle" aria-hidden="true" />
              </summary>
              <div className="agent-stage__content">
                <CollaborationContract
                  store={mechanismStore}
                  sessionMode={activeSessionMode}
                  delegationSession={delegationSession}
                  hypothesisLab={hypothesisLab}
                />
              </div>
            </details>

            <details className="agent-stage" id="idea-sandbox">
              <summary>
                <span className="agent-stage__number">02</span>
                <span className="agent-stage__title">
                  <strong>Test competing paths</strong>
                  <small>Let the agent work off-draft in two or three branches.</small>
                </span>
                <span className="agent-stage__state">
                  {hypothesisLab ? `${hypothesisLab.branches.length} paths open` : "Lab closed"}
                </span>
                <span className="agent-stage__toggle" aria-hidden="true" />
              </summary>
              <div className="agent-stage__content">
                <HypothesisLab
                  store={mechanismStore}
                  manager={hypothesisLabManager}
                  lab={hypothesisLab}
                  delegationSession={delegationSession}
                />
              </div>
            </details>

            <details className="agent-stage">
              <summary>
                <span className="agent-stage__number">03</span>
                <span className="agent-stage__title">
                  <strong>Give it one job</strong>
                  <small>Freeze the purpose, scope, and action budget.</small>
                </span>
                <span className="agent-stage__state">
                  {delegationSession ? delegationSession.status : "No active job"}
                </span>
                <span className="agent-stage__toggle" aria-hidden="true" />
              </summary>
              <div className="agent-stage__content">
                <DelegationSession
                  store={mechanismStore}
                  manager={delegationSessionManager}
                  hypothesisLab={hypothesisLab}
                />
              </div>
            </details>

            <details className="agent-stage agent-stage--proof">
              <summary>
                <span className="agent-stage__number">04</span>
                <span className="agent-stage__title">
                  <strong>Inspect the proof</strong>
                  <small>See the discovered surface, run report, and receipts.</small>
                </span>
                <span className="agent-stage__state">
                  {toolStatus === "ready" ? `${activeToolCount} live tools` : "Manual preview"}
                </span>
                <span className="agent-stage__toggle" aria-hidden="true" />
              </summary>
              <div className="agent-stage__content agent-stage__content--proof">
                <WebMcpObservatory
                  contract={collaborationContract}
                  delegationSession={delegationSession}
                  hypothesisLab={hypothesisLab}
                  hostStatus={toolStatus}
                  recorder={capabilitySurfaceRecorder}
                  receiptLedger={toolReceiptLedger}
                />
                <AgentProofLedger
                  ledger={toolReceiptLedger}
                  store={mechanismStore}
                  sessionMode={activeSessionMode}
                />
              </div>
            </details>
          </div>
        </section>

        <details className="learning-drawer">
          <summary>
            <span>
              <small>After the mechanism</small>
              <strong>Review the run and choose what to practice next.</strong>
            </span>
            <span className="learning-drawer__toggle" aria-hidden="true" />
          </summary>
          <div className="learning-drawer__content">
            <PracticeCompass state={state} store={mechanismStore} sessionMode={activeSessionMode} />
            <ReactionDiff problem={problem} state={state} />
            <LearningRecord
              problem={problem}
              state={state}
              store={mechanismStore}
              sessionMode={activeSessionMode}
            />
          </div>
        </details>
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
