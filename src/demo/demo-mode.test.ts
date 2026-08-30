import { describe, expect, it } from "vitest";
import { createMechanismStore } from "../store/mechanism-store";
import {
  demoSessionPath,
  isDemoSessionRequested,
  savedPracticePath,
} from "./demo-mode";
import { JUDGE_AGENT_PROMPT } from "./judge-prompt";

describe("judge demo mode", () => {
  it("recognizes only the explicit demo query value", () => {
    expect(isDemoSessionRequested("?demo=1")).toBe(true);
    expect(isDemoSessionRequested("?demo=0")).toBe(false);
    expect(isDemoSessionRequested("?preview=1")).toBe(false);
  });

  it("preserves other URL state when entering and leaving the demo", () => {
    const source = "https://example.test/mechanism-canvas/?source=judge#workspace";
    expect(demoSessionPath(source)).toBe(
      "/mechanism-canvas/?source=judge&demo=1#workspace",
    );
    expect(
      savedPracticePath(
        "https://example.test/mechanism-canvas/?source=judge&demo=1#workspace",
      ),
    ).toBe("/mechanism-canvas/?source=judge#workspace");
  });

  it("keeps an in-memory demo separate from saved learner progress", () => {
    const saved = createMechanismStore(undefined, window.localStorage);
    expect(
      saved.addDraftArrow({
        source: { kind: "lone_pair", entityId: "lp_o_1" },
        target: { kind: "atom", entityId: "c_electrophile" },
        actor: "human",
      }).ok,
    ).toBe(true);

    const demo = createMechanismStore(undefined, null);
    expect(demo.getState().draftArrows).toHaveLength(0);
    expect(
      demo.addDraftArrow({
        source: { kind: "lone_pair", entityId: "lp_o_2" },
        target: { kind: "atom", entityId: "c_electrophile" },
        actor: "human",
      }).ok,
    ).toBe(true);

    const restoredSaved = createMechanismStore(undefined, window.localStorage);
    expect(restoredSaved.getState().draftArrows).toHaveLength(1);
    expect(restoredSaved.getState().draftArrows[0].source.entityId).toBe("lp_o_1");

    const reloadedDemo = createMechanismStore(undefined, null);
    expect(reloadedDemo.getState().draftArrows).toHaveLength(0);
    expect(reloadedDemo.getState().mechanismRevision).toBe(0);
  });

  it("copies a first-turn prompt that stops at the learner proposal gate", () => {
    expect(JUDGE_AGENT_PROMPT).toContain("propose_draft_arrows");
    expect(JUDGE_AGENT_PROMPT).toContain("stop for my decision");
    expect(JUDGE_AGENT_PROMPT).not.toContain("commit the intermediate");
  });
});
