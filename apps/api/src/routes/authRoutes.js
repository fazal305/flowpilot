import { register, login, logout } from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";

// Tighter than the global default — login/register are exactly the
// endpoints a credential-stuffing or brute-force attempt would hit.
const AUTH_RATE_LIMIT = { rateLimit: { max: 10, timeWindow: "1 minute" } };

export async function authRoutes(app) {
  app.post("/api/auth/register", { config: AUTH_RATE_LIMIT, handler: register });
  app.post("/api/auth/login", { config: AUTH_RATE_LIMIT, handler: login });
  app.post("/api/auth/logout", logout);

  app.get("/api/auth/me", { preHandler: requireAuth }, async (request) => {
    return { user: request.user };
  });
}
