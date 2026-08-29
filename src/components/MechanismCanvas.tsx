import { lazy, Suspense, useMemo, useState } from "react";
import { describeEntity } from "../domain/chemistry";
import { problemStepForState, visibleStateId } from "../domain/problem-steps";
import type {
  ArrowDraft,
  ElectronSource,
  MechanismState,
  MoleculeState,
  Point,
  ProblemDefinition,
} from "../domain/types";
import type { MechanismStore } from "../store/mechanism-store";
import { buildMechanismArrowGeometry } from "./mechanism-arrow-geometry";
import { MechanismTimeline } from "./MechanismTimeline";
import {
  buildMechanismArrowRoutes,
  preferredMechanismArrowTargetAngle,
  type MechanismArrowRoute,
} from "./mechanism-arrow-routing";

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

function targetObstacleAngles(state: MoleculeState, atomId: string): number[] {
  const atom = state.atoms.find((candidate) => candidate.id === atomId);
  if (!atom) return [];

  const angles = state.lonePairSites
    .filter((site) => site.atomId === atomId)
    .map((site) => (site.angle * Math.PI) / 180);

  for (const bond of state.bonds) {
    if (!bond.atomIds.includes(atomId)) continue;
    const otherAtomId = bond.atomIds.find((candidate) => candidate !== atomId);
    const otherAtom = state.atoms.find((candidate) => candidate.id === otherAtomId);
    if (otherAtom) {
      angles.push(
        Math.atan2(
          otherAtom.position.y - atom.position.y,
          otherAtom.position.x - atom.position.x,
        ),
      );
    }
  }

  if (atom.formalCharge !== 0) angles.push(-Math.PI / 4);
  if (atom.implicitHydrogenCount > 0) angles.push(Math.PI / 2);
  return angles;
}

