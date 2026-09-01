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

interface PreviewPoint {
  x: number;
  y: number;
}

function formatCoordinate(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export function buildPreviewArrowHead(
  base: PreviewPoint,
  tip: PreviewPoint,
  halfWidth: number,
): string {
  const dx = tip.x - base.x;
  const dy = tip.y - base.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return `${tip.x},${tip.y} ${base.x},${base.y} ${base.x},${base.y}`;

  const perpendicularX = (-dy / length) * halfWidth;
  const perpendicularY = (dx / length) * halfWidth;
  const firstBase = { x: base.x + perpendicularX, y: base.y + perpendicularY };
  const secondBase = { x: base.x - perpendicularX, y: base.y - perpendicularY };

  return [tip, firstBase, secondBase]
    .map((point) => `${formatCoordinate(point.x)},${formatCoordinate(point.y)}`)
    .join(" ");
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
  const formationHead = buildPreviewArrowHead({ x: 115, y: 27 }, { x: 120, y: 35 }, 6.5);
  const cleavageHead = buildPreviewArrowHead({ x: 210, y: 66 }, { x: 219, y: 60 }, 6.5);

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
          <path className="agent-sandbox-preview__flow" d="M 51 31 C 77 9 104 10 115 27" />
          <polygon
            className="agent-sandbox-preview__flow-head"
            data-preview-arrow="bond-formation"
            points={formationHead}
          />
        </>
      )}
      {arrowCount > 1 && (
        <>
          <path className="agent-sandbox-preview__flow agent-sandbox-preview__flow--second" d="M 174 50 C 182 71 198 75 210 66" />
          <polygon
            className="agent-sandbox-preview__flow-head agent-sandbox-preview__flow-head--second"
            data-preview-arrow="bond-cleavage"
            points={cleavageHead}
          />
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
      <svg
        aria-hidden="true"
        className="agent-sandbox-preview__field-line"
        preserveAspectRatio="none"
        viewBox="0 0 1200 460"
      >
        <path d="M -40 390 C 245 455 340 24 615 128 S 950 516 1240 214" />
        <circle cx="296" cy="118" r="5" />
        <circle cx="312" cy="111" r="5" />
      </svg>
      <div className="agent-sandbox-preview__copy">
        <p className="agent-sandbox-preview__eyebrow">A safe place for wrong turns</p>
        <h1 id="agent-sandbox-preview-heading">Let the agent try the wrong turns.</h1>
        <p className="agent-sandbox-preview__lede">
          Two isolated paths go in. The page checks both; only you can bring one back.
        </p>
        <div className="agent-sandbox-preview__actions">
          <a className="button button--primary button--organic button--organic-hero" href="#agent-studio">Open the agent lab</a>
          <a className="agent-sandbox-preview__canvas-link" href="#canvas-title">Start drawing</a>
        </div>
        <ol className="agent-sandbox-preview__trust-flow" aria-label="Human-agent collaboration flow">
          <li><span aria-hidden="true">1</span><strong>Draft sealed</strong></li>
          <li><span aria-hidden="true">2</span><strong>Chemistry checked</strong></li>
          <li><span aria-hidden="true">3</span><strong>You choose</strong></li>
        </ol>
      </div>

      <div className={`agent-sandbox-preview__result${live ? " is-live" : ""}`}>
        <div className="agent-sandbox-preview__result-heading">
          <div>
            <span>{live ? "Live lab output" : "Two-path test · SN2 example"}</span>
            <strong>{problemTitle}</strong>
          </div>
          <span>{live ? `Lab revision ${lab?.labRevision}` : "Example"}</span>
        </div>

        <div className="agent-sandbox-preview__draft-seal">
          <span aria-hidden="true" className="agent-sandbox-preview__seal-mark" />
          <div>
            <strong>Your draft stays sealed</strong>
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
          <span aria-hidden="true" className="agent-sandbox-preview__handoff-dot" />
          <div>
            <span>Your decision</span>
            <strong>{lab?.recommendedBranchId ? "A checked path is waiting for you" : "Only you can move a checked path onto the canvas"}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
