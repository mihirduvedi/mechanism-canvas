import { lazy, Suspense, useMemo, useState } from "react";
import { describeEntity } from "../domain/chemistry";
import type {
  ArrowDraft,
  ElectronSource,
  MechanismState,
  MoleculeState,
  Point,
  ProblemDefinition,
} from "../domain/types";
import type { MechanismStore } from "../store/mechanism-store";

const MolecularModel = lazy(() =>
  import("./MolecularModel").then((module) => ({ default: module.MolecularModel })),
);

interface MechanismCanvasProps {
  problem: ProblemDefinition;
  state: MechanismState;
  store: MechanismStore;
}

function pairPosition(state: MoleculeState, siteId: string): Point | null {
  const site = state.lonePairSites.find((candidate) => candidate.id === siteId);
  const atom = state.atoms.find((candidate) => candidate.id === site?.atomId);
  if (!site || !atom) return null;
  const radians = (site.angle * Math.PI) / 180;
  return {
    x: atom.position.x + Math.cos(radians) * 38,
    y: atom.position.y + Math.sin(radians) * 38,
  };
}

function bondPosition(state: MoleculeState, bondId: string): Point | null {
  const bond = state.bonds.find((candidate) => candidate.id === bondId);
  if (!bond) return null;
  const first = state.atoms.find((atom) => atom.id === bond.atomIds[0]);
  const second = state.atoms.find((atom) => atom.id === bond.atomIds[1]);
  if (!first || !second) return null;
  return {
    x: (first.position.x + second.position.x) / 2,
    y: (first.position.y + second.position.y) / 2,
  };
}

function sourcePosition(state: MoleculeState, source: ElectronSource): Point | null {
  return source.kind === "lone_pair"
    ? pairPosition(state, source.entityId)
    : bondPosition(state, source.entityId);
}

function arrowPath(source: Point, target: Point, index: number): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(Math.hypot(dx, dy), 1);
  const ux = dx / length;
  const uy = dy / length;
  const start = { x: source.x + ux * 9, y: source.y + uy * 9 };
  const end = { x: target.x - ux * 35, y: target.y - uy * 35 };
  const drawableDx = end.x - start.x;
  const drawableDy = end.y - start.y;
  const drawableLength = Math.max(Math.hypot(drawableDx, drawableDy), 1);
  const curve =
    (index % 2 === 0 ? -1 : 1) * Math.min(66, Math.max(14, drawableLength * 0.22));
  const nx = -uy;
  const ny = ux;
  const firstControl = {
    x: start.x + drawableDx * 0.33 + nx * curve,
    y: start.y + drawableDy * 0.33 + ny * curve,
  };
  const secondControl = {
    x: start.x + drawableDx * 0.68 + nx * curve,
    y: start.y + drawableDy * 0.68 + ny * curve,
  };
  return `M ${start.x} ${start.y} C ${firstControl.x} ${firstControl.y}, ${secondControl.x} ${secondControl.y}, ${end.x} ${end.y}`;
}

