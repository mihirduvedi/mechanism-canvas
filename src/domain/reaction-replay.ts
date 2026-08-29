export const REPLAY_REACHED_STEP_EVENT = "mechanism-canvas:replay-reached-step";

export interface ReachedStepReplayRequest {
  commitId: string;
  beforeStateId: string;
  afterStateId: string;
}
