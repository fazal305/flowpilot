import { env } from "../config/env.js";
import { renderTemplate } from "../lib/template.js";

/**
 * Real OpenRouter wiring (structured outputs, token/latency accounting,
 * prompt-injection hardening) is Phase 6 work. Until a key is configured,
 * this returns a clearly-labeled mock so the rest of the pipeline (branch
 * traversal, downstream nodes, execution records) can be exercised honestly
 * — never silently pretending a real model call happened.
 */
export async function executeAi(config, input) {
  const prompt = renderTemplate(config.userPromptTemplate, input);

  if (!env.openRouterApiKey) {
    return {
      mocked: true,
      note: "OPENROUTER_API_KEY is not configured — this is a placeholder response. Real AI calls arrive in Phase 6.",
      model: config.model,
      prompt,
      summary: `[mock] Would summarize: ${prompt.slice(0, 200)}`,
    };
  }

  // Placeholder for the real call — intentionally not implemented yet so we
  // don't ship a half-tested integration ahead of Phase 6's prompt-injection
  // and structured-output work.
  throw new Error("OpenRouter integration is not implemented yet (arrives in Phase 6).");
}
