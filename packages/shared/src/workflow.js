export const WORKFLOW_STATUSES = ["draft", "active", "inactive"];

export const EXECUTION_STATUSES = [
  "pending",
  "running",
  "success",
  "failed",
  "skipped",
];

export const EXECUTION_TRIGGERS = ["manual", "webhook", "schedule", "retry"];

/**
 * @typedef {Object} WorkflowGraph
 * @property {import("./nodes.js").WorkflowNode[]} nodes
 * @property {import("./nodes.js").WorkflowEdge[]} edges
 */

/**
 * @typedef {Object} NodeExecution
 * @property {string} id
 * @property {string} executionId
 * @property {string} nodeId
 * @property {string} nodeType
 * @property {string} status
 * @property {unknown} input
 * @property {unknown} output
 * @property {{message: string, type: string} | null} error
 * @property {number} retryCount
 * @property {string | null} startedAt
 * @property {string | null} finishedAt
 * @property {number | null} durationMs
 */

/**
 * @typedef {Object} WorkflowExecution
 * @property {string} id
 * @property {string} workflowId
 * @property {string} status
 * @property {string} triggeredBy
 * @property {string} startedAt
 * @property {string | null} finishedAt
 * @property {number | null} durationMs
 * @property {NodeExecution[]} nodeExecutions
 */
