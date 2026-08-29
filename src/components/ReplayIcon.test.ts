import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ReplayIcon } from "./ReplayIcon";

describe("ReplayIcon", () => {
  it("uses explicit centered vector geometry instead of a font or CSS triangle", () => {
    const markup = renderToStaticMarkup(createElement(ReplayIcon));
    expect(markup).toContain('viewBox="0 0 20 20"');
    expect(markup).toContain('<circle cx="10" cy="10" r="8.25"');
    expect(markup).toContain('d="M8.25 6.55L13.05 10L8.25 13.45Z"');
    expect(markup).not.toContain("::before");
  });

  it("centers the play triangle by its visual centroid", () => {
    const points = [
      { x: 8.25, y: 6.55 },
      { x: 13.05, y: 10 },
      { x: 8.25, y: 13.45 },
    ];
    const centroid = points.reduce(
      (sum, point) => ({ x: sum.x + point.x / 3, y: sum.y + point.y / 3 }),
      { x: 0, y: 0 },
    );
    expect(Math.abs(centroid.x - 10)).toBeLessThanOrEqual(0.2);
    expect(centroid.y).toBe(10);
  });
});
