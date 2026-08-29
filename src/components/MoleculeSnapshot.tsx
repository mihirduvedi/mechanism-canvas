import { useId, useMemo } from "react";
import type { MoleculeComparison } from "../domain/mechanism-comparison";
import type { MoleculeState, Point } from "../domain/types";

interface MoleculeSnapshotProps {
  molecule: MoleculeState;
  comparison: MoleculeComparison;
  side: "before" | "after";
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

function chargeLabel(charge: number): string {
  if (charge === 0) return "";
  if (charge === 1) return "+";
  if (charge === -1) return "−";
  return charge > 0 ? `${charge}+` : `${Math.abs(charge)}−`;
}

export function MoleculeSnapshot({ molecule, comparison, side }: MoleculeSnapshotProps) {
  const titleId = useId();
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

  return (
    <div className="molecule-snapshot">
      <svg
        className="molecule-snapshot__svg"
        viewBox="0 0 760 330"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>{molecule.label}</title>
        <desc id={descriptionId}>
          {side === "before" ? "Before" : "After"} structure. Highlighted atoms and bonds
          changed in this committed step. An exact text description follows the diagrams.
        </desc>
        {(molecule.separators ?? []).map((separator, index) => (
          <text
            x={separator.x}
            y={separator.y}
            className="snapshot-plus-sign"
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
                className="snapshot-bond__line"
                x1={first.position.x}
                y1={first.position.y}
                x2={second.position.x}
                y2={second.position.y}
              />
            </g>
          );
        })}

        {molecule.atoms.map((atom) => (
          <g
            className={`snapshot-atom ${changedAtomIds.has(atom.id) ? "snapshot-atom--changed" : ""}`}
            key={atom.id}
            aria-hidden="true"
          >
            <circle
              className="snapshot-atom__change-ring"
              cx={atom.position.x}
              cy={atom.position.y}
              r="31"
            />
            {atom.implicitHydrogenCount > 0 && (
              <text
                className="snapshot-implicit-hydrogen"
                x={atom.position.x}
                y={atom.position.y + 49}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {atom.implicitHydrogenCount}H
              </text>
            )}
            <text
              className="snapshot-atom__symbol"
              x={atom.position.x}
              y={atom.position.y}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {atom.element}
            </text>
            <text
              className="snapshot-atom__label"
              x={atom.position.x}
              y={atom.position.y - 42}
              textAnchor="middle"
            >
              {atom.label}
            </text>
            {atom.formalCharge !== 0 && (
              <text
                className="snapshot-formal-charge"
                x={atom.position.x + 24}
                y={atom.position.y - 22}
              >
                {chargeLabel(atom.formalCharge)}
              </text>
            )}
          </g>
        ))}

        {molecule.lonePairSites.map((site) => {
          const position = pairPosition(molecule, site.id);
          if (!position) return null;
          const radians = (site.angle * Math.PI) / 180;
          const tangent = { x: -Math.sin(radians) * 4, y: Math.cos(radians) * 4 };
          return (
            <g className="snapshot-pair" key={site.id} aria-hidden="true">
              <circle
                className="snapshot-electron-dot"
                cx={position.x - tangent.x}
                cy={position.y - tangent.y}
                r="3.4"
              />
              <circle
                className="snapshot-electron-dot"
                cx={position.x + tangent.x}
                cy={position.y + tangent.y}
                r="3.4"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
