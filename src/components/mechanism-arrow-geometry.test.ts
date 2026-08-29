import { describe, expect, it } from "vitest";
import { buildMechanismArrowGeometry } from "./mechanism-arrow-geometry";
import {
  buildMechanismArrowRoutes,
  MINIMUM_TARGET_ANGLE,
  preferredMechanismArrowTargetAngle,
  TARGET_OBSTACLE_CLEARANCE,
} from "./mechanism-arrow-routing";

function distance(first: { x: number; y: number }, second: { x: number; y: number }) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function angularDistance(first: number, second: number) {
  const fullTurn = Math.PI * 2;
  const difference = Math.abs(first - second) % fullTurn;
  return Math.min(difference, fullTurn - difference);
}

describe("mechanism arrow geometry", () => {
  it("starts beyond the visible lone-pair electron dots", () => {
    const source = { x: 180, y: 152 };
    const geometry = buildMechanismArrowGeometry(
      source,
      { x: 490, y: 190 },
      0,
      "lone_pair",
    );

    expect(geometry.sourceClearance).toBeGreaterThanOrEqual(12);
    expect(distance(geometry.start, source)).toBeCloseTo(geometry.sourceClearance, 5);
  });

  it("lands a bond arrow off the bond axis and points its head into the target atom", () => {
    const source = { x: 570, y: 190 };
    const target = { x: 650, y: 190 };
    const geometry = buildMechanismArrowGeometry(
      source,
      target,
      1,
      "bond",
    );
    const incoming = {
      x: geometry.tip.x - geometry.tipControl.x,
      y: geometry.tip.y - geometry.tipControl.y,
    };
    const towardAtom = {
      x: target.x - geometry.tip.x,
      y: target.y - geometry.tip.y,
    };
    const cosine =
      (incoming.x * towardAtom.x + incoming.y * towardAtom.y) /
      (Math.hypot(incoming.x, incoming.y) * Math.hypot(towardAtom.x, towardAtom.y));

    expect(distance(geometry.tip, target)).toBeCloseTo(35.5, 5);
    expect(geometry.tip.x).toBeGreaterThan(610);
    expect(Math.abs(geometry.tip.y - target.y)).toBeGreaterThan(12);
    expect(distance(geometry.start, source)).toBeCloseTo(2.5, 5);
    expect(cosine).toBeCloseTo(1, 5);
    expect(geometry.start.x).toBeLessThan(geometry.headBase.x);
  });

  it("moves a bond-arrow landing away from the target atom's lone pairs", () => {
    const source = { x: 570, y: 190 };
    const target = { x: 650, y: 190 };
    const lonePairAngles = [-90, 30, 150].map((angle) => (angle * Math.PI) / 180);
    const preferredTargetAngle = preferredMechanismArrowTargetAngle(
      source,
      target,
      1,
      "bond",
    );
    const routes = buildMechanismArrowRoutes([
      {
        index: 1,
        targetId: "bromine",
        source,
        target,
        preferredTargetAngle,
        targetObstacleAngles: [...lonePairAngles, Math.PI],
      },
    ]);
    const route = routes.get(1)!;
    const geometry = buildMechanismArrowGeometry(source, target, 1, "bond", route);
    const linearFirstControl = {
      x: geometry.start.x + (geometry.tip.x - geometry.start.x) * 0.33,
      y: geometry.start.y + (geometry.tip.y - geometry.start.y) * 0.33,
    };
    const lowerLeftPairCenter = {
      x: target.x + Math.cos(lonePairAngles[2]) * 38,
      y: target.y + Math.sin(lonePairAngles[2]) * 38,
    };

    expect(route.curveLane).toBeUndefined();
    expect(route.targetAngle).toBeLessThan(preferredTargetAngle);
    for (const obstacleAngle of [...lonePairAngles, Math.PI]) {
      expect(angularDistance(route.targetAngle, obstacleAngle)).toBeGreaterThanOrEqual(
        TARGET_OBSTACLE_CLEARANCE - 1e-10,
      );
    }
    expect(distance(geometry.firstControl, linearFirstControl)).toBeGreaterThan(6);
    expect(distance(geometry.tip, lowerLeftPairCenter)).toBeGreaterThan(20);
  });

  it("ends the shaft at the arrowhead base so it cannot protrude through the tip", () => {
    const geometry = buildMechanismArrowGeometry(
      { x: 180, y: 152 },
      { x: 490, y: 190 },
      0,
      "lone_pair",
    );

    expect(geometry.shaftPath.endsWith(`${geometry.headBase.x} ${geometry.headBase.y}`)).toBe(true);
    expect(distance(geometry.headBase, geometry.tip)).toBeCloseTo(9.5, 5);
    expect(geometry.headPoints.startsWith(`${geometry.tip.x},${geometry.tip.y}`)).toBe(true);
  });

  it("fans crowded arrowheads around a shared target", () => {
    const target = { x: 490, y: 190 };
    const routes = buildMechanismArrowRoutes([
      { index: 0, targetId: "carbon", source: { x: 180, y: 150 }, target },
      { index: 1, targetId: "carbon", source: { x: 180, y: 190 }, target },
      { index: 2, targetId: "carbon", source: { x: 180, y: 230 }, target },
    ]);
    const routed = [routes.get(0)!, routes.get(1)!, routes.get(2)!].sort(
      (first, second) => first.targetAngle - second.targetAngle,
    );

    expect(routes.size).toBe(3);
    expect(routed[1].targetAngle - routed[0].targetAngle).toBeGreaterThanOrEqual(
      MINIMUM_TARGET_ANGLE - 1e-10,
    );
    expect(routed[2].targetAngle - routed[1].targetAngle).toBeGreaterThanOrEqual(
      MINIMUM_TARGET_ANGLE - 1e-10,
    );
    expect(routed.map((route) => route.curveLane)).toEqual([-1, 0, 1]);
  });

  it("keeps a shared-target fan out of occupied perimeter ports", () => {
    const target = { x: 490, y: 190 };
    const obstacleAngle = Math.PI;
    const routes = buildMechanismArrowRoutes([
      {
        index: 0,
        targetId: "carbon",
        source: { x: 180, y: 150 },
        target,
        targetObstacleAngles: [obstacleAngle],
      },
      {
        index: 1,
        targetId: "carbon",
        source: { x: 180, y: 190 },
        target,
        targetObstacleAngles: [obstacleAngle],
      },
      {
        index: 2,
        targetId: "carbon",
        source: { x: 180, y: 230 },
        target,
        targetObstacleAngles: [obstacleAngle],
      },
    ]);
    const routed = [routes.get(0)!, routes.get(1)!, routes.get(2)!].sort(
      (first, second) => first.targetAngle - second.targetAngle,
    );

    for (const route of routed) {
      expect(angularDistance(route.targetAngle, obstacleAngle)).toBeGreaterThanOrEqual(
        TARGET_OBSTACLE_CLEARANCE - 1e-10,
      );
    }
    expect(
      angularDistance(routed[0].targetAngle, routed[1].targetAngle),
    ).toBeGreaterThanOrEqual(MINIMUM_TARGET_ANGLE - 1e-10);
    expect(
      angularDistance(routed[1].targetAngle, routed[2].targetAngle),
    ).toBeGreaterThanOrEqual(MINIMUM_TARGET_ANGLE - 1e-10);
  });

  it("leaves naturally separated target approaches unchanged", () => {
    const target = { x: 490, y: 190 };
    const routes = buildMechanismArrowRoutes([
      { index: 0, targetId: "carbon", source: { x: 180, y: 190 }, target },
      { index: 1, targetId: "carbon", source: { x: 490, y: 20 }, target },
    ]);

    expect(routes.size).toBe(0);
  });

  it("produces visibly separated tips for routed arrows", () => {
    const source = { x: 180, y: 190 };
    const target = { x: 490, y: 190 };
    const routes = buildMechanismArrowRoutes([
      { index: 0, targetId: "carbon", source, target },
      { index: 1, targetId: "carbon", source, target },
    ]);
    const first = buildMechanismArrowGeometry(source, target, 0, "lone_pair", routes.get(0));
    const second = buildMechanismArrowGeometry(source, target, 1, "lone_pair", routes.get(1));

    expect(distance(first.tip, second.tip)).toBeGreaterThan(12);
    expect(first.shaftPath).not.toBe(second.shaftPath);
  });

  it("keeps a crowded fan ordered from its sources through the target", () => {
    const target = { x: 490, y: 190 };
    const sources = [
      { x: 180, y: 152 },
      { x: 213, y: 209 },
      { x: 147, y: 209 },
    ];
    const routes = buildMechanismArrowRoutes(
      sources.map((source, index) => ({ index, targetId: "carbon", source, target })),
    );
    const geometries = sources.map((source, index) =>
      buildMechanismArrowGeometry(source, target, index, "lone_pair", routes.get(index)),
    );

    expect(geometries[0].firstControl.y).toBeLessThan(geometries[2].firstControl.y);
    expect(geometries[2].firstControl.y).toBeLessThan(geometries[1].firstControl.y);
    expect(geometries[0].tip.y).toBeLessThan(geometries[2].tip.y);
    expect(geometries[2].tip.y).toBeLessThan(geometries[1].tip.y);
  });
});