function bundleRoutes(
  molecule: MoleculeState,
  arrows: Array<Pick<ArrowDraft, "source" | "target">>,
): Map<number, MechanismArrowRoute> {
  return buildMechanismArrowRoutes(
    arrows.flatMap((arrow, index) => {
      const source = sourcePosition(molecule, arrow.source);
      const target = molecule.atoms.find((atom) => atom.id === arrow.target.entityId)?.position;
      return source && target
        ? [
            {
              index,
              targetId: arrow.target.entityId,
              source,
              target,
              preferredTargetAngle: preferredMechanismArrowTargetAngle(
                source,
                target,
                index,
                arrow.source.kind,
              ),
              targetObstacleAngles: targetObstacleAngles(
                molecule,
                arrow.target.entityId,
              ),
            },
          ]
        : [];
    }),
  );
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
  const molecule = problem.states[visibleStateId(state)];
  const complete = state.currentStateId === problem.completedStateId;
  const historyView = state.historyViewStateId !== null;
  const activeStep = problemStepForState(problem, state.currentStateId);
  const selectedSource = state.selection.source;
  const accepted = state.latestValidation?.classification === "valid";
  const showPreview =
    state.visibleScaffoldLevel === 4 &&
    state.draftArrows.length === 0 &&
    !complete &&
    !historyView;
  const focused = useMemo(() => new Set(state.focusEntityIds), [state.focusEntityIds]);
  const previewArrows = showPreview ? activeStep?.acceptedBundles[0] ?? [] : [];
  const previewRoutes = bundleRoutes(molecule, previewArrows);
  const draftRoutes = bundleRoutes(molecule, state.draftArrows);

  const selectSource = (source: ElectronSource) => {
    if (complete || historyView) return;
    store.selectSource(source);
  };

  const selectTarget = (atomId: string) => {
    if (complete || historyView) {
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
    route?: MechanismArrowRoute,
  ) => {
    const start = sourcePosition(molecule, arrow.source);
    const target = molecule.atoms.find((atom) => atom.id === arrow.target.entityId)?.position;
    if (!start || !target) return null;
    const geometry = buildMechanismArrowGeometry(
      start,
      target,
      index,
      arrow.source.kind,
      route,
    );
    return (
      <g
        className={`mechanism-arrow-group mechanism-arrow-group--${variant}`}
        key={`${variant}-${index}-${arrow.source.entityId}-${arrow.target.entityId}`}
        aria-hidden="true"
      >
        <path className="mechanism-arrow" d={geometry.shaftPath} />
        <polygon className="mechanism-arrow-head" points={geometry.headPoints} />
      </g>
    );
  };

  return (
    <section
      className={`canvas-panel ${accepted ? "canvas-panel--valid" : ""} ${historyView ? "canvas-panel--history" : ""}`}
      aria-labelledby="canvas-title"
    >
      <div className="canvas-heading">
        <div>
          <p className="section-kicker">Mechanism workspace</p>
          <h2 id="canvas-title">
            {historyView
              ? "Reviewing committed history"
              : complete
                ? "Committed product state"
                : activeStep?.title ?? "Draft the elementary step"}
          </h2>
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
            {historyView
              ? "History view"
              : complete
                ? `${problem.stepCount} steps committed`
                : `${state.draftArrows.length} draft arrow${state.draftArrows.length === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>

      <div className="canvas-instruction" aria-live="polite">
        <span className="instruction-index" aria-hidden="true">
          {historyView ? "↶" : complete ? "✓" : selectedSource ? "02" : "01"}
        </span>
        <p>
          {historyView
            ? `${molecule.label}. This is a read-only committed state; the current mechanism state remains unchanged.`
            : complete
            ? "The accepted step is committed. Undo it to examine or try the reactants again."
            : selectedSource
              ? `Electron source selected: ${describeEntity(molecule, selectedSource.entityId)}. Choose the atom that receives this pair.`
              : "Choose a lone pair or bond as the electron source. Then choose its target atom."}
        </p>
        {historyView ? (
          <button type="button" className="text-button" onClick={() => store.viewHistoryState(null, "human")}>
            Return to current state
          </button>
        ) : selectedSource && (
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
            {historyView
              ? "Read-only committed history structure. Select an atom to inspect it."
              : complete
                ? "Committed product structure. Select an atom to inspect it."
                : "Interactive reactant structure. Lone pairs and bonds select an electron source. Atoms select the destination."}
          </desc>
          {(molecule.separators ?? []).map((separator, index) => (
            <text
              x={separator.x}
              y={separator.y}
              className="plus-sign"
              aria-hidden="true"
              key={`${separator.x}-${separator.y}-${index}`}
            >
              +
            </text>
          ))}

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
              complete || historyView ? "is-disabled" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <g
                className={className}
                key={bond.id}
                role={complete || historyView ? "img" : "button"}
                tabIndex={complete || historyView ? -1 : 0}
                aria-label={
                  complete || historyView
                    ? describeEntity(molecule, bond.id)
                    : `${describeEntity(molecule, bond.id)}. Select as electron source.`
                }
                aria-pressed={complete || historyView ? undefined : selected}
                onClick={complete || historyView ? undefined : () => selectSource({ kind: "bond", entityId: bond.id })}
                onKeyDown={
                  complete || historyView
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
                {focused.has(bond.id) && (
                  <line className="bond-focus-indicator" x1={first.position.x} y1={first.position.y} x2={second.position.x} y2={second.position.y} aria-hidden="true" />
                )}
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
                    y={atom.position.y + 51}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    aria-hidden="true"
                  >
                    {atom.implicitHydrogenCount}H
                  </text>
                )}
                <text
                  className="atom-symbol"
                  x={atom.position.x}
                  y={atom.position.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  aria-hidden="true"
                >
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
                className={`pair-control ${selected ? "is-selected" : ""} ${focused.has(site.id) ? "is-focused" : ""} ${complete || historyView ? "is-disabled" : ""}`}
                key={site.id}
                role={complete || historyView ? "img" : "button"}
                tabIndex={complete || historyView ? -1 : 0}
                aria-label={
                  complete || historyView
                    ? describeEntity(molecule, site.id)
                    : `${describeEntity(molecule, site.id)}. Select as electron source.`
                }
                aria-pressed={complete || historyView ? undefined : selected}
                onClick={
                  complete || historyView
                    ? undefined
                    : () => selectSource({ kind: "lone_pair", entityId: site.id })
                }
                onKeyDown={
                  complete || historyView
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
            previewArrows.map((arrow, index) =>
              renderArrow({ ...arrow }, index, "preview", previewRoutes.get(index)),
            )}
          {!historyView && state.draftArrows.map((arrow, index) =>
            renderArrow(
              arrow,
              index,
              accepted ? "accepted" : "draft",
              draftRoutes.get(index),
            ),
          )}
        </svg>
      </div>

      <MechanismTimeline problem={problem} state={state} store={store} />

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
