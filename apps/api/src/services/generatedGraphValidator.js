import { z } from "zod";
import { NODE_TYPES, defaultConfigForType } from "@flowpilot/shared";

const rawNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NODE_TYPES),
  label: z.string().min(1).max(200),
  config: z.record(z.string(), z.unknown()).default({}),
});

const rawEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.enum(["true", "false"]).nullable().optional().default(null),
});

const rawGraphSchema = z.object({
  name: z.string().min(1).max(200).default("AI-generated workflow"),
  description: z.string().max(2000).default(""),
  nodes: z.array(rawNodeSchema).min(1).max(15),
  edges: z.array(rawEdgeSchema).max(30),
});

export class GeneratedGraphError extends Error {
  constructor(message) {
    super(message);
    this.name = "GeneratedGraphError";
  }
}

/**
 * Structurally validates and repairs an AI-generated graph: rejects unknown
 * node types (the model can only ever have used our six), drops edges
 * pointing at nodes that don't exist, and fills any config fields the model
 * omitted with the same defaults the editor uses for a freshly-dragged node
 * — so a slightly incomplete generation still produces a usable draft
 * instead of a rejected one.
 */
export function validateGeneratedGraph(raw) {
  const parsed = rawGraphSchema.safeParse(raw);
  if (!parsed.success) {
    throw new GeneratedGraphError(`AI response didn't match the expected shape: ${parsed.error.message}`);
  }

  const { name, description, nodes, edges } = parsed.data;
  const nodeIds = new Set(nodes.map((n) => n.id));

  const safeNodes = nodes.map((node) => ({
    ...node,
    config: { ...defaultConfigForType(node.type), ...node.config },
  }));

  const safeEdges = edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  return { name, description, nodes: safeNodes, edges: safeEdges };
}
