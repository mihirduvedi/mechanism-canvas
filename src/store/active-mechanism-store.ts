import { isDemoSessionRequested, type SessionMode } from "../demo/demo-mode";
import { sn2Problem } from "../problems/sn2-01";
import { createMechanismStore } from "./mechanism-store";

function availableStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const activeSessionMode: SessionMode =
  typeof window !== "undefined" && isDemoSessionRequested(window.location.search)
    ? "demo"
    : "saved";

// Demo sessions intentionally use memory only. Reloading ?demo=1 always returns
// to the authored SN2 reactants, and normal local progress is never read or written.
export const mechanismStore = createMechanismStore(
  sn2Problem,
  activeSessionMode === "demo" ? null : availableStorage(),
);
