/**
 * Trigger node. Real cron-driven runs arrive when pg-boss's scheduling API
 * is wired to this node's `cron`/`timezone` config; a manual "Run" just
 * passes through the current time so downstream nodes have something real.
 */
export async function executeSchedule(config) {
  return { firedAt: new Date().toISOString(), cron: config.cron, timezone: config.timezone };
}
