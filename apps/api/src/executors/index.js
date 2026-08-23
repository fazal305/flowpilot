import { executeWebhook } from "./webhookExecutor.js";
import { executeSchedule } from "./scheduleExecutor.js";
import { executeHttpRequest } from "./httpRequestExecutor.js";
import { executeCondition } from "./conditionExecutor.js";
import { executeAi } from "./aiExecutor.js";
import { executeNotification } from "./notificationExecutor.js";

export const EXECUTORS = {
  webhook: executeWebhook,
  schedule: executeSchedule,
  httpRequest: executeHttpRequest,
  condition: executeCondition,
  ai: executeAi,
  notification: executeNotification,
};

/** Per-type ceilings so one hung node can't stall a run indefinitely. */
export const NODE_TIMEOUT_MS = {
  webhook: 5_000,
  schedule: 5_000,
  httpRequest: 15_000,
  condition: 2_000,
  ai: 30_000,
  notification: 10_000,
};

/** Only nodes that talk to something external are worth retrying. */
export const RETRYABLE_TYPES = new Set(["httpRequest", "ai", "notification"]);
export const MAX_RETRIES = 2;
