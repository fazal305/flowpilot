import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { workflowRoutes } from "./routes/workflowRoutes.js";
import { executionRoutes } from "./routes/executionRoutes.js";
import { aiRoutes } from "./routes/aiRoutes.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.nodeEnv === "production" ? "info" : "debug",
      // never let request/response bodies (which can carry secrets/tokens) hit logs
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
  });

  // Registered before any app.register() calls: Fastify gives each plugin
  // passed to register() its own encapsulated context that only inherits
  // what the parent had *at the time it was registered*. Setting this after
  // the route plugins below would silently never apply to them, leaking raw
  // internal error messages (Prisma connection strings, stack traces) to
  // clients via Fastify's default error serialization instead.
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const status = error.statusCode ?? 500;
    reply.code(status).send({
      error: status === 500 ? "Internal server error." : error.message,
    });
  });

  await app.register(cors, {
    origin: env.webOrigin,
    credentials: true,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(workflowRoutes);
  await app.register(executionRoutes);
  await app.register(aiRoutes);

  return app;
}
