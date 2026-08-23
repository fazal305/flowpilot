import { generateWorkflowSchema } from "../validators/aiValidators.js";
import { generateWorkflow } from "../services/workflowGenerationService.js";
import { OpenRouterError } from "../services/openRouterService.js";
import { GeneratedGraphError } from "../services/generatedGraphValidator.js";

export async function generate(request, reply) {
  const parsed = generateWorkflowSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  try {
    const result = await generateWorkflow(parsed.data.prompt);
    return reply.send(result);
  } catch (error) {
    if (error instanceof OpenRouterError || error instanceof GeneratedGraphError) {
      return reply.code(422).send({ error: error.message });
    }
    throw error;
  }
}
