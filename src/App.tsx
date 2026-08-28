import { useEffect, useState } from "react";
import { DraftTray } from "./components/DraftTray";
import { MechanismCanvas } from "./components/MechanismCanvas";
import { ProblemBrief } from "./components/ProblemBrief";
import { ReasoningPanel } from "./components/ReasoningPanel";
import { mechanismStore } from "./store/mechanism-store";
import { useMechanismState } from "./store/use-mechanism";
import { MECHANISM_TOOL_COUNT } from "./webmcp/register-tools";

type ToolStatus = "ready" | "manual" | "error";

export function App() {
  const state = useMechanismState();
  const problem = mechanismStore.getProblem();
  const problems = mechanismStore.getProblems();
  const [toolStatus, setToolStatus] = useState<ToolStatus>(
    typeof document !== "undefined" && document.modelContext ? "ready" : "manual",
  );

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
      `Reset ${problem.title}? Its draft, activity trail, hints, and committed step will be replaced with a fresh reactant state.`,
    );
    if (confirmed) mechanismStore.resetProblem("human");
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#mechanism-workspace">
        Skip to mechanism workspace
      </a>
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">
            <span>e</span>
            <sup>−</sup>
          </span>
          <div>
            <strong>Mechanism Canvas</strong>
            <span>Electron movement, made inspectable</span>
          </div>
        </div>
        <div className="topbar-meta">
          <span className="prototype-label">Hackathon prototype · local data</span>
          <span className={`tool-status tool-status--${toolStatus}`}>
            <span aria-hidden="true" />
            {toolStatus === "ready"
              ? `${MECHANISM_TOOL_COUNT} site tools ready`
              : toolStatus === "error"
                ? "Site tool registration failed"
                : "Manual mode · WebMCP host not detected"}
          </span>
        </div>
      </header>

      <main className="workspace" id="mechanism-workspace">
        <ProblemBrief
          problem={problem}
          problems={problems}
          state={state}
          onProblemChange={(problemId) => mechanismStore.switchProblem(problemId, "human")}
          onReset={reset}
        />
        <div className="workbench-column">
          <MechanismCanvas problem={problem} state={state} store={mechanismStore} />
          <DraftTray problem={problem} state={state} store={mechanismStore} />
        </div>
        <ReasoningPanel problem={problem} state={state} store={mechanismStore} />
      </main>

      <footer className="app-footer">
        <span>Release candidate</span>
        <p>Two structurally checked prototype fixtures. Independent chemistry review is pending.</p>
        <a href="https://learn.chatgpt.com/docs/webmcp" target="_blank" rel="noreferrer">
          WebMCP boundary
        </a>
      </footer>
    </div>
  );
}
