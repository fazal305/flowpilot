import { test } from "node:test";
import assert from "node:assert/strict";
import { generateWorkflowSchema } from "./aiValidators.js";

test("a reasonable prompt passes", () => {
  const result = generateWorkflowSchema.safeParse({ prompt: "Notify sales when a lead has a high budget" });
  assert.equal(result.success, true);
});

test("an empty or too-short prompt is rejected", () => {
  assert.equal(generateWorkflowSchema.safeParse({ prompt: "" }).success, false);
  assert.equal(generateWorkflowSchema.safeParse({ prompt: "hi" }).success, false);
});

test("an absurdly long prompt is rejected rather than sent to a paid API unbounded", () => {
  const result = generateWorkflowSchema.safeParse({ prompt: "a".repeat(2001) });
  assert.equal(result.success, false);
});

test("a missing prompt field is rejected", () => {
  assert.equal(generateWorkflowSchema.safeParse({}).success, false);
});
