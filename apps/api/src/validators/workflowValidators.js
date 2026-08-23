import { z } from "zod";
import { NODE_TYPES, WORKFLOW_STATUSES } from "@flowpilot/shared";

const nodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NODE_TYPES),
  label: z.string().min(1).max(200),
  position: z.object({ x: z.number(), y: z.number() }),
  config: z.record(z.string(), z.unknown()),
});

const edgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.enum(["true", "false"]).nullable().optional(),
});

export const upsertWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  status: z.enum(WORKFLOW_STATUSES),
  graph: z.object({
    nodes: z.array(nodeSchema),
    edges: z.array(edgeSchema),
  }),
});
