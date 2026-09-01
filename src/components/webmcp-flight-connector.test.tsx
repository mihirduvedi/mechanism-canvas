import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  FlightConnector,
  WEBMCP_FLIGHT_CONNECTOR_GEOMETRY,
  WEBMCP_FLIGHT_CONNECTOR_HEAD,
  WEBMCP_FLIGHT_CONNECTOR_PATH,
} from "./WebMcpObservatory";

describe("WebMCP flight connector", () => {
  it("joins the curved shaft to a tangent-aligned filled arrowhead", () => {
    const markup = renderToStaticMarkup(<FlightConnector />);
    const { headBase, headLeft, headRight, tip, tipControl } =
      WEBMCP_FLIGHT_CONNECTOR_GEOMETRY;
    const headBaseMidpoint = {
      x: (headLeft.x + headRight.x) / 2,
      y: (headLeft.y + headRight.y) / 2,
    };
    const shaftTangent = {
      x: headBase.x - tipControl.x,
      y: headBase.y - tipControl.y,
    };
    const headDirection = {
      x: tip.x - headBase.x,
      y: tip.y - headBase.y,
    };
    const crossProduct =
      shaftTangent.x * headDirection.y - shaftTangent.y * headDirection.x;

    expect(markup.match(/<path\b/g)).toHaveLength(1);
    expect(markup.match(/<polygon\b/g)).toHaveLength(1);
    expect(markup).toContain(`d="${WEBMCP_FLIGHT_CONNECTOR_PATH}"`);
    expect(markup).toContain(`points="${WEBMCP_FLIGHT_CONNECTOR_HEAD}"`);
    expect(headBaseMidpoint.x).toBeCloseTo(headBase.x, 3);
    expect(headBaseMidpoint.y).toBeCloseTo(headBase.y, 3);
    expect(Math.abs(crossProduct)).toBeLessThan(0.001);
  });
});
