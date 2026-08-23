export const SYNC_STATUSES = ["local-only", "pending", "synced", "conflict"];

/**
 * Decides what a sync pass should do given three version numbers:
 *  - localVersion: the draft's current version in this browser
 *  - baseVersion: the server version this browser last successfully synced with
 *  - serverVersion: the server's current version right now
 *
 * This is intentionally simple last-write-wins-with-warning logic, not CRDT
 * merging — see the README's local-first limitations section. It exists so
 * the exact same decision function runs in the editor and (once Phase 4
 * wires a real server) in the sync client, rather than duplicating the rule.
 *
 * @returns {"none" | "push" | "pull" | "conflict"}
 */
export function decideSyncAction({ localVersion, baseVersion, serverVersion }) {
  const localChanged = localVersion > baseVersion;
  const serverChanged = serverVersion > baseVersion;

  if (!localChanged && !serverChanged) return "none";
  if (localChanged && !serverChanged) return "push";
  if (!localChanged && serverChanged) return "pull";
  return "conflict";
}
