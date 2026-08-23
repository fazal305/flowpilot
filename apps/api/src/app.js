import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { healthRoutes } from "./routes/healthRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.nodeEnv === "production" ? "info" : "debug",
      // never let request/response bodies (which can carry secrets/tokens) hit logs
      redact: ["req.headers.authorization", "req.headers.cookie"],
    },
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

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const status = error.statusCode ?? 500;
    reply.code(status).send({
      error: status === 500 ? "Internal server error." : error.message,
    });
  });

  return app;
}
