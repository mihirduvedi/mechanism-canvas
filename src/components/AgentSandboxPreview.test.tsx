import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createMechanismStore } from "../store/mechanism-store";
import { createHypothesisLabManager } from "../webmcp/hypothesis-lab";
import { AgentSandboxPreview } from "./AgentSandboxPreview";

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

    expect(html).toContain("Example output · clean SN2 demo");
    expect(html).toContain("Incomplete · evidence kept");
    expect(html).toContain("Approved · ready for your review");
    expect(html).toContain("agent-sandbox-preview__flow");
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
});
