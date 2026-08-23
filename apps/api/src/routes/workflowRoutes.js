import { upsert, get, list, remove } from "../controllers/workflowController.js";

export async function workflowRoutes(app) {
  app.put("/api/workflows/:id", upsert);
  app.get("/api/workflows/:id", get);
  app.get("/api/workflows", list);
  app.delete("/api/workflows/:id", remove);
}
