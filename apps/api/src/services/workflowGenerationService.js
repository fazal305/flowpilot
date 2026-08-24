import { env } from "../config/env.js";
import { callOpenRouter, OpenRouterError } from "./openRouterService.js";
import { validateGeneratedGraph, GeneratedGraphError } from "./generatedGraphValidator.js";

const SYSTEM_PROMPT = `You design workflow automation graphs for FlowPilot, a visual workflow tool with exactly six node types: webhook, schedule, httpRequest, condition, ai, notification.

Given a user's description, output STRICT JSON (no markdown fences, no commentary — just the object) matching this shape:
{
  "name": "short workflow name",
  "description": "one sentence description",
  "nodes": [{ "id": "short unique string", "type": "one of the six types above", "label": "human-readable label", "config": { ...type-specific fields, see below... } }],
  "edges": [{ "id": "short unique string", "source": "node id", "target": "node id", "sourceHandle": "true" | "false" | null }]
}

Rules:
- Exactly one trigger node (webhook or schedule) as the entry point — never a "target" of any edge.
- Every "condition" node must have exactly two outgoing edges: one with sourceHandle "true", one with "false".
- Only ever use the six node types listed above. Never invent a new type or field name.
- Config fields per type (include all of them, using reasonable values):
  webhook: { "path": string, "method": "GET"|"POST"|"PUT"|"PATCH"|"DELETE" }
  schedule: { "cron": string, "timezone": string }
  httpRequest: { "url": string, "method": string, "headers": object, "body": string, "auth": {"type":"none"}, "timeoutMs": number }
  condition: { "field": "dot.path.into.upstream.output", "operator": "equals"|"notEquals"|"greaterThan"|"lessThan"|"contains"|"isEmpty"|"isNotEmpty", "value": string|number }
  ai: { "model": "anthropic/claude-3.5-haiku", "systemPrompt": string, "userPromptTemplate": string, "maxTokens": number, "temperature": number }
  notification: { "channel": "email"|"webhookOut"|"inApp", "target": string, "messageTemplate": string }
- Keep it focused: 3 to 7 nodes total.
- Output ONLY the JSON object.`;

/** BFS layers nodes from the trigger(s) outward and lays them left-to-right in columns. */
function layoutGraph(nodes, edges) {
  const adjacency = new Map(nodes.map((n) => [n.id, []]));
  for (const edge of edges) {
    if (adjacency.has(edge.source)) adjacency.get(edge.source).push(edge.target);
  }

  const depth = new Map();
  const triggerTypes = new Set(["webhook", "schedule"]);
  const queue = [];
  for (const node of nodes) {
    if (triggerTypes.has(node.type)) {
      depth.set(node.id, 0);
      queue.push(node.id);
    }
  }

  while (queue.length > 0) {
    const id = queue.shift();
    for (const next of adjacency.get(id) ?? []) {
      const candidate = depth.get(id) + 1;
      if (!depth.has(next) || candidate < depth.get(next)) {
        depth.set(next, candidate);
        queue.push(next);
      }
    }
  }

  const countAtDepth = new Map();
  return nodes.map((node) => {
    const d = depth.get(node.id) ?? 0;
    const index = countAtDepth.get(d) ?? 0;
    countAtDepth.set(d, index + 1);
    return { ...node, position: { x: 80 + d * 280, y: 80 + index * 170 } };
  });
}

function mockGeneratedWorkflow(prompt) {
  const nodes = [
    { id: "trigger", type: "webhook", label: "New Submission", config: { path: "generated", method: "POST" } },
    {
      id: "condition",
      type: "condition",
      label: "Meets criteria?",
      config: { field: "input.value", operator: "greaterThan", value: 100 },
    },
    {
      id: "notifyYes",
      type: "notification",
      label: "Notify Team",
      config: { channel: "inApp", target: "team", messageTemplate: "Matched: {{input}}" },
    },
    {
      id: "notifyNo",
      type: "notification",
      label: "Log Low Priority",
      config: { channel: "inApp", target: "team", messageTemplate: "Below threshold: {{input}}" },
    },
  ];
  const edges = [
    { id: "e1", source: "trigger", target: "condition", sourceHandle: null },
    { id: "e2", source: "condition", target: "notifyYes", sourceHandle: "true" },
    { id: "e3", source: "condition", target: "notifyNo", sourceHandle: "false" },
  ];

  return {
    name: `Generated: ${prompt.slice(0, 60)}`,
    description: "Mocked draft — this is an educational/portfolio project, so bring your own OpenRouter API key (OPENROUTER_API_KEY in apps/api/.env) for a real generation. This is a fixed example shape instead.",
    graph: { nodes: layoutGraph(nodes, edges), edges },
    meta: { mocked: true, model: null, promptTokens: 0, completionTokens: 0, latencyMs: 0 },
  };
}

export async function generateWorkflow(prompt) {
  if (!env.openRouterApiKey) {
    return mockGeneratedWorkflow(prompt);
  }

  const model = "anthropic/claude-3.5-haiku";
  const result = await callOpenRouter({
    model,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: prompt,
    maxTokens: 1800,
    temperature: 0.4,
    jsonMode: true,
  });

  let parsed;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    throw new OpenRouterError("The AI's response wasn't valid JSON — try rephrasing the request.");
  }

  const validated = validateGeneratedGraph(parsed);
  const laidOutNodes = layoutGraph(validated.nodes, validated.edges);

  return {
    name: validated.name,
    description: validated.description,
    graph: { nodes: laidOutNodes, edges: validated.edges },
    meta: {
      mocked: false,
      model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      latencyMs: result.latencyMs,
    },
  };
}

export { GeneratedGraphError };
