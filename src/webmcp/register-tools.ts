import { describeEntity } from "../domain/chemistry";
import type { CommandResult, ElectronSource } from "../domain/types";
import { mechanismStore, type MechanismStore } from "../store/mechanism-store";

const registeredContexts = new WeakSet<object>();
export const MECHANISM_TOOL_COUNT = 12;

interface ToolFailure {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  mechanismRevision?: number;
}

function dispatchStatus(status: "ready" | "manual" | "error"): void {
  if (typeof document === "undefined") return;
  document.dispatchEvent(
    new CustomEvent("mechanism-canvas:webmcp-status", { detail: status }),
  );
}

function toolError(code: string, message: string, revision?: number): ToolFailure {
  return {
    ok: false,
    error: { code, message },
    ...(revision === undefined ? {} : { mechanismRevision: revision }),
  };
}

function toObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Tool input must be an object.");
  }
  return input as Record<string, unknown>;
}

function assertExactKeys(input: Record<string, unknown>, allowed: string[]): void {
  const unexpected = Object.keys(input).find((key) => !allowed.includes(key));
  if (unexpected) throw new Error(`Unexpected input property: ${unexpected}.`);
}

function requiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${key} must be a non-empty string.`);
  }
  return value;
}

function requiredInteger(input: Record<string, unknown>, key: string): number {
  const value = input[key];
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${key} must be a non-negative integer.`);
  }
  return value;
}

function optionalInteger(
  input: Record<string, unknown>,
  key: string,
  fallback: number,
  maximum: number,
): number {
  const value = input[key];
  if (value === undefined) return fallback;
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > maximum
  ) {
    throw new Error(`${key} must be an integer from 0 to ${maximum}.`);
  }
  return value;
}

function requiredStringArray(input: Record<string, unknown>, key: string): string[] {
  const value = input[key];
  if (
    !Array.isArray(value) ||
    value.length > 20 ||
    value.some((item) => typeof item !== "string" || item.trim() === "")
  ) {
    throw new Error(`${key} must be an array of at most 20 non-empty strings.`);
  }
  return value as string[];
}

function commandOutput<T>(store: MechanismStore, result: CommandResult<T>) {
  if (!result.ok) {
    return toolError(
      result.error?.code ?? "COMMAND_FAILED",
      result.error?.message ?? "The command failed.",
      store.getState().mechanismRevision,
    );
  }
  return {
    ok: true,
    mechanismRevision: store.getState().mechanismRevision,
    currentStateId: store.getState().currentStateId,
    draftArrowCount: store.getState().draftArrows.length,
  };
}

function stateOutput(store: MechanismStore) {
  const state = store.getState();
  const problem = store.getProblem();
  const molecule = problem.states[state.currentStateId];
  return {
    ok: true,
    problem: {
      id: problem.id,
      title: problem.title,
      reactionFamily: problem.reactionFamily,
      prompt: problem.prompt,
      objective: problem.objective,
      reviewStatus: problem.review.status,
    },
    availableProblems: store.getProblems().map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      reactionFamily: candidate.reactionFamily,
      objective: candidate.objective,
      difficulty: candidate.difficulty,
      stepCount: candidate.stepCount,
      reviewStatus: candidate.review.status,
    })),
    mechanism: {
      currentStateId: state.currentStateId,
      currentStateLabel: molecule.label,
      complete: state.currentStateId === problem.completedStateId,
      mechanismRevision: state.mechanismRevision,
      draftArrows: state.draftArrows.map((arrow) => ({ ...arrow })),
      latestValidation: state.latestValidation ? { ...state.latestValidation } : null,
      highestScaffoldLevel: state.highestScaffoldLevel,
      attemptCount: state.attemptCount,
      hintCount: state.hintCount,
      activeCommitCount: state.history.filter((record) => record.undoneAt === null).length,
      activitySequence: state.activitySequence,
    },
    entities: {
      atomIds: molecule.atoms.map((atom) => atom.id),
      bondIds: molecule.bonds.map((bond) => bond.id),
      lonePairIds: molecule.lonePairSites.map((site) => site.id),
    },
  };
}

