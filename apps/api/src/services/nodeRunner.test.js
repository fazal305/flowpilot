import { test } from "node:test";
import assert from "node:assert/strict";
import { runNode } from "./nodeRunner.js";

// httpRequest is a real, retryable executor (RETRYABLE_TYPES), so mocking
// global.fetch lets these tests exercise the actual retry/backoff logic in
// nodeRunner.js rather than a stand-in. A public IP literal is used so the
// SSRF guard's real check runs too, without needing a DNS lookup.
const SAFE_URL = "http://93.184.216.34/api";

function jsonResponse(body, status = 200) {
  return {
    ok: status < 300,
    status,
    type: "basic",
    headers: { get: () => "application/json" },
    json: async () => body,
  };
}

test("succeeds on the first attempt with no retries needed", async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    return jsonResponse({ ok: true });
  };
  try {
    const node = { type: "httpRequest", config: { url: SAFE_URL, method: "GET", headers: {}, auth: { type: "none" }, timeoutMs: 500 } };
    const { output, retryCount } = await runNode(node, null, {});
    assert.equal(calls, 1);
    assert.equal(retryCount, 0);
    assert.deepEqual(output.body, { ok: true });
  } finally {
    global.fetch = originalFetch;
  }
});

test("retries a failing httpRequest node and succeeds once fetch recovers", async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    if (calls < 3) throw new Error("network blip");
    return jsonResponse({ recovered: true });
  };
  try {
    const node = { type: "httpRequest", config: { url: SAFE_URL, method: "GET", headers: {}, auth: { type: "none" }, timeoutMs: 500 } };
    const { output, retryCount } = await runNode(node, null, {});
    assert.equal(calls, 3);
    assert.equal(retryCount, 2);
    assert.deepEqual(output.body, { recovered: true });
  } finally {
    global.fetch = originalFetch;
  }
});

test("gives up after exhausting retries and reports the retry count on the error", async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls += 1;
    throw new Error("always down");
  };
  try {
    const node = { type: "httpRequest", config: { url: SAFE_URL, method: "GET", headers: {}, auth: { type: "none" }, timeoutMs: 500 } };
    await assert.rejects(() => runNode(node, null, {}), (error) => {
      assert.equal(error.retryCount, 2); // MAX_RETRIES
      return true;
    });
    assert.equal(calls, 3); // initial attempt + 2 retries
  } finally {
    global.fetch = originalFetch;
  }
});

test("a non-retryable node type (condition) fails immediately without retrying", async () => {
  const node = { type: "condition", config: { field: "x", operator: "unknownOperator" } };
  await assert.rejects(() => runNode(node, { x: 1 }, {}), (error) => {
    assert.equal(error.retryCount, 0);
    return true;
  });
});

test("an unregistered node type throws a clear error", async () => {
  await assert.rejects(() => runNode({ type: "carrierPigeon", config: {} }, null, {}), /No executor registered/);
});
