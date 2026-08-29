export type ElementSymbol = "H" | "C" | "N" | "O" | "Cl" | "Br" | "I";

export type Actor = "human" | "agent" | "validator" | "system";

export interface Point {
  x: number;
  y: number;
}

export interface Atom {
  id: string;
  label: string;
  element: ElementSymbol;
  formalCharge: number;
  lonePairCount: number;
  implicitHydrogenCount: number;
  position: Point;
}

export type BondOrder = 1 | 2 | 3;

export interface Bond {
  id: string;
  atomIds: readonly [string, string];
  order: BondOrder;
}

export interface LonePairSite {
  id: string;
  atomId: string;
  angle: number;
}

export interface MoleculeState {
  id: string;
  label: string;
  atoms: Atom[];
  bonds: Bond[];
  lonePairSites: LonePairSite[];
  separators?: Point[];
}

export type ElectronSource =
  | { kind: "lone_pair"; entityId: string }
  | { kind: "bond"; entityId: string };

export type ElectronTarget = { kind: "atom"; entityId: string };

export interface ArrowDraft {
  id: string;
  source: ElectronSource;
  target: ElectronTarget;
  actor: Extract<Actor, "human" | "agent">;
}

export interface AcceptedArrow {
  source: ElectronSource;
  target: ElectronTarget;
}

export interface ScaffoldLevel {
  level: 1 | 2 | 3 | 4;
  title: string;
  message: string;
  focusEntityIds: string[];
  revealsAcceptedBundle: boolean;
}

export interface FeedbackCopy {
  summary: string;
  message: string;
  focusEntityIds: string[];
}

export interface BondDirectionDiagnostic extends FeedbackCopy {
  sourceBondId: string;
  incorrectTargetAtomId: string;
  code: "WRONG_LEAVING_GROUP_DIRECTION" | "WRONG_BOND_DIRECTION";
}

export interface ProblemFeedback {
  incomplete: FeedbackCopy;
  bondDirection: BondDirectionDiagnostic[];
  accepted: FeedbackCopy;
  notAccepted: FeedbackCopy;
  committedSummary: string;
  commitActivitySummary: string;
}

export interface ProblemStepDefinition {
  id: string;
  title: string;
  fromStateId: string;
  toStateId: string;
  acceptedBundles: AcceptedArrow[][];
  scaffold: ScaffoldLevel[];
  feedback: ProblemFeedback;
  negativeCases: NegativeCase[];
}

export interface NegativeCase {
  id: string;
  title: string;
  arrows: AcceptedArrow[];
  expectedClassification: Exclude<ValidationClass, "valid">;
  expectedReasonCode: ReasonCode;
}

export interface ChemistryReview {
  status: "draft" | "in_review" | "verified";
  reviewedAt?: string;
  reviewerRole?: string;
  sources: {
    title: string;
    urlOrDoi: string;
    note: string;
  }[];
  checklist: {
    atomInventory: boolean;
    bondOrders: boolean;
    lonePairs: boolean;
    formalCharges: boolean;
    netCharge: boolean;
    arrowOrigins: boolean;
    arrowDestinations: boolean;
    concertedStep: boolean;
    conditionsAndScope: boolean;
    feedbackLanguage: boolean;
    alternativesConsidered: boolean;
  };
}

export interface ProblemDefinition {
  id: string;
  title: string;
  reactionFamily: "SN2" | "proton_transfer" | "SN2_proton_transfer";
  difficulty: 1 | 2 | 3;
  stepCount: number;
  prompt: string;
  objective: string;
  contextNote: string;
  currentStateId: string;
  completedStateId: string;
  states: Record<string, MoleculeState>;
  steps: ProblemStepDefinition[];
  review: ChemistryReview;
}

export type ValidationClass =
  | "valid"
  | "incomplete"
  | "invalid_invariant"
  | "not_accepted_path"
  | "invalid_input";

export type ReasonCode =
  | "SOURCE_HAS_NO_ELECTRON_PAIR"
  | "DUPLICATE_ELECTRON_SOURCE"
  | "TARGET_NOT_SUPPORTED"
  | "SELF_BOND_ATTEMPT"
  | "NEGATIVE_BOND_ORDER"
  | "VALENCE_EXCEEDED"
  | "NET_CHARGE_NOT_CONSERVED"
  | "INCOMPLETE_CONCERTED_STEP"
  | "WRONG_REACTION_CENTER"
  | "WRONG_LEAVING_GROUP_DIRECTION"
  | "WRONG_BOND_DIRECTION"
  | "NOT_IN_AUTHORED_PATH"
  | "VALID_ACCEPTED_STEP"
  | "STALE_STATE"
  | "STALE_VALIDATION"
  | "EMPTY_DRAFT";

export interface ValidationIssue {
  code: ReasonCode;
  message: string;
  focusEntityIds: string[];
}

export interface ValidationResult {
  validationId: string;
  classification: ValidationClass;
  summary: string;
  issues: ValidationIssue[];
  nextStateId: string | null;
  problemId: string;
  stateId: string;
  mechanismRevision: number;
  draftSignature: string;
}

export interface ActivityEvent {
  id: string;
  sequence: number;
  actor: Actor;
  kind:
    | "arrow_added"
    | "arrow_removed"
    | "draft_cleared"
    | "step_checked"
    | "step_committed"
    | "commit_undone"
    | "scaffold_requested"
    | "entities_focused"
    | "problem_switched"
    | "problem_reset"
    | "history_state_viewed";
  summary: string;
  entityIds: string[];
  timestamp: string;
  outcome?: "neutral" | "success" | "warning" | "error";
}

export interface CommitRecord {
  id: string;
  fromStateId: string;
  toStateId: string;
  arrowBundle: ArrowDraft[];
  validationId: string;
  actor: Extract<Actor, "human" | "agent">;
  committedAt: string;
  undoneAt: string | null;
}

export interface SelectionState {
  source: ElectronSource | null;
}

export interface MechanismState {
  problemId: string;
  currentStateId: string;
  draftArrows: ArrowDraft[];
  selection: SelectionState;
  latestValidation: ValidationResult | null;
  mechanismRevision: number;
  activitySequence: number;
  activity: ActivityEvent[];
  history: CommitRecord[];
  historyViewStateId: string | null;
  focusEntityIds: string[];
  highestScaffoldLevel: 0 | 1 | 2 | 3 | 4;
  visibleScaffoldLevel: 0 | 1 | 2 | 3 | 4;
  attemptCount: number;
  hintCount: number;
  hydrated: boolean;
}

export interface CommandResult<T = undefined> {
  ok: boolean;
  value?: T;
  error?: {
    code: ReasonCode;
    message: string;
  };
}
