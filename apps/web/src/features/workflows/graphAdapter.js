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

/** The reverse of toSharedGraph — used to load a plain graph (a saved
 * workflow's record, or an AI-generated draft) into the React Flow canvas. */
export function toReactFlowGraph(sharedGraph) {
  return {
    nodes: sharedGraph.nodes.map((n) => ({
      id: n.id,
      type: "workflowNode",
      position: n.position,
      data: {
        nodeType: n.type,
        label: n.label,
        config: n.config,
        status: "idle",
      },
    })),
    edges: sharedGraph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
    })),
  };
}
