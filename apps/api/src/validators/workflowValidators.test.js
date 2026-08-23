import { test } from "node:test";
import assert from "node:assert/strict";
import { upsertWorkflowSchema } from "./workflowValidators.js";

const validPayload = {
  name: "Lead router",
  status: "draft",
  graph: {
    nodes: [
      {
        id: "n1",
        type: "webhook",
        label: "Trigger",
        position: { x: 0, y: 0 },
        config: { path: "leads", method: "POST" },
      },
    ],
    edges: [],
  },
};

test("a well-formed workflow payload passes", () => {
  const result = upsertWorkflowSchema.safeParse(validPayload);
  assert.equal(result.success, true);
});

test("description defaults to an empty string when omitted", () => {
  const result = upsertWorkflowSchema.safeParse(validPayload);
  assert.equal(result.data.description, "");
});

test("an invalid node type is rejected", () => {
  const payload = {
    ...validPayload,
    graph: {
      ...validPayload.graph,
      nodes: [{ ...validPayload.graph.nodes[0], type: "sendCarrierPigeon" }],
    },
  };
  assert.equal(upsertWorkflowSchema.safeParse(payload).success, false);
});

test("an invalid workflow status is rejected", () => {
  const result = upsertWorkflowSchema.safeParse({ ...validPayload, status: "archived" });
  assert.equal(result.success, false);
});

test("a missing name is rejected", () => {
  const { name, ...withoutName } = validPayload;
  assert.equal(upsertWorkflowSchema.safeParse(withoutName).success, false);
});

test("a node without a position is rejected", () => {
  const payload = {
    ...validPayload,
    graph: {
      ...validPayload.graph,
      nodes: [{ id: "n1", type: "webhook", label: "Trigger", config: {} }],
    },
  };
  assert.equal(upsertWorkflowSchema.safeParse(payload).success, false);
});

test("an edge's sourceHandle only accepts true/false/null", () => {
  const payload = {
    ...validPayload,
    graph: {
      ...validPayload.graph,
      edges: [{ id: "e1", source: "n1", target: "n1", sourceHandle: "maybe" }],
    },
  };
  assert.equal(upsertWorkflowSchema.safeParse(payload).success, false);
});
