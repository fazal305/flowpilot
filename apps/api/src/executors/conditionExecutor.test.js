import { test } from "node:test";
import assert from "node:assert/strict";
import { executeCondition } from "./conditionExecutor.js";

test("equals compares loosely by design (config values are always strings)", async () => {
  const result = await executeCondition({ field: "budget", operator: "equals", value: "100" }, { budget: 100 });
  assert.equal(result.result, true);
});

test("greaterThan coerces both sides to numbers", async () => {
  const result = await executeCondition({ field: "lead.budget", operator: "greaterThan", value: 100000 }, { lead: { budget: 150000 } });
  assert.equal(result.result, true);
});

test("greaterThan is false when the field is below the threshold", async () => {
  const result = await executeCondition({ field: "lead.budget", operator: "greaterThan", value: 100000 }, { lead: { budget: 5000 } });
  assert.equal(result.result, false);
});

test("lessThan works the same way in reverse", async () => {
  const result = await executeCondition({ field: "count", operator: "lessThan", value: 10 }, { count: 3 });
  assert.equal(result.result, true);
});

test("contains checks substring presence", async () => {
  const result = await executeCondition({ field: "message", operator: "contains", value: "urgent" }, { message: "This is urgent!" });
  assert.equal(result.result, true);
});

test("isEmpty is true for undefined, null, and empty string", async () => {
  assert.equal((await executeCondition({ field: "x", operator: "isEmpty" }, {})).result, true);
  assert.equal((await executeCondition({ field: "x", operator: "isEmpty" }, { x: null })).result, true);
  assert.equal((await executeCondition({ field: "x", operator: "isEmpty" }, { x: "" })).result, true);
  assert.equal((await executeCondition({ field: "x", operator: "isEmpty" }, { x: "a" })).result, false);
});

test("isNotEmpty is the exact inverse of isEmpty", async () => {
  const result = await executeCondition({ field: "x", operator: "isNotEmpty" }, { x: "present" });
  assert.equal(result.result, true);
});

test("a dot-path reaches into nested objects", async () => {
  const result = await executeCondition(
    { field: "lead.contact.email", operator: "equals", value: "a@b.com" },
    { lead: { contact: { email: "a@b.com" } } }
  );
  assert.equal(result.result, true);
});

test("a missing dot-path segment resolves to undefined rather than throwing", async () => {
  const result = await executeCondition({ field: "lead.contact.email", operator: "isEmpty" }, { lead: {} });
  assert.equal(result.result, true);
});

test("output reports the field, actual value, and expected value for the inspector", async () => {
  const result = await executeCondition({ field: "budget", operator: "greaterThan", value: 100 }, { budget: 200 });
  assert.equal(result.field, "budget");
  assert.equal(result.actualValue, 200);
  assert.equal(result.expected, 100);
});

test("an unknown operator throws rather than silently evaluating false", async () => {
  await assert.rejects(
    () => executeCondition({ field: "x", operator: "startsWith", value: "a" }, { x: "abc" }),
    /Unknown condition operator/
  );
});
