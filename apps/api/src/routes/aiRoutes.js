import { generate } from "../controllers/aiController.js";

export async function aiRoutes(app) {
  // Stricter than the global limit — this hits a paid external API.
  app.post("/api/ai/generate-workflow", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    handler: generate,
  });
}
