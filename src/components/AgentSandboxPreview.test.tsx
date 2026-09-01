import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createMechanismStore } from "../store/mechanism-store";
import { createHypothesisLabManager } from "../webmcp/hypothesis-lab";
import {
  AgentSandboxPreview,
  buildPreviewArrowHead,
  PREVIEW_FORMATION_ARROW_START,
  PREVIEW_LONE_PAIR_DOTS,
} from "./AgentSandboxPreview";

describe("AgentSandboxPreview", () => {
  it("labels the no-lab story as example output and shows both reviewed example paths", () => {
    const html = renderToStaticMarkup(
      <AgentSandboxPreview
        problemTitle="Hydroxide replaces bromide"
        draftArrowCount={0}
        lab={null}
        delegationSession={null}
      />,
    );

    expect(html).toContain("Two-path test · SN2 example");
    expect(html).toContain("Incomplete · evidence kept");
    expect(html).toContain("Approved · ready for your review");
    expect(html).toContain("agent-sandbox-preview__flow");
    expect(html).toContain('data-preview-arrow="bond-formation"');
    expect(html).toContain('data-preview-arrow="bond-cleavage"');
    expect(html).toContain("button--organic-hero");
    expect(html).toContain("agent-sandbox-preview__field-line");
    expect(html).not.toContain("agent-sandbox-preview__handoff-arrow");
  });

  it("does not draw invented arrows while a live lab is still waiting for agent ideas", () => {
    const store = createMechanismStore(undefined, null);
    const manager = createHypothesisLabManager(store);
    const lab = manager.start(2);
    const html = renderToStaticMarkup(
      <AgentSandboxPreview
        problemTitle="Hydroxide replaces bromide"
        draftArrowCount={0}
        lab={lab}
        delegationSession={null}
      />,
    );

    expect(html).toContain("Live lab output");
    expect(html).toContain("Waiting for an idea");
    expect(html).not.toContain("agent-sandbox-preview__flow\"");
    manager.destroy();
  });

  it("derives each arrowhead around the shaft endpoint and points it toward the target", () => {
    const points = buildPreviewArrowHead({ x: 116, y: 26 }, { x: 120, y: 35 }, 6.5)
      .split(" ")
      .map((pair) => pair.split(",").map(Number));
    const [tip, firstBase, secondBase] = points;
    const baseMidpoint = [
      (firstBase[0] + secondBase[0]) / 2,
      (firstBase[1] + secondBase[1]) / 2,
    ];

    expect(tip).toEqual([120, 35]);
    expect(baseMidpoint[0]).toBeCloseTo(116, 2);
    expect(baseMidpoint[1]).toBeCloseTo(26, 2);
    expect(tip[0] - baseMidpoint[0]).toBeGreaterThan(0);
    expect(tip[1] - baseMidpoint[1]).toBeGreaterThan(0);
  });

  it("renders oxygen's lone pair tangentially and starts the shaft beyond both dots", () => {
    const [firstDot, secondDot] = PREVIEW_LONE_PAIR_DOTS;
    const pairMidpoint = {
      x: (firstDot.x + secondDot.x) / 2,
      y: (firstDot.y + secondDot.y) / 2,
    };

    expect(firstDot.y).toBe(secondDot.y);
    expect(pairMidpoint).toEqual({ x: 24, y: 24 });
    expect(PREVIEW_FORMATION_ARROW_START.x - secondDot.x).toBeGreaterThan(6);
    expect(PREVIEW_FORMATION_ARROW_START.y).toBe(secondDot.y);

    const html = renderToStaticMarkup(
      <AgentSandboxPreview
        problemTitle="Hydroxide replaces bromide"
        draftArrowCount={0}
        lab={null}
        delegationSession={null}
      />,
    );
    expect(html).toContain('data-preview-lone-pair="oxygen"');
    expect(html).toContain('data-preview-shaft="bond-formation"');
    expect(html).toContain('d="M 38 24 C 68 6 103 8 116 26"');
  });
});
