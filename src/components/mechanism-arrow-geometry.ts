import type { ElectronSource, Point } from "../domain/types";
import {
  preferredMechanismArrowTargetAngle,
  type MechanismArrowRoute,
} from "./mechanism-arrow-routing";

const ATOM_RADIUS = 33;
const TARGET_GAP = 2.5;
const BOND_SOURCE_CLEARANCE = 2.5;
const LONE_PAIR_SOURCE_CLEARANCE = 13;
const ARROWHEAD_LENGTH = 9.5;
const ARROWHEAD_HALF_WIDTH = 4.5;

export interface MechanismArrowGeometry {
  start: Point;
  tip: Point;
  headBase: Point;
  firstControl: Point;
  tipControl: Point;
  shaftPath: string;
  headPoints: string;
  sourceClearance: number;
  targetClearance: number;
}

function pointAlong(origin: Point, direction: Point, distance: number): Point {
  return {
    x: origin.x + direction.x * distance,
    y: origin.y + direction.y * distance,
  };
}

function formatPoint(point: Point): string {
  return `${point.x} ${point.y}`;
}

export function buildMechanismArrowGeometry(
  source: Point,
  target: Point,
  index: number,
  sourceKind: ElectronSource["kind"],
  route?: MechanismArrowRoute,
): MechanismArrowGeometry {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const direction = { x: dx / distance, y: dy / distance };
  const sourceClearance =
    sourceKind === "bond" ? BOND_SOURCE_CLEARANCE : LONE_PAIR_SOURCE_CLEARANCE;
  const targetClearance = ATOM_RADIUS + TARGET_GAP;
  const start = pointAlong(source, direction, sourceClearance);
  const curveSide = index % 2 === 0 ? -1 : 1;
  const targetAngle = route?.targetAngle ??
    preferredMechanismArrowTargetAngle(source, target, index, sourceKind);
  const targetRadial = { x: Math.cos(targetAngle), y: Math.sin(targetAngle) };
  const tip = pointAlong(target, targetRadial, targetClearance);
  const drawable = { x: tip.x - start.x, y: tip.y - start.y };
  const drawableLength = Math.max(Math.hypot(drawable.x, drawable.y), 1);
  const chordDirection = {
    x: drawable.x / drawableLength,
    y: drawable.y / drawableLength,
  };
  const normal = { x: -chordDirection.y, y: chordDirection.x };
  const curve =
    route?.curveLane !== undefined
      ? -route.curveLane * Math.min(56, Math.max(24, drawableLength * 0.18))
      : curveSide * Math.min(48, Math.max(6, drawableLength * 0.16));
  const firstControl = route?.archY !== undefined
    ? { x: start.x + drawable.x * 0.33, y: route.archY }
    : {
        x: start.x + drawable.x * 0.33 + normal.x * curve,
        y: start.y + drawable.y * 0.33 + normal.y * curve,
      };
  const tipControl =
    route?.archY !== undefined
      ? { x: start.x + drawable.x * 0.7, y: route.archY }
      : route?.targetAngle !== undefined || sourceKind === "bond"
      ? pointAlong(
          tip,
          targetRadial,
          Math.min(58, Math.max(16, drawableLength * 0.24)),
        )
      : {
          x: start.x + drawable.x * 0.68 + normal.x * curve,
          y: start.y + drawable.y * 0.68 + normal.y * curve,
        };
  const tangentVector = { x: tip.x - tipControl.x, y: tip.y - tipControl.y };
  const tangentLength = Math.max(Math.hypot(tangentVector.x, tangentVector.y), 1);
  const tangent = {
    x: tangentVector.x / tangentLength,
    y: tangentVector.y / tangentLength,
  };
  const headLength = Math.min(ARROWHEAD_LENGTH, Math.max(6, drawableLength * 0.3));
  const headHalfWidth = Math.min(ARROWHEAD_HALF_WIDTH, headLength * 0.48);
  const headBase = pointAlong(tip, tangent, -headLength);
  const shaftControl = pointAlong(tipControl, tangent, -headLength);
  const headNormal = { x: -tangent.y, y: tangent.x };
  const headLeft = pointAlong(headBase, headNormal, headHalfWidth);
  const headRight = pointAlong(headBase, headNormal, -headHalfWidth);

  return {
    start,
    tip,
    headBase,
    firstControl,
    tipControl,
    shaftPath: `M ${formatPoint(start)} C ${formatPoint(firstControl)}, ${formatPoint(shaftControl)}, ${formatPoint(headBase)}`,
    headPoints: `${tip.x},${tip.y} ${headLeft.x},${headLeft.y} ${headRight.x},${headRight.y}`,
    sourceClearance,
    targetClearance,
  };
}