function handleKeyboardActivate(event: React.KeyboardEvent<SVGGElement>, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

function chargeLabel(charge: number): string {
  if (charge === 0) return "";
  if (charge === 1) return "+";
  if (charge === -1) return "−";
  return charge > 0 ? `${charge}+` : `${Math.abs(charge)}−`;
}

export function MechanismCanvas({ problem, state, store }: MechanismCanvasProps) {
  const [showPhysicalModel, setShowPhysicalModel] = useState(false);
  const molecule = problem.states[state.currentStateId];
  const complete = state.currentStateId === problem.completedStateId;
  const selectedSource = state.selection.source;
  const accepted = state.latestValidation?.classification === "valid";
  const showPreview = state.highestScaffoldLevel >= 4 && !complete;
  const focused = useMemo(() => new Set(state.focusEntityIds), [state.focusEntityIds]);

  const selectSource = (source: ElectronSource) => {
    if (complete) return;
    store.selectSource(source);
  };

  const selectTarget = (atomId: string) => {
    if (complete) {
      store.focusEntities([atomId], "human");
      return;
    }
    if (!selectedSource) {
      store.focusEntities([atomId], "human");
      return;
    }
    store.addDraftArrow({
      source: selectedSource,
      target: { kind: "atom", entityId: atomId },
      actor: "human",
    });
  };

  const renderArrow = (
    arrow: Pick<ArrowDraft, "source" | "target">,
    index: number,
    variant: "draft" | "accepted" | "preview",
  ) => {
    const start = sourcePosition(molecule, arrow.source);
    const target = molecule.atoms.find((atom) => atom.id === arrow.target.entityId)?.position;
    if (!start || !target) return null;
    return (
      <path
        className={`mechanism-arrow mechanism-arrow--${variant}`}
        d={arrowPath(start, target, index)}
        markerEnd={`url(#arrowhead-${variant})`}
        key={`${variant}-${arrow.source.entityId}-${arrow.target.entityId}`}
      />
    );
  };

  return (
    <section
      className={`canvas-panel ${accepted ? "canvas-panel--valid" : ""}`}
      aria-labelledby="canvas-title"
    >
      <div className="canvas-heading">
        <div>
          <p className="section-kicker">Mechanism workspace</p>
          <h2 id="canvas-title">{complete ? "Committed product state" : "Draft the elementary step"}</h2>
        </div>
        <div className="canvas-heading__actions">
          <button
            type="button"
            className="model-toggle"
            aria-expanded={showPhysicalModel}
            onClick={() => setShowPhysicalModel((current) => !current)}
          >
            {showPhysicalModel ? "Close 3D model" : "Open 3D model"}
          </button>
          <div className={`state-seal ${complete ? "state-seal--complete" : ""}`}>
            <span className="state-seal__dot" aria-hidden="true" />
            {complete ? "Step committed" : `${state.draftArrows.length} draft arrow${state.draftArrows.length === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>

      <div className="canvas-instruction" aria-live="polite">
        <span className="instruction-index" aria-hidden="true">
          {complete ? "✓" : selectedSource ? "02" : "01"}
        </span>
        <p>
          {complete
            ? "The accepted step is committed. Undo it to examine or try the reactants again."
            : selectedSource
              ? `Electron source selected: ${describeEntity(molecule, selectedSource.entityId)}. Choose the atom that receives this pair.`
              : "Choose a lone pair or bond as the electron source. Then choose its target atom."}
        </p>
        {selectedSource && (
          <button type="button" className="text-button" onClick={store.cancelSelection}>
            Cancel source
          </button>
        )}
      </div>

      <div className="svg-frame">
        <svg
          className="mechanism-svg"
          viewBox="0 0 760 380"
          role="group"
          aria-labelledby="molecule-title molecule-description"
        >
          <title id="molecule-title">{molecule.label}</title>
          <desc id="molecule-description">
            {complete
              ? "Committed product structure. Select an atom to inspect it."
              : "Interactive reactant structure. Lone pairs and bonds select an electron source. Atoms select the destination."}
          </desc>
          <defs>
            <marker id="arrowhead-draft" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
            <marker id="arrowhead-accepted" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
            <marker id="arrowhead-preview" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>

          <g className="bench-grid" aria-hidden="true">
            <line x1="28" y1="318" x2="732" y2="318" />
            {[80, 180, 280, 380, 480, 580, 680].map((x) => (
              <line x1={x} y1="312" x2={x} y2="324" key={x} />
            ))}
          </g>

          {!complete && (
            <text x="332" y="200" className="plus-sign" aria-hidden="true">
              +
            </text>
          )}
          {complete && (
            <text x="545" y="200" className="plus-sign" aria-hidden="true">
              +
            </text>
          )}

          {molecule.bonds.map((bond) => {
            const first = molecule.atoms.find((atom) => atom.id === bond.atomIds[0]);
            const second = molecule.atoms.find((atom) => atom.id === bond.atomIds[1]);
            if (!first || !second) return null;
            const bondDx = second.position.x - first.position.x;
            const bondDy = second.position.y - first.position.y;
            const bondLength = Math.hypot(bondDx, bondDy);
            const bondAngle = (Math.atan2(bondDy, bondDx) * 180) / Math.PI;
            const selected = selectedSource?.kind === "bond" && selectedSource.entityId === bond.id;
            const className = [
              "bond-control",
              selected ? "is-selected" : "",
              focused.has(bond.id) ? "is-focused" : "",
              complete ? "is-disabled" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <g
                className={className}
                key={bond.id}
                role={complete ? "img" : "button"}
                tabIndex={complete ? -1 : 0}
                aria-label={
                  complete
                    ? describeEntity(molecule, bond.id)
                    : `${describeEntity(molecule, bond.id)}. Select as electron source.`
                }
                aria-pressed={complete ? undefined : selected}
                onClick={complete ? undefined : () => selectSource({ kind: "bond", entityId: bond.id })}
                onKeyDown={
                  complete
                    ? undefined
                    : (event) =>
                        handleKeyboardActivate(event, () =>
                          selectSource({ kind: "bond", entityId: bond.id }),
                        )
                }
              >
                <rect
                  className="bond-hitbox"
                  x={first.position.x}
                  y={first.position.y - 14}
                  width={bondLength}
                  height="28"
                  transform={`rotate(${bondAngle} ${first.position.x} ${first.position.y})`}
                />
                <line className="bond-line" x1={first.position.x} y1={first.position.y} x2={second.position.x} y2={second.position.y} />
              </g>
            );
          })}

          {molecule.atoms.map((atom) => {
            return (
              <g
                className={`atom-control ${focused.has(atom.id) ? "is-focused" : ""} ${selectedSource ? "is-targetable" : ""}`}
                key={atom.id}
                role="button"
                tabIndex={0}
                aria-label={`${atom.element} ${atom.label}, formal charge ${atom.formalCharge}, ${atom.lonePairCount} lone pairs${selectedSource ? ". Select as electron target." : ". Inspect atom."}`}
                onClick={() => selectTarget(atom.id)}
                onKeyDown={(event) => handleKeyboardActivate(event, () => selectTarget(atom.id))}
              >
                <circle className="atom-target" cx={atom.position.x} cy={atom.position.y} r="33" />
                {atom.implicitHydrogenCount > 0 && (
                  <text
                    className="implicit-hydrogen"
                    x={atom.position.x}
                    y={atom.position.y + 34}
                    textAnchor="middle"
                    aria-hidden="true"
                  >
                    {atom.implicitHydrogenCount} H
                  </text>
                )}
                <text className="atom-symbol" x={atom.position.x} y={atom.position.y + 9} textAnchor="middle" aria-hidden="true">
                  {atom.element}
                </text>
                {atom.formalCharge !== 0 && (
                  <text className="formal-charge" x={atom.position.x + 24} y={atom.position.y - 24} aria-hidden="true">
                    {chargeLabel(atom.formalCharge)}
                  </text>
                )}
              </g>
            );
          })}

          {molecule.lonePairSites.map((site) => {
            const position = pairPosition(molecule, site.id);
            if (!position) return null;
            const radians = (site.angle * Math.PI) / 180;
            const tangent = { x: -Math.sin(radians) * 4, y: Math.cos(radians) * 4 };
            const selected = selectedSource?.kind === "lone_pair" && selectedSource.entityId === site.id;
            return (
              <g
                className={`pair-control ${selected ? "is-selected" : ""} ${focused.has(site.id) ? "is-focused" : ""} ${complete ? "is-disabled" : ""}`}
                key={site.id}
                role={complete ? "img" : "button"}
                tabIndex={complete ? -1 : 0}
                aria-label={
                  complete
                    ? describeEntity(molecule, site.id)
                    : `${describeEntity(molecule, site.id)}. Select as electron source.`
                }
                aria-pressed={complete ? undefined : selected}
                onClick={
                  complete
                    ? undefined
                    : () => selectSource({ kind: "lone_pair", entityId: site.id })
                }
                onKeyDown={
                  complete
                    ? undefined
                    : (event) =>
                        handleKeyboardActivate(event, () =>
                          selectSource({ kind: "lone_pair", entityId: site.id }),
                        )
                }
              >
                <circle className="pair-hitbox" cx={position.x} cy={position.y} r="18" />
                <circle className="electron-dot" cx={position.x - tangent.x} cy={position.y - tangent.y} r="3.4" />
                <circle className="electron-dot" cx={position.x + tangent.x} cy={position.y + tangent.y} r="3.4" />
              </g>
            );
          })}

          {showPreview &&
            problem.acceptedBundles[0].map((arrow, index) =>
              renderArrow({ ...arrow }, index, "preview"),
            )}
          {state.draftArrows.map((arrow, index) =>
            renderArrow(arrow, index, accepted ? "accepted" : "draft"),
          )}
        </svg>
      </div>

      <details className="structure-mirror">
        <summary>Read the structure as text</summary>
        <div className="structure-mirror__content">
          <p>{molecule.label}.</p>
          <ul>
            {molecule.atoms.map((atom) => (
              <li key={atom.id}>
                <strong>{atom.label}</strong>: {atom.element}, charge {atom.formalCharge}, {atom.lonePairCount} lone pair{atom.lonePairCount === 1 ? "" : "s"}, {atom.implicitHydrogenCount} implicit hydrogen{atom.implicitHydrogenCount === 1 ? "" : "s"}.
              </li>
            ))}
            {molecule.bonds.map((bond) => (
              <li key={bond.id}>
                <strong>{bond.id}</strong>: {describeEntity(molecule, bond.id)}, order {bond.order}.
              </li>
            ))}
          </ul>
        </div>
      </details>
      {showPhysicalModel && (
        <Suspense
          fallback={
            <div className="model-loading" role="status">
              Preparing the three-dimensional molecular model…
            </div>
          }
        >
          <MolecularModel molecule={molecule} />
        </Suspense>
      )}
    </section>
  );
}
