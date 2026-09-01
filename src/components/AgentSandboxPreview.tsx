import type { DelegationSession } from "../webmcp/delegation-session";
import type { HypothesisBranch, HypothesisLab } from "../webmcp/hypothesis-lab";

interface AgentSandboxPreviewProps {
  problemTitle: string;
  draftArrowCount: number;
  lab: HypothesisLab | null;
  delegationSession: DelegationSession | null;
}

type PreviewTone = "waiting" | "incomplete" | "approved" | "recommended";

interface PreviewBranch {
  label: string;
  detail: string;
  status: string;
  tone: PreviewTone;
  arrowCount: number;
}

function branchTone(branch: HypothesisBranch, lab: HypothesisLab): PreviewTone {
  if (lab.recommendedBranchId === branch.id) return "recommended";
  if (branch.validation?.classification === "valid") return "approved";
  if (branch.validation) return "incomplete";
  return "waiting";
}

function branchPreview(branch: HypothesisBranch, lab: HypothesisLab): PreviewBranch {
  const tone = branchTone(branch, lab);
  const status = tone === "recommended"
    ? "Recommended for your review"
    : tone === "approved"
      ? "Validator approved"
      : tone === "incomplete"
        ? "Useful wrong turn"
        : branch.arrows.length
          ? "Ready to check"
          : "Waiting for an idea";
  const detail = branch.validation?.summary
    ?? (branch.arrows.length
      ? `${branch.arrows.length} proposed electron-flow arrow${branch.arrows.length === 1 ? "" : "s"}`
      : "The agent can build here without touching your draft.");

  return {
    label: branch.label,
    detail,
    status,
    tone,
    arrowCount: branch.arrows.length,
  };
}

const exampleBranches: PreviewBranch[] = [
  {
    label: "Path A",
    detail: "Bond formation alone misses the coupled leaving-group move.",
    status: "Incomplete · evidence kept",
    tone: "incomplete",
    arrowCount: 1,
  },
  {
    label: "Path B",
    detail: "Bond formation and bond cleavage travel as one elementary step.",
    status: "Approved · ready for your review",
    tone: "approved",
    arrowCount: 2,
  },
];

function ElectronFlowSketch({ arrowCount }: { arrowCount: number }) {
  return (
    <svg aria-hidden="true" className="agent-sandbox-preview__sketch" viewBox="0 0 250 92">
      <circle cx="24" cy="48" r="16" />
      <circle cx="132" cy="48" r="18" />
      <circle cx="224" cy="48" r="16" />
      <path className="agent-sandbox-preview__bond" d="M 150 48 L 208 48" />
      <circle className="agent-sandbox-preview__electron" cx="45" cy="37" r="3" />
      <circle className="agent-sandbox-preview__electron" cx="51" cy="32" r="3" />
      {arrowCount > 0 && (
        <>
          <path className="agent-sandbox-preview__flow" d="M 51 31 C 80 7 111 11 124 30" />
          <path className="agent-sandbox-preview__flow-head" d="M 115 25 L 124 30 L 119 20" />
        </>
      )}
      {arrowCount > 1 && (
        <>
          <path className="agent-sandbox-preview__flow agent-sandbox-preview__flow--second" d="M 174 50 C 184 76 207 76 218 63" />
          <path className="agent-sandbox-preview__flow-head agent-sandbox-preview__flow-head--second" d="M 207 65 L 218 63 L 214 73" />
        </>
      )}
      <text x="24" y="53">O</text>
      <text x="132" y="53">C</text>
      <text x="224" y="53">Br</text>
    </svg>
  );
}

export function AgentSandboxPreview({
  problemTitle,
  draftArrowCount,
  lab,
  delegationSession,
}: AgentSandboxPreviewProps) {
  const branches = lab
    ? lab.branches.slice(0, 2).map((branch) => branchPreview(branch, lab))
    : exampleBranches;
  const live = Boolean(lab);
  const activeActions = delegationSession
    ? `${delegationSession.usedActions} of ${delegationSession.maxActions} actions used`
    : "No agent job is running";

  return (
    <section className="agent-sandbox-preview" aria-labelledby="agent-sandbox-preview-heading">
      <div className="agent-sandbox-preview__copy">
        <p className="agent-sandbox-preview__eyebrow">A gentler way to test a mechanism</p>
        <h1 id="agent-sandbox-preview-heading">Try two ideas. Keep your draft yours.</h1>
        <p className="agent-sandbox-preview__lede">
          Give an agent a soft place to explore wrong turns. The page checks the chemistry,
          preserves the evidence, and leaves the winning move behind your review gate.
        </p>
        <div className="agent-sandbox-preview__actions">
          <a className="button button--primary" href="#hypothesis-lab-heading">Open the idea sandbox</a>
          <a className="agent-sandbox-preview__canvas-link" href="#canvas-title">Work on the mechanism</a>
        </div>
        <ol className="agent-sandbox-preview__trust-flow" aria-label="Human-agent collaboration flow">
          <li><span aria-hidden="true">1</span><strong>Agent explores</strong></li>
          <li><span aria-hidden="true">2</span><strong>Page checks</strong></li>
          <li><span aria-hidden="true">3</span><strong>You decide</strong></li>
        </ol>
      </div>

      <div className={`agent-sandbox-preview__result${live ? " is-live" : ""}`}>
        <div className="agent-sandbox-preview__result-heading">
          <div>
            <span>{live ? "Live lab output" : "Example output · clean SN2 demo"}</span>
            <strong>{problemTitle}</strong>
          </div>
          <span>{live ? `Lab revision ${lab?.labRevision}` : "Preview"}</span>
        </div>

        <div className="agent-sandbox-preview__draft-seal">
          <span aria-hidden="true" className="agent-sandbox-preview__seal-mark" />
          <div>
            <strong>Main draft sealed</strong>
            <small>{draftArrowCount} learner arrow{draftArrowCount === 1 ? "" : "s"} protected · {activeActions}</small>
          </div>
        </div>

        <div className="agent-sandbox-preview__branches">
          {branches.map((branch) => (
            <article className={`agent-sandbox-preview__branch agent-sandbox-preview__branch--${branch.tone}`} key={branch.label}>
              <header>
                <strong>{branch.label}</strong>
                <span>{branch.status}</span>
              </header>
              <ElectronFlowSketch arrowCount={branch.arrowCount} />
              <p>{branch.detail}</p>
            </article>
          ))}
        </div>

        <div className="agent-sandbox-preview__handoff">
          <span aria-hidden="true" className="agent-sandbox-preview__handoff-arrow">
            <i />
          </span>
          <div>
            <span>Learner handoff</span>
            <strong>{lab?.recommendedBranchId ? "A checked path is waiting for you" : "Only you can move a checked path onto the canvas"}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
