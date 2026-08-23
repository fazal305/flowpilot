import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGeneratedGraph, GeneratedGraphError } from "./generatedGraphValidator.js";

const validRaw = {
  name: "Lead router",
  description: "Routes leads by budget.",
  nodes: [
    { id: "trigger", type: "webhook", label: "New Lead", config: { path: "leads", method: "POST" } },
    { id: "cond", type: "condition", label: "High budget?", config: { field: "budget", operator: "greaterThan", value: 100000 } },
  ],
  edges: [{ id: "e1", source: "trigger", target: "cond" }],
};

test("a well-formed AI response passes through with its fields intact", () => {
  const result = validateGeneratedGraph(validRaw);
  assert.equal(result.name, "Lead router");
  assert.equal(result.nodes.length, 2);
  assert.equal(result.edges.length, 1);
});

test("an unknown node type is rejected, not silently accepted", () => {
  const raw = {
    ...validRaw,
    nodes: [...validRaw.nodes, { id: "x", type: "sendCarrierPigeon", label: "Nope", config: {} }],
  };
  assert.throws(() => validateGeneratedGraph(raw), GeneratedGraphError);
});

test("missing config fields are filled with the same defaults the editor uses", () => {
  const raw = {
    ...validRaw,
    nodes: [{ id: "trigger", type: "webhook", label: "New Lead", config: {} }],
  };
  const result = validateGeneratedGraph(raw);
  // defaultConfigForType("webhook") provides path/method even though the
  // model supplied an empty config object.
  assert.equal(result.nodes[0].config.method, "POST");
  assert.ok("path" in result.nodes[0].config);
});

test("model-provided config values win over defaults", () => {
  const raw = {
    ...validRaw,
    nodes: [{ id: "trigger", type: "webhook", label: "New Lead", config: { method: "GET" } }],
  };
  const result = validateGeneratedGraph(raw);
  assert.equal(result.nodes[0].config.method, "GET");
});

test("an edge pointing at a node id that doesn't exist is dropped, not left dangling", () => {
  const raw = {
    ...validRaw,
    edges: [...validRaw.edges, { id: "e2", source: "cond", target: "ghost" }],
  };
  const result = validateGeneratedGraph(raw);
  assert.equal(result.edges.length, 1);
  assert.equal(result.edges[0].id, "e1");
});

test("zero nodes is rejected", () => {
  assert.throws(() => validateGeneratedGraph({ ...validRaw, nodes: [] }), GeneratedGraphError);
});

test("a missing name/description falls back to sensible defaults instead of failing", () => {
  const { name, description } = validateGeneratedGraph({ nodes: validRaw.nodes, edges: validRaw.edges });
  assert.equal(name, "AI-generated workflow");
  assert.equal(description, "");
});
