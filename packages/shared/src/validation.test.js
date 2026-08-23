import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGraph } from "./validation.js";

function node(id, type, label = id) {
  return { id, type, label };
}
function edge(id, source, target, sourceHandle = null) {
  return { id, source, target, sourceHandle };
}

test("empty graph reports no nodes", () => {
  const issues = validateGraph({ nodes: [], edges: [] });
  assert.equal(issues.length, 1);
  assert.equal(issues[0].level, "error");
  assert.match(issues[0].message, /no nodes yet/);
});

test("graph with no trigger reports an error", () => {
  const issues = validateGraph({
    nodes: [node("a", "httpRequest")],
    edges: [],
  });
  assert.ok(issues.some((i) => i.level === "error" && /trigger/.test(i.message)));
});

test("non-trigger node with no incoming edge reports an error", () => {
  const issues = validateGraph({
    nodes: [node("t", "webhook"), node("a", "httpRequest")],
    edges: [],
  });
  assert.ok(issues.some((i) => i.nodeId === "a" && /isn't connected/.test(i.message)));
});

test("trigger with an incoming edge reports a warning, not an error", () => {
  const issues = validateGraph({
    nodes: [node("t", "webhook"), node("a", "httpRequest")],
    edges: [edge("e1", "a", "t")],
  });
  const triggerIssue = issues.find((i) => i.nodeId === "t");
  assert.equal(triggerIssue.level, "warning");
});

test("condition with no branches connected is an error", () => {
  const issues = validateGraph({
    nodes: [node("t", "webhook"), node("c", "condition")],
    edges: [edge("e1", "t", "c")],
  });
  assert.ok(issues.some((i) => i.nodeId === "c" && /no branches connected/.test(i.message)));
});

test("condition with only one branch connected is a warning", () => {
  const issues = validateGraph({
    nodes: [node("t", "webhook"), node("c", "condition"), node("a", "notification")],
    edges: [edge("e1", "t", "c"), edge("e2", "c", "a", "true")],
  });
  const branchIssue = issues.find((i) => i.nodeId === "c");
  assert.equal(branchIssue.level, "warning");
  assert.match(branchIssue.message, /True/);
});

test("fully connected graph with both condition branches has no issues", () => {
  const issues = validateGraph({
    nodes: [
      node("t", "webhook"),
      node("c", "condition"),
      node("yes", "notification"),
      node("no", "notification"),
    ],
    edges: [
      edge("e1", "t", "c"),
      edge("e2", "c", "yes", "true"),
      edge("e3", "c", "no", "false"),
    ],
  });
  assert.deepEqual(issues, []);
});

test("a cycle is reported as an error", () => {
  const issues = validateGraph({
    nodes: [node("t", "webhook"), node("a", "httpRequest"), node("b", "httpRequest")],
    edges: [edge("e1", "t", "a"), edge("e2", "a", "b"), edge("e3", "b", "a")],
  });
  assert.ok(issues.some((i) => /cycle/.test(i.message)));
});
