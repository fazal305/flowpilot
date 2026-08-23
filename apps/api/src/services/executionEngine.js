import { validateGraph } from "@flowpilot/shared";
import { prisma } from "../db/prisma.js";
import { getWorkflow } from "./workflowService.js";
import { getDefaultWorkspaceId } from "../repositories/workspaceRepository.js";
import { buildAdjacency, findTriggerNodes, nextNodeIds, descendantsOf } from "./graphParser.js";
import { runNode } from "./nodeRunner.js";
import { broadcast } from "../realtime/executionHub.js";

/** WS messages are deliberately just a "something changed, refetch" signal —
 * not a full state payload — so the REST endpoint (already correct, already
 * tested) stays the single source of truth for execution shape. Duplicating
 * that serialization over the socket would just be two places to keep in
 * sync for no real benefit over one cheap refetch. */
function notify(executionId, type) {
  broadcast(executionId, { type, executionId });
}

function inputForNode(node, outputs, edges) {
  const incoming = edges.filter((e) => e.target === node.id);
  if (incoming.length === 0) return null;
  if (incoming.length === 1) return outputs.get(incoming[0].source) ?? null;
  // Multiple incoming edges (a merge point) is an unusual, unsupported shape
  // for the MVP — expose each upstream output keyed by source id rather than
  // silently picking one.
  const merged = {};
  for (const edge of incoming) merged[edge.source] = outputs.get(edge.source) ?? null;
  return merged;
}

async function log(executionId, level, message, nodeKey = null) {
  await prisma.executionLog.create({ data: { executionId, level, message, nodeKey } });
}

/**
 * Runs a workflow: validates the graph, walks it breadth-first from its
 * trigger node(s), and for each node runs its executor, records a
 * NodeExecution row, and decides which node(s) run next. A condition node's
 * untaken branch (and everything only reachable through it) is recorded as
 * SKIPPED rather than silently absent, so the inspector can show the whole
 * shape of the run.
 */
export async function runExecution({ executionId, workflowId, triggeredBy }) {
  const workflow = await getWorkflow(workflowId);
  const issues = validateGraph(workflow.graph);
  const errors = issues.filter((i) => i.level === "error");

  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: { status: "RUNNING" },
  });
  notify(executionId, "execution:updated");

  if (errors.length > 0) {
    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status: "FAILED", finishedAt: new Date(), durationMs: 0 },
    });
    await log(executionId, "ERROR", `Blocked before running: ${errors.map((e) => e.message).join("; ")}`);
    notify(executionId, "execution:finished");
    return executionId;
  }

  const workspaceId = await getDefaultWorkspaceId();
  const adjacency = buildAdjacency(workflow.graph.edges);
  const nodesById = new Map(workflow.graph.nodes.map((n) => [n.id, n]));
  const outputs = new Map();
  const visited = new Set();
  const skipped = new Set();
  let hasFailure = false;

  const queue = findTriggerNodes(workflow.graph.nodes).map((n) => n.id);
  const startedAt = Date.now();
  await log(executionId, "INFO", `Execution started (${triggeredBy}).`);

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (visited.has(nodeId) || skipped.has(nodeId)) continue;
    visited.add(nodeId);

    const node = nodesById.get(nodeId);
    if (!node) continue;

    const input = inputForNode(node, outputs, workflow.graph.edges);
    const nodeExecution = await prisma.nodeExecution.create({
      data: {
        executionId,
        nodeKey: node.id,
        nodeType: node.type,
        status: "RUNNING",
        input,
        startedAt: new Date(),
      },
    });
    notify(executionId, "node:started");

    const nodeStart = Date.now();
    try {
      const { output, retryCount } = await runNode(node, input, {
        workspaceId,
        executionId,
      });
      outputs.set(node.id, output);

      await prisma.nodeExecution.update({
        where: { id: nodeExecution.id },
        data: {
          status: "SUCCESS",
          output,
          retryCount,
          finishedAt: new Date(),
          durationMs: Date.now() - nodeStart,
        },
      });
      notify(executionId, "node:finished");
      await log(executionId, "INFO", `${node.label} succeeded in ${Date.now() - nodeStart}ms.`, node.id);

      for (const nextId of nextNodeIds(node, output, adjacency)) queue.push(nextId);

      if (node.type === "condition") {
        const skippedHandle = output.result ? "false" : "true";
        const skippedEdges = (adjacency.get(node.id) ?? []).filter((e) => e.sourceHandle === skippedHandle);
        for (const edge of skippedEdges) {
          const branch = descendantsOf(edge.target, adjacency);
          branch.add(edge.target);
          for (const id of branch) {
            if (!visited.has(id)) skipped.add(id);
          }
        }
      }
    } catch (error) {
      hasFailure = true;
      await prisma.nodeExecution.update({
        where: { id: nodeExecution.id },
        data: {
          status: "FAILED",
          errorType: error.name ?? "Error",
          errorMessage: error.message,
          retryCount: error.retryCount ?? 0,
          finishedAt: new Date(),
          durationMs: Date.now() - nodeStart,
        },
      });
      notify(executionId, "node:finished");
      await log(executionId, "ERROR", `${node.label} failed: ${error.message}`, node.id);
      // Nothing downstream gets queued — a failed node's descendants simply
      // never run (they don't get a SKIPPED record either, since "we never
      // got there" reads clearer in the inspector than a manufactured skip).
    }
  }

  for (const id of skipped) {
    const node = nodesById.get(id);
    if (!node) continue;
    await prisma.nodeExecution.create({
      data: { executionId, nodeKey: node.id, nodeType: node.type, status: "SKIPPED" },
    });
  }

  const durationMs = Date.now() - startedAt;
  await prisma.workflowExecution.update({
    where: { id: executionId },
    data: { status: hasFailure ? "FAILED" : "SUCCESS", finishedAt: new Date(), durationMs },
  });
  await log(executionId, "INFO", `Execution finished (${hasFailure ? "failed" : "success"}) in ${durationMs}ms.`);
  notify(executionId, "execution:finished");

  return executionId;
}
