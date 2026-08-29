import type { ElectronSource, Point } from "../domain/types";

const FULL_TURN = Math.PI * 2;
export const MINIMUM_TARGET_ANGLE = (22 * Math.PI) / 180;
export const TARGET_OBSTACLE_CLEARANCE = (36 * Math.PI) / 180;
const BOND_TARGET_OFFSET = (28 * Math.PI) / 180;
const TARGET_SEARCH_STEP = (2 * Math.PI) / 180;

export interface ArrowRouteInput {
  index: number;
  targetId: string;
  source: Point;
  target: Point;
  preferredTargetAngle?: number;
  targetObstacleAngles?: number[];
}

export interface MechanismArrowRoute {
  targetAngle: number;
  curveLane?: number;
}

interface AngledRouteInput extends ArrowRouteInput {
  angle: number;
  sourceAngle: number;
  obstacleAdjusted: boolean;
}

function normalizedAngle(angle: number): number {
  return ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN;
}

function signedAngularDistance(from: number, to: number): number {
  const difference = normalizedAngle(to) - normalizedAngle(from);
  return ((difference + Math.PI) % FULL_TURN + FULL_TURN) % FULL_TURN - Math.PI;
}

function angularDistance(first: number, second: number): number {
  return Math.abs(signedAngularDistance(first, second));
}

function angleOnNearestTurn(angle: number, reference: number): number {
  return angle + Math.round((reference - angle) / FULL_TURN) * FULL_TURN;
}

function targetAngleIsClear(
  angle: number,
  obstacleAngles: number[],
  reservedAngles: number[],
): boolean {
  return (
    obstacleAngles.every(
      (obstacleAngle) =>
        angularDistance(angle, obstacleAngle) >= TARGET_OBSTACLE_CLEARANCE - 1e-10,
    ) &&
    reservedAngles.every(
      (reservedAngle) =>
        angularDistance(angle, reservedAngle) >= MINIMUM_TARGET_ANGLE - 1e-10,
    )
  );
}

export function clearMechanismArrowTargetAngle(
  preferredAngle: number,
  sourceAngle: number,
  obstacleAngles: number[],
  reservedAngles: number[] = [],
): number {
  const preferred = normalizedAngle(preferredAngle);
  if (targetAngleIsClear(preferred, obstacleAngles, reservedAngles)) return preferred;

  const preferredDirection = Math.sign(signedAngularDistance(sourceAngle, preferred));
  const searchDirections =
    preferredDirection === 0 ? [1, -1] : [preferredDirection, -preferredDirection];
  const searchSteps = Math.ceil(FULL_TURN / TARGET_SEARCH_STEP);
  for (let step = 1; step <= searchSteps; step += 1) {
    for (const direction of searchDirections) {
      const candidate = normalizedAngle(preferred + direction * step * TARGET_SEARCH_STEP);
      if (targetAngleIsClear(candidate, obstacleAngles, reservedAngles)) return candidate;
    }
  }

  return preferred;
}

export function preferredMechanismArrowTargetAngle(
  source: Point,
  target: Point,
  index: number,
  sourceKind: ElectronSource["kind"],
): number {
  const sourceAngle = Math.atan2(source.y - target.y, source.x - target.x);
  if (sourceKind !== "bond") return sourceAngle;
  const curveSide = index % 2 === 0 ? -1 : 1;
  return sourceAngle - curveSide * BOND_TARGET_OFFSET;
}

function routeCluster(
  cluster: AngledRouteInput[],
  routes: Map<number, MechanismArrowRoute>,
): void {
  if (cluster.length < 2) return;
  const adjustedAngles = [cluster[0].angle];
  for (let index = 1; index < cluster.length; index += 1) {
    adjustedAngles.push(
      Math.max(cluster[index].angle, adjustedAngles[index - 1] + MINIMUM_TARGET_ANGLE),
    );
  }
  const meanShift =
    adjustedAngles.reduce((sum, angle, index) => sum + angle - cluster[index].angle, 0) /
    cluster.length;
  const center = (cluster.length - 1) / 2;
  const reservedAngles: number[] = [];
  cluster.forEach((entry, index) => {
    const proposedAngle = adjustedAngles[index] - meanShift;
    const clearedAngle = clearMechanismArrowTargetAngle(
      proposedAngle,
      entry.sourceAngle,
      entry.targetObstacleAngles ?? [],
      reservedAngles,
    );
    const targetAngle = angleOnNearestTurn(clearedAngle, proposedAngle);
    reservedAngles.push(targetAngle);
    routes.set(entry.index, {
      targetAngle,
      curveLane: index - center,
    });
  });
}

export function buildMechanismArrowRoutes(
  inputs: ArrowRouteInput[],
): Map<number, MechanismArrowRoute> {
  const routes = new Map<number, MechanismArrowRoute>();
  const byTarget = new Map<string, AngledRouteInput[]>();
  for (const input of inputs) {
    const sourceAngle = normalizedAngle(
      Math.atan2(input.source.y - input.target.y, input.source.x - input.target.x),
    );
    const preferredAngle = normalizedAngle(
      input.preferredTargetAngle ??
        Math.atan2(input.source.y - input.target.y, input.source.x - input.target.x),
    );
    const angle = clearMechanismArrowTargetAngle(
      preferredAngle,
      sourceAngle,
      input.targetObstacleAngles ?? [],
    );
    const group = byTarget.get(input.targetId) ?? [];
    group.push({
      ...input,
      angle,
      sourceAngle,
      obstacleAdjusted: angularDistance(angle, preferredAngle) > 1e-10,
    });
    byTarget.set(input.targetId, group);
  }

  for (const group of byTarget.values()) {
    group.forEach((entry) => {
      if (entry.obstacleAdjusted) {
        routes.set(entry.index, { targetAngle: entry.angle });
      }
    });
    if (group.length < 2) continue;
    const sorted = [...group].sort(
      (first, second) => first.angle - second.angle || first.index - second.index,
    );
    let largestGapIndex = sorted.length - 1;
    let largestGap = sorted[0].angle + FULL_TURN - sorted.at(-1)!.angle;
    for (let index = 0; index < sorted.length - 1; index += 1) {
      const gap = sorted[index + 1].angle - sorted[index].angle;
      if (gap > largestGap) {
        largestGap = gap;
        largestGapIndex = index;
      }
    }

    const ordered: AngledRouteInput[] = [];
    let turnOffset = 0;
    let previousRawAngle: number | undefined;
    for (let offset = 1; offset <= sorted.length; offset += 1) {
      const entry = sorted[(largestGapIndex + offset) % sorted.length];
      if (previousRawAngle !== undefined && entry.angle < previousRawAngle) {
        turnOffset += FULL_TURN;
      }
      ordered.push({ ...entry, angle: entry.angle + turnOffset });
      previousRawAngle = entry.angle;
    }

    let cluster: AngledRouteInput[] = [ordered[0]];
    for (let index = 1; index < ordered.length; index += 1) {
      if (ordered[index].angle - ordered[index - 1].angle < MINIMUM_TARGET_ANGLE) {
        cluster.push(ordered[index]);
      } else {
        routeCluster(cluster, routes);
        cluster = [ordered[index]];
      }
    }
    routeCluster(cluster, routes);
  }

  return routes;
}
