import { upsertWorkflowSchema } from "../validators/workflowValidators.js";
import {
  saveWorkflow,
  getWorkflow,
  listWorkflows,
  deleteWorkflow,
  WorkflowNotFoundError,
} from "../services/workflowService.js";

export async function upsert(request, reply) {
  const parsed = upsertWorkflowSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }
  const workflow = await saveWorkflow({ ...parsed.data, id: request.params.id });
  return reply.send({ workflow });
}

export async function get(request, reply) {
  try {
    const workflow = await getWorkflow(request.params.id);
    return reply.send({ workflow });
  } catch (error) {
    if (error instanceof WorkflowNotFoundError) {
      return reply.code(404).send({ error: error.message });
    }
    throw error;
  }
}

export async function list(_request, reply) {
  const workflows = await listWorkflows();
  return reply.send({ workflows });
}

export async function remove(request, reply) {
  await deleteWorkflow(request.params.id);
  return reply.code(204).send();
}
