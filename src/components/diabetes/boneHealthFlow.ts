import flowJson from "@/data/bone-health-app-flow.json";

export type PopulationGroup = "younger" | "older" | null;
export type ProvisionalRisk = "low" | "high" | "very_high" | null;

export interface FlowState {
  group: PopulationGroup;
  secondary: boolean;
  treated: boolean;
  initial: ProvisionalRisk;
}

export interface HistorySnapshot {
  nodeId: string;
  state: FlowState;
}

export interface FlowSession {
  nodeId: string;
  state: FlowState;
  history: HistorySnapshot[];
}

export interface FlowOption {
  id: string;
  label: string;
  next_node_id: string;
  set_state: Partial<FlowState>;
}

export interface FlowVariant {
  when: unknown;
  title: string;
  body: string[];
  options: FlowOption[];
}

export interface FlowNode {
  id: string;
  type: string;
  variants: FlowVariant[];
}

export interface BoneHealthFlow {
  algorithm_version: string;
  title: string;
  purpose: string;
  clinical_validation_status: string;
  start_node_id: string;
  initial_state: FlowState;
  global_actions: Array<{ id: string; label: string; next_node_id?: string }>;
  nodes: FlowNode[];
  provenance: {
    baseline: string;
    supplement: string;
    sources: Array<{ title: string; url: string }>;
  };
  safety_rules: string[];
}

export type FlowErrorCode =
  | "invalid_state"
  | "missing_node"
  | "variant_mismatch"
  | "unknown_option"
  | "invalid_condition"
  | "history_empty";

export class FlowError extends Error {
  readonly code: FlowErrorCode;

  constructor(code: FlowErrorCode, message: string) {
    super(message);
    this.name = "FlowError";
    this.code = code;
  }
}

export const boneHealthFlow = flowJson as BoneHealthFlow;

const POPULATION = new Set<PopulationGroup>([null, "younger", "older"]);
const PROVISIONAL = new Set<ProvisionalRisk>([null, "low", "high", "very_high"]);
const STATE_FIELDS = new Set(["group", "secondary", "treated", "initial"]);

const nodesById = new Map(boneHealthFlow.nodes.map((node) => [node.id, node]));

export const BONE_HEALTH_TITLE = boneHealthFlow.title;
export const BONE_HEALTH_VERSION = boneHealthFlow.algorithm_version;
export const BONE_HEALTH_PURPOSE = boneHealthFlow.purpose;
export const BONE_HEALTH_VALIDATION = boneHealthFlow.clinical_validation_status;
export const BONE_HEALTH_SAFETY_RULES = boneHealthFlow.safety_rules;
export const BONE_HEALTH_SOURCES = boneHealthFlow.provenance.sources;
export const BONE_HEALTH_PROVENANCE = {
  baseline: boneHealthFlow.provenance.baseline,
  supplement: boneHealthFlow.provenance.supplement,
};

function cloneState(state: FlowState): FlowState {
  return {
    group: state.group,
    secondary: state.secondary,
    treated: state.treated,
    initial: state.initial,
  };
}

export function assertValidState(state: FlowState): FlowState {
  const record = state as unknown as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!STATE_FIELDS.has(key)) {
      throw new FlowError("invalid_state", `Unknown state field "${key}".`);
    }
  }
  if (!POPULATION.has(state.group)) {
    throw new FlowError("invalid_state", "Population group is not a recognised value.");
  }
  if (typeof state.secondary !== "boolean" || typeof state.treated !== "boolean") {
    throw new FlowError("invalid_state", "Secondary and treatment context must be true or false.");
  }
  if (!PROVISIONAL.has(state.initial)) {
    throw new FlowError(
      "invalid_state",
      "Provisional risk is not a recognised clinician selection. It was not defaulted to low.",
    );
  }
  return cloneState(state);
}

function readInitialState(): FlowState {
  return assertValidState(boneHealthFlow.initial_state);
}

