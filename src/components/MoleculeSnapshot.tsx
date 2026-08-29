import { useId, useMemo, type CSSProperties } from "react";
import type { MoleculeComparison } from "../domain/mechanism-comparison";
import type { ArrowDraft, MoleculeState } from "../domain/types";
import { buildMechanismArrowGeometry } from "./mechanism-arrow-geometry";
import {
  comparisonReplayArrowRoutes,
  electronSourcePosition,
} from "./mechanism-arrow-layout";
import {
  snapshotLabelPlacement,
  snapshotImplicitHydrogenPlacement,
  snapshotPairPosition,
  type SnapshotViewBox,
  viewBoxValue,
} from "./molecule-snapshot-geometry";

interface MoleculeSnapshotProps {
  molecule: MoleculeState;
  labelStates: readonly MoleculeState[];
  comparison: MoleculeComparison;
  side: "before" | "after";
  viewBox: SnapshotViewBox;
  replayArrows?: ReadonlyArray<Pick<ArrowDraft, "source" | "target">>;
  replayKey?: number;
}

function chargeLabel(charge: number): string {
  if (charge === 0) return "";
  if (charge === 1) return "+";
  if (charge === -1) return "−";
  return charge > 0 ? `${charge}+` : `${Math.abs(charge)}−`;
}

export function MoleculeSnapshot({
  molecule,
  labelStates,
  comparison,
  side,
  viewBox,
  replayArrows = [],
  replayKey = 0,
}: MoleculeSnapshotProps) {
  const descriptionId = useId();
  const changedAtomIds = useMemo(
    () => new Set(comparison.atomChanges.map((change) => change.atomId)),
    [comparison.atomChanges],
  );
  const bondChanges = useMemo(
    () =>
      new Map(
        comparison.bondChanges.flatMap((change) => {
          const bondId = side === "before" ? change.beforeBondId : change.afterBondId;
          return bondId ? [[bondId, change.change] as const] : [];
        }),
      ),
    [comparison.bondChanges, side],
  );
  const mappedAtomIds = useMemo(
    () =>
      new Set([
        ...comparison.atomChanges.map((change) => change.atomId),
        ...comparison.bondChanges.flatMap((change) => change.atomIds),
      ]),
    [comparison.atomChanges, comparison.bondChanges],
  );
  const replayRoutes = useMemo(
    () => comparisonReplayArrowRoutes(molecule, replayArrows),
    [molecule, replayArrows],
  );

  return (
    <div className="molecule-snapshot">
      <svg
        className="molecule-snapshot__svg"
        viewBox={viewBoxValue(viewBox)}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={molecule.label}
        aria-describedby={descriptionId}
      >
        <desc id={descriptionId}>
          {side === "before" ? "Before" : "After"} structure. Highlighted atoms and bonds
          changed in this committed step. An exact text description follows the diagrams.
        </desc>
        {(molecule.separators ?? []).map((separator, index) => (
          <text
            x={separator.x}
            y={separator.y}
            className="plus-sign snapshot-plus-sign"
            textAnchor="middle"
            dominantBaseline="central"
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
          const change = bondChanges.get(bond.id);
          return (
            <g
              className={`snapshot-bond ${change ? `snapshot-bond--${change}` : ""}`}
              key={bond.id}
              aria-hidden="true"
            >
              <line
                className="snapshot-bond__halo"
                x1={first.position.x}
                y1={first.position.y}
                x2={second.position.x}
                y2={second.position.y}
              />
              <line
                className="bond-line snapshot-bond__line"
                x1={first.position.x}
                y1={first.position.y}
                x2={second.position.x}
                y2={second.position.y}
              />
            </g>
          );
        })}

        {molecule.atoms.map((atom) => {
          const label = snapshotLabelPlacement(labelStates, atom);
          const implicitHydrogen = snapshotImplicitHydrogenPlacement(labelStates, atom);
          return (
            <g
              className={`snapshot-atom ${changedAtomIds.has(atom.id) ? "snapshot-atom--changed" : ""}`}
              key={atom.id}
              aria-hidden="true"
            >
            <circle
              className="atom-target snapshot-atom__change-ring"
              cx={atom.position.x}
              cy={atom.position.y}
              r="33"
            />
            {atom.implicitHydrogenCount > 0 && (
              <text
                className="implicit-hydrogen snapshot-implicit-hydrogen"
                x={implicitHydrogen.x}
                y={implicitHydrogen.y}
                textAnchor={implicitHydrogen.textAnchor}
                dominantBaseline="middle"
              >
                <tspan className="snapshot-implicit-hydrogen__symbol">H</tspan>
                <tspan
                  className="snapshot-implicit-hydrogen__count"
                  baselineShift="sub"
                >
                  {atom.implicitHydrogenCount}
                </tspan>
              </text>
            )}
            <text
              className="atom-symbol snapshot-atom__symbol"
              x={atom.position.x}
              y={atom.position.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {atom.element}
            </text>
            {mappedAtomIds.has(atom.id) && (
              <text
                className="snapshot-atom__label"
                x={label.x}
                y={label.y}
                textAnchor={label.textAnchor}
                dominantBaseline="central"
              >
                {atom.label}
              </text>
            )}
            {atom.formalCharge !== 0 && (
              <text
                className="formal-charge snapshot-formal-charge"
                x={atom.position.x + 24}
                y={atom.position.y - 22}
              >
                {chargeLabel(atom.formalCharge)}
              </text>
            )}
            </g>
          );
        })}

        {molecule.lonePairSites.map((site) => {
          const position = snapshotPairPosition(molecule, site.id);
          if (!position) return null;
          const radians = (site.angle * Math.PI) / 180;
          const tangent = { x: -Math.sin(radians) * 4, y: Math.cos(radians) * 4 };
          return (
            <g className="snapshot-pair" key={site.id} aria-hidden="true">
              <circle
                className="electron-dot snapshot-electron-dot"
                cx={position.x - tangent.x}
                cy={position.y - tangent.y}
                r="3.4"
              />
              <circle
                className="electron-dot snapshot-electron-dot"
                cx={position.x + tangent.x}
                cy={position.y + tangent.y}
                r="3.4"
              />
            </g>
          );
        })}

        {replayArrows.length > 0 && (
          <g className="snapshot-replay" key={replayKey} aria-hidden="true">
            {replayArrows.map((arrow, index) => {
              const start = electronSourcePosition(molecule, arrow.source);
              const target = molecule.atoms.find(
                (atom) => atom.id === arrow.target.entityId,
              )?.position;
              if (!start || !target) return null;
              const geometry = buildMechanismArrowGeometry(
                start,
                target,
                index,
                arrow.source.kind,
                replayRoutes.get(index),
              );
              const replayStyle = { "--replay-index": index } as CSSProperties;
              return (
                <g
                  className="snapshot-replay-arrow"
                  key={`${arrow.source.kind}-${arrow.source.entityId}-${arrow.target.entityId}`}
                  style={replayStyle}
                >
                  <path
                    className="snapshot-replay-arrow__shaft"
                    d={geometry.shaftPath}
                    pathLength="1"
                  />
                  <polygon
                    className="snapshot-replay-arrow__head"
                    points={geometry.headPoints}
                  />
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
