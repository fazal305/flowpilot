/**
 * Trigger node: the actual HTTP receipt happens at the webhook ingress route
 * (not built until a real inbound-webhook endpoint is needed), which passes
 * the request body in as `input`. For a manual "Run" from the editor, there
 * is no real payload — the trigger just passes its config through so
 * downstream nodes have something to inspect.
 */
export async function executeWebhook(config, input) {
  return input ?? { triggeredManually: true, path: config.path, method: config.method };
}
