import {
  createPendingExecution,
  getExecutionWithDetail,
  listExecutionsForWorkflow,
} from "../repositories/executionRepository.js";
import { enqueueExecution } from "../queue/boss.js";

export class ExecutionNotFoundError extends Error {
  constructor(id) {
    super(`Execution ${id} not found.`);
    this.name = "ExecutionNotFoundError";
  }
}

/**
 * Creates the WorkflowExecution row synchronously so the caller gets a real
 * id back immediately (matching the "RUN #10482" pattern from the product
 * brief) — the queue worker fills it in asynchronously from there.
 */
export async function triggerExecution(workflowId, triggeredBy) {
  const execution = await createPendingExecution(workflowId, triggeredBy);
  await enqueueExecution({ executionId: execution.id, workflowId, triggeredBy });
  return execution.id;
}

export async function getExecution(id) {
  const execution = await getExecutionWithDetail(id);
  if (!execution) throw new ExecutionNotFoundError(id);
  return execution;
}

export function getExecutionHistory(workflowId) {
  return listExecutionsForWorkflow(workflowId);
}
