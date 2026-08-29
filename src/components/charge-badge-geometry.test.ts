import { describe, expect, it } from "vitest";
import { chargeGlyphSegments } from "./charge-badge-geometry";

describe("formal-charge badge geometry", () => {
  it("centers the negative glyph geometrically in the badge", () => {
    const [minus] = chargeGlyphSegments(-1);

    expect((minus.from.x + minus.to.x) / 2).toBe(64);
    expect((minus.from.y + minus.to.y) / 2).toBe(64);
  });

  it("uses centered, equal-length strokes for the positive glyph", () => {
    const [horizontal, vertical] = chargeGlyphSegments(1);

    expect(horizontal.to.x - horizontal.from.x).toBe(vertical.to.y - vertical.from.y);
    expect((vertical.from.x + vertical.to.x) / 2).toBe(64);
    expect((vertical.from.y + vertical.to.y) / 2).toBe(64);
  });
});
