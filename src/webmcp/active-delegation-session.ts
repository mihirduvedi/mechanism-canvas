import { mechanismStore } from "../store/active-mechanism-store";
import { createDelegationSessionManager } from "./delegation-session";

// Delegation is deliberately tab-local. It never enters the saved practice
// schema and reload always restores the full learner-owned contract surface.
export const delegationSessionManager = createDelegationSessionManager(mechanismStore);
