import { EXECUTORS, NODE_TIMEOUT_MS, RETRYABLE_TYPES, MAX_RETRIES } from "../executors/index.js";

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Node timed out after ${ms}ms.`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs one node's executor with a per-type timeout and, for node types that
 * talk to something external, retry with exponential backoff. Non-retryable
 * types (condition, webhook, schedule) fail fast on the first error since
 * retrying pure logic can't change the outcome.
 */
export async function runNode(node, input, context) {
  const executor = EXECUTORS[node.type];
  if (!executor) throw new Error(`No executor registered for node type "${node.type}".`);

  const timeoutMs = NODE_TIMEOUT_MS[node.type] ?? 10_000;
  const maxAttempts = RETRYABLE_TYPES.has(node.type) ? MAX_RETRIES + 1 : 1;

  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const output = await withTimeout(
        Promise.resolve(executor(node.config, input, context)),
        timeoutMs
      );
      return { output, retryCount: attempt };
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await sleep(300 * 2 ** attempt);
      }
    }
  }
  throw Object.assign(lastError, { retryCount: maxAttempts - 1 });
}
