import { verifySessionToken } from "../services/authService.js";
import { SESSION_COOKIE } from "../controllers/authController.js";

export async function requireAuth(request, reply) {
  const token = request.cookies?.[SESSION_COOKIE];
  if (!token) {
    return reply.code(401).send({ error: "Not authenticated." });
  }
  try {
    const payload = verifySessionToken(token);
    request.user = { id: payload.sub, email: payload.email };
  } catch {
    return reply.code(401).send({ error: "Session expired or invalid." });
  }
}
