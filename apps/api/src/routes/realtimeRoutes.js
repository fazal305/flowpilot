import { subscribe } from "../realtime/executionHub.js";

export async function realtimeRoutes(app) {
  app.get("/ws/executions/:id", { websocket: true }, (socket, request) => {
    subscribe(request.params.id, socket);
    socket.send(JSON.stringify({ type: "connected", executionId: request.params.id }));
  });
}
