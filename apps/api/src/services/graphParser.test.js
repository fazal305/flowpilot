import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAdjacency, findTriggerNodes, nextNodeIds, descendantsOf } from "./graphParser.js";

function edge(id, source, target, sourceHandle = null) {
  return { id, source, target, sourceHandle };
}

test("buildAdjacency groups edges by source node", () => {
  const adjacency = buildAdjacency([edge("e1", "a", "b"), edge("e2", "a", "c"), edge("e3", "b", "c")]);
  assert.equal(adjacency.get("a").length, 2);
  assert.equal(adjacency.get("b").length, 1);
  assert.equal(adjacency.get("c"), undefined);
});

test("findTriggerNodes only returns webhook and schedule nodes", () => {
  const nodes = [
    { id: "1", type: "webhook" },
    { id: "2", type: "schedule" },
    { id: "3", type: "httpRequest" },
    { id: "4", type: "condition" },
  ];
  const triggers = findTriggerNodes(nodes);
  assert.deepEqual(triggers.map((n) => n.id), ["1", "2"]);
});

test("nextNodeIds fans out to every outgoing edge for a non-condition node", () => {
  const adjacency = buildAdjacency([edge("e1", "a", "b"), edge("e2", "a", "c")]);
  const next = nextNodeIds({ id: "a", type: "httpRequest" }, {}, adjacency);
  assert.deepEqual(next.sort(), ["b", "c"]);
});

test("nextNodeIds follows only the true branch when a condition's result is true", () => {
  const adjacency = buildAdjacency([edge("e1", "c", "yes", "true"), edge("e2", "c", "no", "false")]);
  const next = nextNodeIds({ id: "c", type: "condition" }, { result: true }, adjacency);
  assert.deepEqual(next, ["yes"]);
});

test("nextNodeIds follows only the false branch when a condition's result is false", () => {
  const adjacency = buildAdjacency([edge("e1", "c", "yes", "true"), edge("e2", "c", "no", "false")]);
  const next = nextNodeIds({ id: "c", type: "condition" }, { result: false }, adjacency);
  assert.deepEqual(next, ["no"]);
});

test("descendantsOf finds every node reachable through a branch, not just the direct child", () => {
  const adjacency = buildAdjacency([edge("e1", "no", "log"), edge("e2", "log", "cleanup")]);
  const descendants = descendantsOf("no", adjacency);
  assert.deepEqual([...descendants].sort(), ["cleanup", "log"]);
});

test("descendantsOf returns an empty set for a terminal node", () => {
  const adjacency = buildAdjacency([]);
  assert.equal(descendantsOf("terminal", adjacency).size, 0);
});
