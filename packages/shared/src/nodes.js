/**
 * The six MVP node types. Do not expand this list until all six are stable
 * in production — see project brief.
 */
export const NODE_TYPES = [
  "webhook",
  "schedule",
  "httpRequest",
  "condition",
  "ai",
  "notification",
];

/** @typedef {"trigger" | "logic" | "action"} NodeCategory */

/** @type {Record<string, NodeCategory>} */
export const NODE_CATEGORY_BY_TYPE = {
  webhook: "trigger",
  schedule: "trigger",
  condition: "logic",
  httpRequest: "action",
  ai: "action",
  notification: "action",
};

export const CONDITION_OPERATORS = [
  "equals",
  "notEquals",
  "greaterThan",
  "lessThan",
  "contains",
  "isEmpty",
  "isNotEmpty",
];

export const NOTIFICATION_CHANNELS = ["email", "webhookOut", "inApp"];

/**
 * Default config seeded onto a newly-created node of a given type. Used by
 * the editor when a node is dragged onto the canvas.
 * @param {string} type
 */
export function defaultConfigForType(type) {
  switch (type) {
    case "webhook":
      return { path: "", method: "POST" };
    case "schedule":
      return { cron: "*/15 * * * *", timezone: "UTC" };
    case "httpRequest":
      return {
        url: "",
        method: "GET",
        headers: {},
        body: "",
        auth: { type: "none" },
        timeoutMs: 10_000,
      };
    case "condition":
      return { field: "", operator: "equals", value: "" };
    case "ai":
      return {
        model: "openrouter/auto",
        systemPrompt: "",
        userPromptTemplate: "",
        maxTokens: 512,
        temperature: 0.3,
      };
    case "notification":
      return { channel: "inApp", target: "", messageTemplate: "" };
    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}

/**
 * @typedef {Object} WorkflowNode
 * @property {string} id
 * @property {string} type
 * @property {string} label
 * @property {{x: number, y: number}} position
 * @property {Record<string, unknown>} config
 */

/**
 * @typedef {Object} WorkflowEdge
 * @property {string} id
 * @property {string} source
 * @property {string} target
 * @property {"true" | "false" | null} [sourceHandle]
 */
