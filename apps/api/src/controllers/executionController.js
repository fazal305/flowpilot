import { z } from "zod";
import { EXECUTION_TRIGGERS } from "@flowpilot/shared";
import {
  triggerExecution,
  getExecution,
  getExecutionHistory,
  getRecentExecutions,
  ExecutionNotFoundError,
} from "../services/executionService.js";

const triggerSchema = z.object({
  triggeredBy: z.enum(EXECUTION_TRIGGERS).default("manual"),
});

export async function trigger(request, reply) {
  const parsed = triggerSchema.safeParse(request.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }
  const executionId = await triggerExecution(request.params.id, parsed.data.triggeredBy);
  return reply.code(202).send({ executionId });
}

export async function get(request, reply) {
  try {
    const execution = await getExecution(request.params.id);
    return reply.send({ execution });
  } catch (error) {
    if (error instanceof ExecutionNotFoundError) {
      return reply.code(404).send({ error: error.message });
    }
    throw error;
  }
}

export async function history(request, reply) {
  const executions = await getExecutionHistory(request.params.id);
  return reply.send({ executions });
}

export async function listRecent(_request, reply) {
  const executions = await getRecentExecutions();
  return reply.send({ executions });
}
