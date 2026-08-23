import { trigger, get, history } from "../controllers/executionController.js";

export async function executionRoutes(app) {
  app.post("/api/workflows/:id/execute", trigger);
  app.get("/api/workflows/:id/executions", history);
  app.get("/api/executions/:id", get);
}
