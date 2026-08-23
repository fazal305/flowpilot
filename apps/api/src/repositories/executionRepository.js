import { prisma } from "../db/prisma.js";

export function createPendingExecution(workflowId, triggeredBy) {
  return prisma.workflowExecution.create({
    data: { workflowId, status: "PENDING", triggeredBy: triggeredBy.toUpperCase() },
  });
}

export function getExecutionWithDetail(id) {
  return prisma.workflowExecution.findUnique({
    where: { id },
    include: {
      nodeExecutions: { orderBy: { startedAt: "asc" } },
      logs: { orderBy: { createdAt: "asc" } },
    },
  });
}

export function listExecutionsForWorkflow(workflowId) {
  return prisma.workflowExecution.findMany({
    where: { workflowId },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
}
