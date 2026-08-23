import { env } from "../config/env.js";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export class OpenRouterError extends Error {
  constructor(message) {
    super(message);
    this.name = "OpenRouterError";
  }
}

/**
 * Calls OpenRouter's chat completions endpoint. Server-only — the API key
 * never leaves this process (never sent to the frontend, never logged).
 *
 * @param {{model: string, systemPrompt: string, userPrompt: string, maxTokens?: number, temperature?: number, jsonMode?: boolean}} params
 * @returns {Promise<{content: string, promptTokens: number, completionTokens: number, latencyMs: number}>}
 */
export async function callOpenRouter({ model, systemPrompt, userPrompt, maxTokens = 512, temperature = 0.3, jsonMode = false }) {
  if (!env.openRouterApiKey) {
    throw new OpenRouterError("OPENROUTER_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  const startedAt = Date.now();

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openRouterApiKey}`,
        "Content-Type": "application/json",
        // OpenRouter asks for these to attribute usage; harmless to omit but nice to include.
        "HTTP-Referer": "https://github.com/fazal305/flowpilot",
        "X-Title": "FlowPilot",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message = body?.error?.message ?? `OpenRouter request failed (${response.status}).`;
      throw new OpenRouterError(message);
    }

    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new OpenRouterError("OpenRouter returned an unexpected response shape.");
    }

    return {
      content,
      promptTokens: body?.usage?.prompt_tokens ?? 0,
      completionTokens: body?.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new OpenRouterError("OpenRouter request timed out after 30s.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
