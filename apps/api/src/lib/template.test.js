import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTemplate } from "./template.js";

test("substitutes a simple dot-path", () => {
  assert.equal(renderTemplate("Hello {{name}}", { name: "Ada" }), "Hello Ada");
});

test("substitutes a nested dot-path", () => {
  assert.equal(renderTemplate("{{lead.name}} — {{lead.budget}}", { lead: { name: "Ada", budget: 500 } }), "Ada — 500");
});

test("a missing path renders as an empty string, not 'undefined'", () => {
  assert.equal(renderTemplate("Value: {{missing.path}}", {}), "Value: ");
});

test("'input' alone renders the whole data object as JSON", () => {
  const result = renderTemplate("{{input}}", { a: 1 });
  assert.equal(result, JSON.stringify({ a: 1 }));
});

test("an object value at a path is JSON-stringified, not [object Object]", () => {
  const result = renderTemplate("{{lead}}", { lead: { name: "Ada" } });
  assert.equal(result, JSON.stringify({ name: "Ada" }));
});

test("non-string templates pass through unchanged", () => {
  assert.equal(renderTemplate(42, {}), 42);
  assert.equal(renderTemplate(undefined, {}), undefined);
});

test("multiple placeholders in one string all resolve", () => {
  assert.equal(renderTemplate("{{a}}-{{b}}-{{a}}", { a: "x", b: "y" }), "x-y-x");
});
