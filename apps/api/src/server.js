import { buildApp } from "./app.js";
import { env, assertProductionEnv } from "./config/env.js";
import { startExecutionWorker } from "./workers/executionWorker.js";

assertProductionEnv();

const app = await buildApp();

try {
  await app.listen({ port: env.port, host: "0.0.0.0" });
  app.log.info(`FlowPilot API listening on port ${env.port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

if (env.databaseUrl) {
  try {
    await startExecutionWorker(app.log);
  } catch (error) {
    app.log.error({ err: error }, "Could not start execution worker — workflow runs will stay pending.");
  }
} else {
  app.log.warn("DATABASE_URL not set — execution worker not started, workflow persistence disabled.");
}
