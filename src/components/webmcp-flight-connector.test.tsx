import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  FlightConnector,
  WEBMCP_FLIGHT_CONNECTOR_PATH,
} from "./WebMcpObservatory";

describe("WebMCP flight connector", () => {
  it("renders the curved shaft and arrowhead as one seam-free stroked path", () => {
    const markup = renderToStaticMarkup(<FlightConnector />);

    expect(markup.match(/<path\b/g)).toHaveLength(1);
    expect(markup).not.toContain("<polygon");
    expect(markup).toContain(`d="${WEBMCP_FLIGHT_CONNECTOR_PATH}"`);
    expect(WEBMCP_FLIGHT_CONNECTOR_PATH).toContain("40 17");
    expect(WEBMCP_FLIGHT_CONNECTOR_PATH).toContain("42 17");
  });
});
