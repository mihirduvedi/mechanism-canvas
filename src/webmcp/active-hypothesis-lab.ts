import { mechanismStore } from "../store/active-mechanism-store";
import { createHypothesisLabManager } from "./hypothesis-lab";

// Counterfactual branches are deliberately tab-local. Reloading or ending the
// lab discards them without changing saved practice or workspace schema v6.
export const hypothesisLabManager = createHypothesisLabManager(mechanismStore);
