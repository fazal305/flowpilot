import {
  upsertWorkflowGraph,
  getWorkflowWithGraph,
  listWorkflowsByWorkspace,
  deleteWorkflowById,
} from "../repositories/workflowRepository.js";
import { getDefaultWorkspaceId } from "../repositories/workspaceRepository.js";

export class WorkflowNotFoundError extends Error {
  constructor(id) {
    super(`Workflow ${id} not found.`);
    this.name = "WorkflowNotFoundError";
  }
}

export async function saveWorkflow(payload) {
  const workspaceId = await getDefaultWorkspaceId();
  return upsertWorkflowGraph({ ...payload, workspaceId });
}

export async function getWorkflow(id) {
  const workflow = await getWorkflowWithGraph(id);
  if (!workflow) throw new WorkflowNotFoundError(id);
  return workflow;
}

export async function listWorkflows() {
  const workspaceId = await getDefaultWorkspaceId();
  return listWorkflowsByWorkspace(workspaceId);
}

export async function deleteWorkflow(id) {
  await deleteWorkflowById(id);
}
