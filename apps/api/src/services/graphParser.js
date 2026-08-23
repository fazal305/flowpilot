/** Builds an adjacency map from each node id to its outgoing edges. */
export function buildAdjacency(edges) {
  const byNodeId = new Map();
  for (const edge of edges) {
    if (!byNodeId.has(edge.source)) byNodeId.set(edge.source, []);
    byNodeId.get(edge.source).push(edge);
  }
  return byNodeId;
}

export function findTriggerNodes(nodes) {
  return nodes.filter((n) => n.type === "webhook" || n.type === "schedule");
}

/**
 * Decides which node(s) run next given a just-finished node's output. For a
 * condition node this follows only the matching True/False edge(s) — the
 * other branch's nodes are never visited (and get marked "skipped" by the
 * engine). Every other node type just fans out to all outgoing edges.
 */
export function nextNodeIds(node, output, adjacency) {
  const outgoing = adjacency.get(node.id) ?? [];
  if (node.type === "condition") {
    const branch = output?.result ? "true" : "false";
    return outgoing.filter((e) => e.sourceHandle === branch).map((e) => e.target);
  }
  return outgoing.map((e) => e.target);
}

/** All descendants of a node, used to mark an untaken condition branch as skipped. */
export function descendantsOf(startNodeId, adjacency) {
  const visited = new Set();
  const stack = [startNodeId];
  while (stack.length > 0) {
    const current = stack.pop();
    const outgoing = adjacency.get(current) ?? [];
    for (const edge of outgoing) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        stack.push(edge.target);
      }
    }
  }
  return visited;
}
