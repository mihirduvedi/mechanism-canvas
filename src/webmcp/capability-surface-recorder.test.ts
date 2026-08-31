import { describe, expect, it } from "vitest";
import { createCapabilitySurfaceRecorder } from "./capability-surface-recorder";

const scope = {
  collaborationMode: "coach" as const,
  contractRevision: 0,
  delegationSessionId: null,
  delegationPresetLabel: null,
  delegationStatus: null,
  hypothesisLabId: null,
  hypothesisLabStatus: null,
};

describe("WebMCP capability surface recorder", () => {
  it("records only host-accepted surfaces and exact lifecycle diffs", () => {
    const recorder = createCapabilitySurfaceRecorder();
    recorder.markManual(["get_mechanism_state"]);
    expect(recorder.getSnapshot()).toMatchObject({ hostStatus: "manual", latest: null });

    recorder.recordRegistered(["get_mechanism_state", "check_draft_step"], scope);
    recorder.recordRegistered(["get_mechanism_state", "get_hypothesis_lab"], {
      ...scope,
      hypothesisLabId: "hypothesis_lab_1",
      hypothesisLabStatus: "active",
    });
    expect(recorder.getSnapshot()).toMatchObject({
      hostStatus: "ready",
      latest: {
        sequence: 2,
        addedToolNames: ["get_hypothesis_lab"],
        removedToolNames: ["check_draft_step"],
      },
    });
  });

  it("keeps the last attested surface distinct from a later host error", () => {
    const recorder = createCapabilitySurfaceRecorder();
    recorder.recordRegistered(["get_mechanism_state"], scope);
    recorder.recordError(["get_mechanism_state", "check_draft_step"], new Error("registration failed"));
    expect(recorder.getSnapshot()).toMatchObject({
      hostStatus: "error",
      projectedToolNames: ["get_mechanism_state", "check_draft_step"],
      latest: { toolNames: ["get_mechanism_state"] },
      errorMessage: "registration failed",
    });
  });
});
