import { useSyncExternalStore } from "react";
import { mechanismStore } from "./active-mechanism-store";
import type { MechanismStore } from "./mechanism-store";

export function useMechanismState(store: MechanismStore = mechanismStore) {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
