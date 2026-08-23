import { register, login, logout } from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";

export async function authRoutes(app) {
  app.post("/api/auth/register", register);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);

  app.get("/api/auth/me", { preHandler: requireAuth }, async (request) => {
    return { user: request.user };
  });
}
