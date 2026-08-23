/**
 * Converts React Flow's node/edge shape into the plain graph shape the
 * shared, framework-agnostic validator (and later, the backend) understands.
 */
export function toSharedGraph(nodes, edges) {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      label: n.data.label,
      config: n.data.config,
      position: n.position,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
    })),
  };
}
