import { test } from "node:test";
import assert from "node:assert/strict";
import { toSharedGraph, toReactFlowGraph } from "./graphAdapter.js";

const rfNodes = [
  {
    id: "n1",
    type: "workflowNode",
    position: { x: 10, y: 20 },
    data: { nodeType: "webhook", label: "Trigger", config: { path: "x", method: "POST" }, status: "idle" },
  },
];
const rfEdges = [{ id: "e1", source: "n1", target: "n1", sourceHandle: null }];

test("toSharedGraph flattens React Flow's data wrapper into the plain shape", () => {
  const shared = toSharedGraph(rfNodes, rfEdges);
  assert.deepEqual(shared.nodes[0], {
    id: "n1",
    type: "webhook",
    label: "Trigger",
    config: { path: "x", method: "POST" },
    position: { x: 10, y: 20 },
  });
  assert.deepEqual(shared.edges[0], { id: "e1", source: "n1", target: "n1", sourceHandle: null });
});

test("toReactFlowGraph re-wraps a plain graph into React Flow's node shape", () => {
  const shared = toSharedGraph(rfNodes, rfEdges);
  const rebuilt = toReactFlowGraph(shared);
  assert.equal(rebuilt.nodes[0].type, "workflowNode");
  assert.equal(rebuilt.nodes[0].data.nodeType, "webhook");
  assert.equal(rebuilt.nodes[0].data.status, "idle");
  assert.deepEqual(rebuilt.nodes[0].position, { x: 10, y: 20 });
});

test("round-tripping through both conversions preserves the meaningful shape", () => {
  const shared = toSharedGraph(rfNodes, rfEdges);
  const rebuilt = toReactFlowGraph(shared);
  const roundTripped = toSharedGraph(rebuilt.nodes, rebuilt.edges);
  assert.deepEqual(roundTripped, shared);
});

test("a missing sourceHandle normalizes to null, not undefined", () => {
  const shared = toSharedGraph([], [{ id: "e1", source: "a", target: "b" }]);
  assert.equal(shared.edges[0].sourceHandle, null);
});
