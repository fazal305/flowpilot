import PgBoss from "pg-boss";
import { env } from "../config/env.js";

export const EXECUTE_WORKFLOW_QUEUE = "execute-workflow";

let bossPromise;

/** Single shared, lazily-started pg-boss instance for the process. */
function getBoss() {
  if (!bossPromise) {
    bossPromise = (async () => {
      const boss = new PgBoss(env.databaseUrl);
      boss.on("error", (error) => console.error("[pg-boss]", error));
      await boss.start();
      await boss.createQueue(EXECUTE_WORKFLOW_QUEUE);
      return boss;
    })();
  }
  return bossPromise;
}

export async function enqueueExecution(payload) {
  const boss = await getBoss();
  return boss.send(EXECUTE_WORKFLOW_QUEUE, payload);
}

export async function registerExecutionWorker(handler) {
  const boss = await getBoss();
  await boss.work(EXECUTE_WORKFLOW_QUEUE, async (job) => {
    await handler(job.data);
  });
}
