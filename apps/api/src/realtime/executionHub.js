/**
 * In-memory pub/sub keyed by execution id. This is correct as long as the
 * API server and the pg-boss worker run in the same process (they do — see
 * server.js), so a broadcast from the worker reaches sockets held by this
 * same process's WS route.
 *
 * Documented limitation: if this were ever horizontally scaled (multiple API
 * instances, or the worker split into its own process/machine), a broadcast
 * from one instance would never reach sockets connected to another. Fixing
 * that needs a shared channel (Redis pub/sub, or Postgres LISTEN/NOTIFY)
 * across instances — deliberately not built here since there's only ever
 * one process today, and building it now would be unverifiable and
 * untestable, exactly what this project's brief says not to do.
 */
const rooms = new Map();

export function subscribe(executionId, socket) {
  if (!rooms.has(executionId)) rooms.set(executionId, new Set());
  rooms.get(executionId).add(socket);

  socket.on("close", () => {
    const room = rooms.get(executionId);
    room?.delete(socket);
    if (room?.size === 0) rooms.delete(executionId);
  });
}

export function broadcast(executionId, event) {
  const sockets = rooms.get(executionId);
  if (!sockets || sockets.size === 0) return;
  const payload = JSON.stringify(event);
  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) socket.send(payload);
  }
}
