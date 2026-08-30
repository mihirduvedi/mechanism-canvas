import { describe, expect, it } from "vitest";
import { sn2Problem } from "../problems/sn2-01";
import { createMechanismStore } from "../store/mechanism-store";
import {
  buildLearningRecord,
  learningRecordFilename,
  serializeLearningRecord,
} from "./learning-record";

function addAcceptedBundle(store: ReturnType<typeof createMechanismStore>) {
  store.addDraftArrow({
    source: { kind: "lone_pair", entityId: "lp_o_1" },
    target: { kind: "atom", entityId: "c_electrophile" },
    actor: "human",
  });
  store.addDraftArrow({
    source: { kind: "bond", entityId: "bond_c_br" },
    target: { kind: "atom", entityId: "br_leaving" },
    actor: "human",
  });
}

describe("learning record export", () => {
  it("exports current learner-visible evidence without hidden answer definitions", () => {
    const store = createMechanismStore(sn2Problem, null, [sn2Problem]);
    store.requestScaffold(2, "human");
    addAcceptedBundle(store);
    const checked = store.checkDraftStep("human");
    expect(checked.value?.classification).toBe("valid");

    const record = buildLearningRecord(
      sn2Problem,
      store.getState(),
      "demo",
      "2026-08-29T02:00:00.000Z",
    );
    const serialized = serializeLearningRecord(record);

    expect(record).toMatchObject({
      schema: "mechanism-canvas.learning-record",
      version: 1,
      session: { mode: "demo", scope: "active exercise only" },
      metrics: {
        attempts: 1,
        hintsRequested: 1,
        currentStepHighestHintLevel: 2,
        activeCommits: 0,
      },
      currentGraph: { id: "sn2_reactants" },
      latestCheck: { classification: "valid" },
    });
    expect(record.draftArrows).toHaveLength(2);
    expect(serialized).not.toContain("acceptedBundles");
    expect(serialized).not.toContain("validationId");
    expect(serialized).not.toContain("draftSignature");
    expect(serialized).not.toContain("sn2_products");
  });

  it("includes performed commits and reflections while leaving commit authority out", () => {
    const store = createMechanismStore(sn2Problem, null, [sn2Problem]);
    addAcceptedBundle(store);
    const checked = store.checkDraftStep("human");
    expect(store.commitCheckedStep(checked.value?.validationId ?? "", "human").ok).toBe(true);
    expect(
      store.saveCommitReflection(
        "commit_1",
        "Both arrows happen together, so the carbon does not exceed its octet.",
      ).ok,
    ).toBe(true);

    const record = buildLearningRecord(
      sn2Problem,
      store.getState(),
      "saved",
      "2026-08-29T02:00:00.000Z",
    );
    const serialized = serializeLearningRecord(record);

    expect(record.currentGraph.id).toBe("sn2_products");
    expect(record.metrics.currentStepHighestHintLevel).toBeNull();
    expect(record.commits[0]).toMatchObject({
      id: "commit_1",
      stepId: "sn2_substitution",
      reflection: "Both arrows happen together, so the carbon does not exceed its octet.",
    });
    expect(record.commits[0].performedArrowBundle).toHaveLength(2);
    expect(serialized).not.toContain("validationId");
    expect(serialized).not.toContain("acceptedBundles");
    expect(learningRecordFilename(sn2Problem.id, record.exportedAt)).toBe(
      "mechanism-canvas-sn2_01-learning-record-2026-08-29.json",
    );
  });

  it("keeps a pending agent proposal and its rationale out of the export", () => {
    const store = createMechanismStore(sn2Problem, null, [sn2Problem]);
    expect(
      store.stageAgentProposal({
        arrows: [
          {
            source: { kind: "lone_pair", entityId: "lp_o_1" },
            target: { kind: "atom", entityId: "c_electrophile" },
          },
        ],
        rationale: "PRIVATE PROPOSAL RATIONALE",
        expectedRevision: 0,
      }).ok,
    ).toBe(true);

    const record = buildLearningRecord(
      sn2Problem,
      store.getState(),
      "saved",
      "2026-08-29T02:00:00.000Z",
    );
    const serialized = serializeLearningRecord(record);

    expect(serialized).not.toContain("agentProposal");
    expect(serialized).not.toContain("PRIVATE PROPOSAL RATIONALE");
    expect(record.privacy.excludes).toContain("pending agent proposal and its rationale");
  });
});
