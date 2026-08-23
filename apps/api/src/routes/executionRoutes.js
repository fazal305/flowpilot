import { trigger, get, history, listRecent } from "../controllers/executionController.js";

// Running a workflow can trigger real side effects (HTTP calls, AI spend,
// notifications) — worth a tighter limit than plain reads.
const TRIGGER_RATE_LIMIT = { rateLimit: { max: 20, timeWindow: "1 minute" } };

export async function executionRoutes(app) {
  app.post("/api/workflows/:id/execute", { config: TRIGGER_RATE_LIMIT, handler: trigger });
  app.get("/api/workflows/:id/executions", history);
  app.get("/api/executions", listRecent);
  app.get("/api/executions/:id", get);
}
