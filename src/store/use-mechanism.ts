import { useSyncExternalStore } from "react";
import type { MechanismStore } from "./mechanism-store";
import { mechanismStore } from "./mechanism-store";

export function useMechanismState(store: MechanismStore = mechanismStore) {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
