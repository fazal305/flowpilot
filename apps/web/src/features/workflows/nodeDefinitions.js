import { Webhook, Clock, Globe, GitBranch, Sparkles, Bell } from "lucide-react";
import { defaultConfigForType } from "@flowpilot/shared";

export const NODE_DEFINITIONS = {
  webhook: {
    type: "webhook",
    label: "Webhook",
    category: "trigger",
    icon: Webhook,
    description: "Starts when an external service sends a request to a unique URL.",
  },
  schedule: {
    type: "schedule",
    label: "Schedule",
    category: "trigger",
    icon: Clock,
    description: "Starts on a recurring cron schedule.",
  },
  condition: {
    type: "condition",
    label: "Condition",
    category: "logic",
    icon: GitBranch,
    description: "Branches the workflow into True/False paths.",
  },
  httpRequest: {
    type: "httpRequest",
    label: "HTTP Request",
    category: "action",
    icon: Globe,
    description: "Calls an external HTTP endpoint.",
  },
  ai: {
    type: "ai",
    label: "AI",
    category: "action",
    icon: Sparkles,
    description: "Transforms or summarizes data with an LLM via OpenRouter.",
  },
  notification: {
    type: "notification",
    label: "Notification",
    category: "action",
    icon: Bell,
    description: "Sends an email, outbound webhook, or in-app notification.",
  },
};

export const NODE_CATEGORIES = [
  { id: "trigger", label: "Triggers" },
  { id: "logic", label: "Logic" },
  { id: "action", label: "Actions" },
];

export function defaultLabelForType(type) {
  return NODE_DEFINITIONS[type]?.label ?? type;
}

export function nodeSummary(data) {
  const { nodeType, config } = data;
  switch (nodeType) {
    case "webhook":
      return `${config.method} /webhooks/…`;
    case "schedule":
      return config.cron || "no schedule set";
    case "httpRequest":
      return `${config.method} ${config.url || "(no URL set)"}`;
    case "condition":
      return config.field
        ? `${config.field} ${config.operator} ${config.value ?? ""}`.trim()
        : "(no condition set)";
    case "ai":
      return config.model || "(no model set)";
    case "notification":
      return `${config.channel} → ${config.target || "(no target set)"}`;
    default:
      return "";
  }
}

export { defaultConfigForType };
