import type { CollaborationMode } from "../domain/types";
import type { DelegationSession } from "./delegation-session";
import type { HypothesisLab } from "./hypothesis-lab";

export const MAX_CAPABILITY_SURFACE_EVENTS = 12;
export type WebMcpHostStatus = "ready" | "manual" | "error";

export interface CapabilitySurfaceScope {
  collaborationMode: CollaborationMode;
  contractRevision: number;
  delegationSessionId: string | null;
  delegationPresetLabel: string | null;
  delegationStatus: DelegationSession["status"] | null;
  hypothesisLabId: string | null;
  hypothesisLabStatus: HypothesisLab["status"] | null;
}

export interface CapabilitySurfaceEvent {
  sequence: number;
  recordedAt: string;
  toolNames: string[];
  addedToolNames: string[];
  removedToolNames: string[];
  scope: CapabilitySurfaceScope;
}

export interface CapabilitySurfaceSnapshot {
  hostStatus: WebMcpHostStatus;
  projectedToolNames: string[];
  events: readonly CapabilitySurfaceEvent[];
  latest: CapabilitySurfaceEvent | null;
  errorMessage: string | null;
}

export interface CapabilitySurfaceRecorder {
  getSnapshot: () => CapabilitySurfaceSnapshot;
  subscribe: (listener: () => void) => () => void;
  markManual: (projectedToolNames: readonly string[]) => void;
  recordRegistered: (toolNames: readonly string[], scope: CapabilitySurfaceScope) => CapabilitySurfaceEvent;
  recordError: (projectedToolNames: readonly string[], error: unknown) => void;
  clear: () => void;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim().slice(0, 160);
  return "The host rejected the requested Site Tool surface.";
}

export function createCapabilitySurfaceRecorder(): CapabilitySurfaceRecorder {
  let sequence = 0;
  let snapshot: CapabilitySurfaceSnapshot = {
    hostStatus: "manual",
    projectedToolNames: [],
    events: [],
    latest: null,
    errorMessage: null,
  };
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    markManual: (projectedToolNames) => {
      snapshot = {
        ...snapshot,
        hostStatus: "manual",
        projectedToolNames: [...projectedToolNames],
        errorMessage: null,
      };
      emit();
    },
    recordRegistered: (toolNames, scope) => {
      sequence += 1;
      const previousNames = new Set(snapshot.latest?.toolNames ?? []);
      const nextNames = new Set(toolNames);
      const event: CapabilitySurfaceEvent = {
        sequence,
        recordedAt: new Date().toISOString(),
        toolNames: [...toolNames],
        addedToolNames: [...nextNames].filter((name) => !previousNames.has(name)),
        removedToolNames: [...previousNames].filter((name) => !nextNames.has(name)),
        scope: { ...scope },
      };
      const events = [...snapshot.events, event].slice(-MAX_CAPABILITY_SURFACE_EVENTS);
      snapshot = {
        hostStatus: "ready",
        projectedToolNames: [...toolNames],
        events,
        latest: event,
        errorMessage: null,
      };
      emit();
      return event;
    },
    recordError: (projectedToolNames, error) => {
      snapshot = {
        ...snapshot,
        hostStatus: "error",
        projectedToolNames: [...projectedToolNames],
        errorMessage: errorMessage(error),
      };
      emit();
    },
    clear: () => {
      sequence = 0;
      snapshot = {
        hostStatus: "manual",
        projectedToolNames: [],
        events: [],
        latest: null,
        errorMessage: null,
      };
      emit();
    },
  };
}

export const capabilitySurfaceRecorder = createCapabilitySurfaceRecorder();
