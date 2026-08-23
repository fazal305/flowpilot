import { registerExecutionWorker } from "../queue/boss.js";
import { runExecution } from "../services/executionEngine.js";

export async function startExecutionWorker(logger) {
  await registerExecutionWorker(async ({ executionId, workflowId, triggeredBy }) => {
    try {
      await runExecution({ executionId, workflowId, triggeredBy });
    } catch (error) {
      logger?.error({ err: error, executionId }, "Execution worker failed unexpectedly");
    }
  });
  logger?.info("Execution worker registered");
}