export function matchesCondition(condition: unknown, state: FlowState): boolean {
  if (condition === null || typeof condition !== "object" || Array.isArray(condition)) {
    throw new FlowError("invalid_condition", "A screen condition must be an object.");
  }
  const record = condition as Record<string, unknown>;
  const keys = Object.keys(record);

  if (keys.length === 1 && keys[0] === "always") {
    return record.always === true;
  }
  if (keys.length === 1 && keys[0] === "all") {
    if (!Array.isArray(record.all)) {
      throw new FlowError("invalid_condition", "An 'all' condition must list nested conditions.");
    }
    return record.all.every((nested) => matchesCondition(nested, state));
  }
  if (keys.length === 1 && keys[0] === "any") {
    if (!Array.isArray(record.any)) {
      throw new FlowError("invalid_condition", "An 'any' condition must list nested conditions.");
    }
    return record.any.some((nested) => matchesCondition(nested, state));
  }
  if (keys.length === 2 && keys.includes("field") && keys.includes("equals")) {
    const field = record.field;
    if (typeof field !== "string" || !STATE_FIELDS.has(field)) {
      throw new FlowError("invalid_condition", "A field condition names an unknown state field.");
    }
    return state[field as keyof FlowState] === record.equals;
  }
  throw new FlowError("invalid_condition", "Screen condition uses an unsupported operator.");
}

export function selectMatchingVariant(variants: FlowVariant[], state: FlowState): FlowVariant {
  const matches = variants.filter((variant) => matchesCondition(variant.when, state));
  if (matches.length !== 1) {
    throw new FlowError(
      "variant_mismatch",
      `Expected one matching screen variant and found ${matches.length}. Risk was not defaulted.`,
    );
  }
  return matches[0];
}

export interface RenderedScreen {
  nodeId: string;
  nodeType: string;
  title: string;
  body: string[];
  options: FlowOption[];
  terminal: boolean;
}

export function renderScreen(session: FlowSession): RenderedScreen {
  assertValidState(session.state);
  const node = nodesById.get(session.nodeId);
  if (!node) {
    throw new FlowError("missing_node", `Screen "${session.nodeId}" is not in the bone-health flow.`);
  }
  const variant = selectMatchingVariant(node.variants, session.state);
  return {
    nodeId: node.id,
    nodeType: node.type,
    title: variant.title,
    body: variant.body,
    options: variant.options,
    terminal: variant.options.length === 0,
  };
}

export function createSession(): FlowSession {
  const startId = boneHealthFlow.start_node_id;
  const session: FlowSession = {
    nodeId: startId,
    state: readInitialState(),
    history: [],
  };
  renderScreen(session);
  return session;
}

function mergeState(base: FlowState, patch: Partial<FlowState> | undefined): FlowState {
  const next = cloneState(base);
  if (!patch) return next;
  const record = patch as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!STATE_FIELDS.has(key)) {
      throw new FlowError("invalid_state", `Unknown state field "${key}".`);
    }
  }
  if ("group" in patch) next.group = patch.group ?? null;
  if ("secondary" in patch) next.secondary = patch.secondary as boolean;
  if ("treated" in patch) next.treated = patch.treated as boolean;
  if ("initial" in patch) next.initial = patch.initial ?? null;
  return assertValidState(next);
}

function commit(session: FlowSession, nextNodeId: string, nextState: FlowState): FlowSession {
  const next: FlowSession = {
    nodeId: nextNodeId,
    state: nextState,
    history: [...session.history, { nodeId: session.nodeId, state: cloneState(session.state) }],
  };
  renderScreen(next);
  return next;
}

export function selectOption(session: FlowSession, optionId: string): FlowSession {
  const screen = renderScreen(session);
  const option = screen.options.find((item) => item.id === optionId);
  if (!option) {
    throw new FlowError("unknown_option", "That choice is not on the current screen.");
  }
  if (!nodesById.has(option.next_node_id)) {
    throw new FlowError("missing_node", `Screen "${option.next_node_id}" is not in the bone-health flow.`);
  }
  return commit(session, option.next_node_id, mergeState(session.state, option.set_state));
}

export function goBack(session: FlowSession): FlowSession {
  const previous = session.history[session.history.length - 1];
  if (!previous) {
    throw new FlowError("history_empty", "There is no earlier screen to restore.");
  }
  const restored: FlowSession = {
    nodeId: previous.nodeId,
    state: cloneState(previous.state),
    history: session.history.slice(0, -1),
  };
  renderScreen(restored);
  return restored;
}

export function restartSession(): FlowSession {
  return createSession();
}

export function openUrgent(session: FlowSession): FlowSession {
  const urgent = boneHealthFlow.global_actions.find((action) => action.id === "urgent");
  const nextNodeId = urgent?.next_node_id ?? "urgent";
  if (!nodesById.has(nextNodeId)) {
    throw new FlowError("missing_node", `Screen "${nextNodeId}" is not in the bone-health flow.`);
  }
  return commit(session, nextNodeId, mergeState(session.state, {}));
}
