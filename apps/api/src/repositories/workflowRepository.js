import { prisma } from "../db/prisma.js";

const STATUS_TO_DB = { draft: "DRAFT", active: "ACTIVE", inactive: "INACTIVE" };
const STATUS_FROM_DB = { DRAFT: "draft", ACTIVE: "active", INACTIVE: "inactive" };

function toPublicWorkflow(row, graph) {
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    description: row.description,
    status: STATUS_FROM_DB[row.status],
    version: row.currentVersion,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    graph,
  };
}

/**
 * Replaces the workflow's current node/edge set with the incoming graph and
 * records an immutable version snapshot. Simplest-correct approach: full
 * replace inside a transaction rather than diffing node-by-node — workflow
 * graphs are small, so this is cheap and impossible to get subtly wrong.
 */
export async function upsertWorkflowGraph({ id, workspaceId, name, description, status, graph }) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.workflow.findUnique({ where: { id } });
    const nextVersion = existing ? existing.currentVersion + 1 : 1;

    const workflow = await tx.workflow.upsert({
      where: { id },
      create: {
        id,
        workspaceId,
        name,
        description: description ?? "",
        status: STATUS_TO_DB[status] ?? "DRAFT",
        currentVersion: nextVersion,
      },
      update: {
        name,
        description: description ?? "",
        status: STATUS_TO_DB[status] ?? "DRAFT",
        currentVersion: nextVersion,
      },
    });

    await tx.workflowNode.deleteMany({ where: { workflowId: id } });
    await tx.workflowEdge.deleteMany({ where: { workflowId: id } });

    if (graph.nodes.length > 0) {
      await tx.workflowNode.createMany({
        data: graph.nodes.map((node) => ({
          workflowId: id,
          nodeKey: node.id,
          type: node.type,
          label: node.label,
          positionX: node.position?.x ?? 0,
          positionY: node.position?.y ?? 0,
          config: node.config ?? {},
        })),
      });
    }

    if (graph.edges.length > 0) {
      await tx.workflowEdge.createMany({
        data: graph.edges.map((edge) => ({
          workflowId: id,
          edgeKey: edge.id,
          sourceNodeKey: edge.source,
          targetNodeKey: edge.target,
          sourceHandle: edge.sourceHandle ?? null,
        })),
      });
    }

    await tx.workflowVersion.create({
      data: { workflowId: id, version: nextVersion, graph },
    });

    return toPublicWorkflow(workflow, graph);
  });
}

export async function getWorkflowWithGraph(id) {
  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: { nodes: true, edges: true },
  });
  if (!workflow) return null;

  const graph = {
    nodes: workflow.nodes.map((n) => ({
      id: n.nodeKey,
      type: n.type,
      label: n.label,
      position: { x: n.positionX, y: n.positionY },
      config: n.config,
    })),
    edges: workflow.edges.map((e) => ({
      id: e.edgeKey,
      source: e.sourceNodeKey,
      target: e.targetNodeKey,
      sourceHandle: e.sourceHandle,
    })),
  };

  return toPublicWorkflow(workflow, graph);
}

export async function listWorkflowsByWorkspace(workspaceId) {
  const rows = await prisma.workflow.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => toPublicWorkflow(row, null));
}

export async function deleteWorkflowById(id) {
  await prisma.workflow.delete({ where: { id } });
}