function defineTools(store: MechanismStore): WebMcpToolDefinition[] {
  return [
    {
      name: "get_mechanism_state",
      description:
        "Read the current Mechanism Canvas problem, committed state, draft arrows, validation status, revision, and stable entity IDs. This does not change the page.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        const parsed = toObject(input);
        assertExactKeys(parsed, []);
        return stateOutput(store);
      },
    },
    {
      name: "inspect_mechanism_entities",
      description:
        "Read chemistry details for specific stable atom, bond, or lone-pair IDs in the current structure. This does not focus or change the page.",
      inputSchema: {
        type: "object",
        properties: {
          entityIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 20,
          },
        },
        required: ["entityIds"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["entityIds"]);
          const entityIds = requiredStringArray(parsed, "entityIds");
          const mechanism = store.getState();
          const molecule = store.getProblem().states[mechanism.currentStateId];
          const entities = entityIds.map((entityId) => {
            const atom = molecule.atoms.find((candidate) => candidate.id === entityId);
            if (atom) return { kind: "atom", ...atom };
            const bond = molecule.bonds.find((candidate) => candidate.id === entityId);
            if (bond) return { kind: "bond", ...bond, description: describeEntity(molecule, entityId) };
            const lonePair = molecule.lonePairSites.find((candidate) => candidate.id === entityId);
            if (lonePair) {
              return {
                kind: "lone_pair",
                ...lonePair,
                description: describeEntity(molecule, entityId),
              };
            }
            return { kind: "missing", id: entityId };
          });
          return { ok: true, mechanismRevision: mechanism.mechanismRevision, entities };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "get_activity_trail",
      description:
        "Read the shared human, agent, and validator activity trail for the active exercise. Use afterSequence for incremental reads. This does not change the page.",
      inputSchema: {
        type: "object",
        properties: {
          afterSequence: { type: "integer", minimum: 0, default: 0 },
          limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["afterSequence", "limit"]);
          const afterSequence = optionalInteger(parsed, "afterSequence", 0, Number.MAX_SAFE_INTEGER);
          const limit = optionalInteger(parsed, "limit", 20, 50);
          if (limit < 1) throw new Error("limit must be an integer from 1 to 50.");
          const state = store.getState();
          const unread = state.activity.filter((event) => event.sequence > afterSequence);
          const events = unread.slice(0, limit).map((event) => ({
            ...event,
            entityIds: [...event.entityIds],
          }));
          return {
            ok: true,
            problemId: store.getProblem().id,
            mechanismRevision: state.mechanismRevision,
            latestSequence: state.activitySequence,
            events,
            hasMore: unread.length > events.length,
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "focus_mechanism_entities",
      description:
        "Visually focus stable entity IDs in the open Mechanism Canvas and append an agent action to the shared activity trail. This changes page focus only, not chemistry.",
      inputSchema: {
        type: "object",
        properties: {
          entityIds: { type: "array", items: { type: "string" }, maxItems: 20 },
        },
        required: ["entityIds"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["entityIds"]);
          const entityIds = requiredStringArray(parsed, "entityIds");
          return commandOutput(store, store.focusEntities(entityIds, "agent"));
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "add_draft_arrow",
      description:
        "Add one agent-authored curved arrow to the visible draft and shared activity trail. This changes the draft, invalidates any prior check, and increments the mechanism revision; it does not commit chemistry.",
      inputSchema: {
        type: "object",
        properties: {
          sourceType: { type: "string", enum: ["lone_pair", "bond"] },
          sourceEntityId: { type: "string" },
          targetAtomId: { type: "string" },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["sourceType", "sourceEntityId", "targetAtomId", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["sourceType", "sourceEntityId", "targetAtomId", "expectedRevision"]);
          const sourceType = requiredString(parsed, "sourceType");
          if (sourceType !== "lone_pair" && sourceType !== "bond") {
            throw new Error("sourceType must be lone_pair or bond.");
          }
          const source: ElectronSource = {
            kind: sourceType,
            entityId: requiredString(parsed, "sourceEntityId"),
          };
          const result = store.addDraftArrow({
            source,
            target: { kind: "atom", entityId: requiredString(parsed, "targetAtomId") },
            expectedRevision: requiredInteger(parsed, "expectedRevision"),
            actor: "agent",
          });
          if (!result.ok) return commandOutput(store, result);
          return {
            ...commandOutput(store, { ok: true }),
            addedArrow: result.value,
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "remove_draft_arrow",
      description:
        "Remove one visible draft arrow by ID and append an agent action to the shared trail. This invalidates any prior check and increments the mechanism revision.",
      inputSchema: {
        type: "object",
        properties: {
          arrowId: { type: "string" },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["arrowId", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["arrowId", "expectedRevision"]);
          return commandOutput(
            store,
            store.removeDraftArrow(
              requiredString(parsed, "arrowId"),
              "agent",
              requiredInteger(parsed, "expectedRevision"),
            ),
          );
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "check_draft_step",
      description:
        "Run the deterministic chemistry validator on the complete visible draft. This records a check and returns a revision-bound validation ID, but does not commit the mechanism.",
      inputSchema: {
        type: "object",
        properties: { expectedRevision: { type: "integer", minimum: 0 } },
        required: ["expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["expectedRevision"]);
          const result = store.checkDraftStep("agent", requiredInteger(parsed, "expectedRevision"));
          if (!result.ok) return commandOutput(store, result);
          return {
            ok: true,
            mechanismRevision: store.getState().mechanismRevision,
            validation: result.value,
            commitAvailable: result.value?.classification === "valid",
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "request_scaffold",
      description:
        "Open one authored scaffold level from 1 to 4, focus its related entities, and record an agent hint request. Level 4 reveals a non-mutating preview of the accepted arrow bundle.",
      inputSchema: {
        type: "object",
        properties: { level: { type: "integer", minimum: 1, maximum: 4 } },
        required: ["level"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["level"]);
          const level = requiredInteger(parsed, "level");
          if (level < 1 || level > 4) throw new Error("level must be an integer from 1 to 4.");
          const result = store.requestScaffold(level as 1 | 2 | 3 | 4, "agent");
          if (!result.ok) return commandOutput(store, result);
          return {
            ok: true,
            mechanismRevision: store.getState().mechanismRevision,
            scaffold: result.value,
          };
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "commit_checked_step",
      description:
        "Commit a currently valid, revision-bound checked arrow bundle to the visible product state. This is an explicit chemistry mutation, adds a reversible history record, and clears the draft.",
      inputSchema: {
        type: "object",
        properties: {
          validationId: { type: "string" },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["validationId", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["validationId", "expectedRevision"]);
          return commandOutput(
            store,
            store.commitCheckedStep(
              requiredString(parsed, "validationId"),
              "agent",
              requiredInteger(parsed, "expectedRevision"),
            ),
          );
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "undo_last_commit",
      description:
        "Undo the most recent active committed mechanism step, restore its previous structure, and append a reversal to the shared history. This changes visible chemistry but is itself reversible by drafting again.",
      inputSchema: {
        type: "object",
        properties: { expectedRevision: { type: "integer", minimum: 0 } },
        required: ["expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["expectedRevision"]);
          return commandOutput(
            store,
            store.undoLastCommit("agent", requiredInteger(parsed, "expectedRevision")),
          );
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "switch_problem",
      description:
        "Switch the visible Mechanism Canvas to another problem ID listed by get_mechanism_state. Each problem keeps its own local progress, any validation approval is dropped, and the shared activity trail records the switch.",
      inputSchema: {
        type: "object",
        properties: {
          problemId: { type: "string" },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["problemId", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["problemId", "expectedRevision"]);
          return commandOutput(
            store,
            store.switchProblem(
              requiredString(parsed, "problemId"),
              "agent",
              requiredInteger(parsed, "expectedRevision"),
            ),
          );
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
    {
      name: "reset_active_exercise",
      description:
        "Reset the active exercise to its authored reactants and erase its draft, validation, commit history, hints, and prior activity. Use only after the learner explicitly asks to reset. Requires confirmReset true and the current revision.",
      inputSchema: {
        type: "object",
        properties: {
          confirmReset: { type: "boolean", const: true },
          expectedRevision: { type: "integer", minimum: 0 },
        },
        required: ["confirmReset", "expectedRevision"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
      execute: async (input) => {
        try {
          const parsed = toObject(input);
          assertExactKeys(parsed, ["confirmReset", "expectedRevision"]);
          if (parsed.confirmReset !== true) {
            throw new Error("confirmReset must be true after the learner explicitly requests a reset.");
          }
          return commandOutput(
            store,
            store.resetProblem("agent", requiredInteger(parsed, "expectedRevision")),
          );
        } catch (error) {
          return toolError("INVALID_INPUT", (error as Error).message, store.getState().mechanismRevision);
        }
      },
    },
  ];
}

export async function registerMechanismCanvasTools(
  store: MechanismStore = mechanismStore,
  context: WebMcpModelContext | undefined =
    typeof document === "undefined" ? undefined : document.modelContext,
): Promise<number> {
  if (!context || typeof context.registerTool !== "function") {
    dispatchStatus("manual");
    return 0;
  }
  if (registeredContexts.has(context)) {
    dispatchStatus("ready");
    return MECHANISM_TOOL_COUNT;
  }

  try {
    const tools = defineTools(store);
    for (const tool of tools) {
      await context.registerTool(tool);
    }
    registeredContexts.add(context);
    dispatchStatus("ready");
    return tools.length;
  } catch (error) {
    console.error("Mechanism Canvas could not register WebMCP tools.", error);
    dispatchStatus("error");
    return 0;
  }
}
