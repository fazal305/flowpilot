import { listWorkflows, putWorkflow, getPreference, setPreference } from "./db";

const SEEDED_FLAG_KEY = "hasSeededDemoWorkflows";

function node(id, type, label, position, config) {
  return { id, type: "workflowNode", position, data: { nodeType: type, label, config, status: "idle" } };
}

function edge(id, source, target, sourceHandle = null) {
  return { id, source, target, sourceHandle };
}

const now = () => new Date().toISOString();

/**
 * Two example workflows straight out of the product brief's own diagrams —
 * real, editable graphs (not fabricated stats) so a first-time visitor sees
 * what FlowPilot actually does instead of a wall of empty states.
 */
function buildDemoWorkflows() {
  const t = now();

  const leadQualification = {
    id: "demo-lead-qualification",
    name: "New Lead Qualification",
    description: "Routes new form submissions to sales or a nurture email based on budget.",
    status: "active",
    syncStatus: "local-only",
    createdAt: t,
    updatedAt: t,
    graph: {
      nodes: [
        node("trigger", "webhook", "New Form Submission", { x: 40, y: 220 }, {
          path: "leads",
          method: "POST",
        }),
        node("condition", "condition", "Is Budget > Rs. 100,000?", { x: 360, y: 220 }, {
          field: "lead.budget",
          operator: "greaterThan",
          value: 100000,
        }),
        node("createLead", "httpRequest", "Create Lead in CRM", { x: 700, y: 80 }, {
          url: "https://api.example-crm.com/leads",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{{input}}",
          auth: { type: "none" },
          timeoutMs: 10000,
        }),
        node("notifySales", "notification", "Notify Sales Team", { x: 1020, y: 80 }, {
          channel: "inApp",
          target: "sales-team",
          messageTemplate: "New qualified lead: {{lead.name}} (budget {{lead.budget}})",
        }),
        node("sendNurture", "notification", "Send Nurture Email", { x: 700, y: 360 }, {
          channel: "email",
          target: "{{lead.email}}",
          messageTemplate: "Thanks for your interest — here are some resources to get started.",
        }),
      ],
      edges: [
        edge("e1", "trigger", "condition"),
        edge("e2", "condition", "createLead", "true"),
        edge("e3", "createLead", "notifySales"),
        edge("e4", "condition", "sendNurture", "false"),
      ],
    },
  };

  const aiSummarizer = {
    id: "demo-ai-summarizer",
    name: "AI Lead Summarizer",
    description: "Summarizes qualified leads with AI before alerting sales.",
    status: "draft",
    syncStatus: "local-only",
    createdAt: t,
    updatedAt: t,
    graph: {
      nodes: [
        node("trigger", "webhook", "New Lead Webhook", { x: 40, y: 160 }, {
          path: "leads/ai",
          method: "POST",
        }),
        node("condition", "condition", "Budget > 100k?", { x: 360, y: 160 }, {
          field: "lead.budget",
          operator: "greaterThan",
          value: 100000,
        }),
        node("summarize", "ai", "AI Summarizer", { x: 700, y: 60 }, {
          model: "anthropic/claude-3.5-haiku",
          systemPrompt: "You summarize inbound sales leads in two sentences, noting urgency and fit.",
          userPromptTemplate: "Summarize this lead's requirements: {{lead.requirements}}",
          maxTokens: 300,
          temperature: 0.3,
        }),
        node("notify", "notification", "Send to Sales", { x: 1020, y: 60 }, {
          channel: "inApp",
          target: "sales-team",
          messageTemplate: "{{summary}}",
        }),
      ],
      edges: [
        edge("e1", "trigger", "condition"),
        edge("e2", "condition", "summarize", "true"),
        edge("e3", "summarize", "notify"),
      ],
    },
  };

  return [leadQualification, aiSummarizer];
}

export async function seedDemoWorkflowsIfEmpty() {
  const alreadySeeded = await getPreference(SEEDED_FLAG_KEY, false);
  if (alreadySeeded) return false;

  const existing = await listWorkflows();
  if (existing.length > 0) {
    // User already has real data — don't inject demo content on top of it.
    await setPreference(SEEDED_FLAG_KEY, true);
    return false;
  }

  for (const workflow of buildDemoWorkflows()) {
    await putWorkflow(workflow);
  }
  await setPreference(SEEDED_FLAG_KEY, true);
  return true;
}
