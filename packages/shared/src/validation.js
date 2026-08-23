import { NODE_CATEGORY_BY_TYPE } from "./nodes.js";

/**
 * Validates a workflow graph independent of any UI framework, so the exact
 * same rules run in the editor (instant feedback) and on the server before
 * a workflow is allowed to execute (Phase 4).
 *
 * @param {{nodes: Array<{id:string,type:string,label:string}>, edges: Array<{id:string,source:string,target:string,sourceHandle?:string|null}>}} graph
 * @returns {Array<{level: "error"|"warning", nodeId?: string, message: string}>}
 */
export function validateGraph({ nodes, edges }) {
  const issues = [];

  if (nodes.length === 0) {
    issues.push({ level: "error", message: "Workflow has no nodes yet." });
    return issues;
  }

  const hasTrigger = nodes.some(
    (n) => NODE_CATEGORY_BY_TYPE[n.type] === "trigger"
  );
  if (!hasTrigger) {
    issues.push({
      level: "error",
      message: "Add at least one trigger (Webhook or Schedule) to start this workflow.",
    });
  }

  const incomingCount = new Map();
  const outgoingByNode = new Map();
  for (const edge of edges) {
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
    if (!outgoingByNode.has(edge.source)) outgoingByNode.set(edge.source, []);
    outgoingByNode.get(edge.source).push(edge);
  }

  for (const node of nodes) {
    const category = NODE_CATEGORY_BY_TYPE[node.type];

    if (category !== "trigger" && !incomingCount.get(node.id)) {
      issues.push({
        level: "error",
        nodeId: node.id,
        message: `"${node.label}" isn't connected to anything upstream.`,
      });
    }

    if (category === "trigger" && incomingCount.get(node.id)) {
      issues.push({
        level: "warning",
        nodeId: node.id,
        message: `"${node.label}" is a trigger but has an incoming connection.`,
      });
    }

    if (node.type === "condition") {
      const outgoing = outgoingByNode.get(node.id) ?? [];
      const hasTrue = outgoing.some((e) => e.sourceHandle === "true");
      const hasFalse = outgoing.some((e) => e.sourceHandle === "false");
      if (!hasTrue && !hasFalse) {
        issues.push({
          level: "error",
          nodeId: node.id,
          message: `"${node.label}" has no branches connected.`,
        });
      } else if (!hasTrue || !hasFalse) {
        issues.push({
          level: "warning",
          nodeId: node.id,
          message: `"${node.label}" only has its ${hasTrue ? "True" : "False"} branch connected.`,
        });
      }
    }
  }

  if (hasCycle(nodes, edges)) {
    issues.push({
      level: "error",
      message: "This workflow contains a cycle, which the execution engine cannot run.",
    });
  }

  return issues;
}

function hasCycle(nodes, edges) {
  const adjacency = new Map(nodes.map((n) => [n.id, []]));
  for (const edge of edges) {
    if (adjacency.has(edge.source)) adjacency.get(edge.source).push(edge.target);
  }

  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visited.has(id)) return false;
    if (visiting.has(id)) return true;
    visiting.add(id);
    for (const next of adjacency.get(id) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  return nodes.some((node) => visit(node.id));
}
