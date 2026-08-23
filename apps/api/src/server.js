import { buildApp } from "./app.js";
import { env, assertProductionEnv } from "./config/env.js";

assertProductionEnv();

const app = await buildApp();

try {
  await app.listen({ port: env.port, host: "0.0.0.0" });
  app.log.info(`FlowPilot API listening on port ${env.port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
