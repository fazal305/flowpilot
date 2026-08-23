import { Copy, Trash2, X } from "lucide-react";
import { CONDITION_OPERATORS, NOTIFICATION_CHANNELS } from "@flowpilot/shared";
import { NODE_DEFINITIONS } from "./nodeDefinitions";
import { useEditorStore } from "./store/editorStore";

const FIELD_CLASS =
  "w-full rounded-md border border-border bg-surface-muted px-2.5 py-1.5 text-sm text-foreground outline-none focus-visible:border-accent";
const LABEL_CLASS = "flex flex-col gap-1 text-xs";

export function Inspector() {
  const nodes = useEditorStore((s) => s.nodes);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const setSelectedNode = useEditorStore((s) => s.setSelectedNode);
  const updateNodeConfig = useEditorStore((s) => s.updateNodeConfig);
  const updateNodeLabel = useEditorStore((s) => s.updateNodeLabel);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const deleteNode = useEditorStore((s) => s.deleteNode);

  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) {
    return (
      <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-surface p-4">
        <p className="text-sm text-foreground-muted">
          Select a node to inspect and edit its configuration.
        </p>
      </aside>
    );
  }

  const def = NODE_DEFINITIONS[node.data.nodeType];
  const Icon = def.icon;
  const config = node.data.config;

  function patch(fields) {
    updateNodeConfig(node.id, fields);
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
        <span className="text-sm font-semibold">{def.label}</span>
        <button
          type="button"
          onClick={() => setSelectedNode(null)}
          aria-label="Close inspector"
          className="ml-auto rounded p-1 text-foreground-muted hover:bg-surface-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <label className={LABEL_CLASS}>
          <span className="text-foreground-muted">Node name</span>
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => updateNodeLabel(node.id, e.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        {node.data.nodeType === "webhook" && (
          <label className={LABEL_CLASS}>
            <span className="text-foreground-muted">Method</span>
            <select
              value={config.method}
              onChange={(e) => patch({ method: e.target.value })}
              className={FIELD_CLASS}
            >
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        )}

        {node.data.nodeType === "schedule" && (
          <>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">Cron expression</span>
              <input
                type="text"
                value={config.cron}
                onChange={(e) => patch({ cron: e.target.value })}
                placeholder="*/15 * * * *"
                className={[FIELD_CLASS, "font-mono-token"].join(" ")}
              />
            </label>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">Timezone</span>
              <input
                type="text"
                value={config.timezone}
                onChange={(e) => patch({ timezone: e.target.value })}
                className={FIELD_CLASS}
              />
            </label>
          </>
        )}

        {node.data.nodeType === "httpRequest" && (
          <>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">Method</span>
              <select
                value={config.method}
                onChange={(e) => patch({ method: e.target.value })}
                className={FIELD_CLASS}
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">URL</span>
              <input
                type="text"
                value={config.url}
                onChange={(e) => patch({ url: e.target.value })}
                placeholder="https://api.example.com/leads"
                className={[FIELD_CLASS, "font-mono-token"].join(" ")}
              />
            </label>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">Timeout (ms)</span>
              <input
                type="number"
                min={1000}
                max={60000}
                value={config.timeoutMs}
                onChange={(e) => patch({ timeoutMs: Number(e.target.value) })}
                className={FIELD_CLASS}
              />
            </label>
            <p className="text-[11px] leading-relaxed text-foreground-muted">
              Requests to private/internal IP ranges are blocked server-side (SSRF protection).
            </p>
          </>
        )}

        {node.data.nodeType === "condition" && (
          <>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">Field (dot-path)</span>
              <input
                type="text"
                value={config.field}
                onChange={(e) => patch({ field: e.target.value })}
                placeholder="lead.budget"
                className={[FIELD_CLASS, "font-mono-token"].join(" ")}
              />
            </label>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">Operator</span>
              <select
                value={config.operator}
                onChange={(e) => patch({ operator: e.target.value })}
                className={FIELD_CLASS}
              >
                {CONDITION_OPERATORS.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </label>
            {config.operator !== "isEmpty" && config.operator !== "isNotEmpty" && (
              <label className={LABEL_CLASS}>
                <span className="text-foreground-muted">Value</span>
                <input
                  type="text"
                  value={config.value ?? ""}
                  onChange={(e) => patch({ value: e.target.value })}
                  className={FIELD_CLASS}
                />
              </label>
            )}
          </>
        )}

        {node.data.nodeType === "ai" && (
          <>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">OpenRouter model</span>
              <input
                type="text"
                value={config.model}
                onChange={(e) => patch({ model: e.target.value })}
                placeholder="anthropic/claude-3.5-haiku"
                className={[FIELD_CLASS, "font-mono-token"].join(" ")}
              />
            </label>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">System prompt</span>
              <textarea
                rows={3}
                value={config.systemPrompt}
                onChange={(e) => patch({ systemPrompt: e.target.value })}
                className={FIELD_CLASS}
              />
            </label>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">User prompt template</span>
              <textarea
                rows={3}
                value={config.userPromptTemplate}
                onChange={(e) => patch({ userPromptTemplate: e.target.value })}
                placeholder="Summarize: {{input.requirements}}"
                className={[FIELD_CLASS, "font-mono-token"].join(" ")}
              />
            </label>
          </>
        )}

        {node.data.nodeType === "notification" && (
          <>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">Channel</span>
              <select
                value={config.channel}
                onChange={(e) => patch({ channel: e.target.value })}
                className={FIELD_CLASS}
              >
                {NOTIFICATION_CHANNELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">Target</span>
              <input
                type="text"
                value={config.target}
                onChange={(e) => patch({ target: e.target.value })}
                placeholder="sales-team@company.com"
                className={FIELD_CLASS}
              />
            </label>
            <label className={LABEL_CLASS}>
              <span className="text-foreground-muted">Message template</span>
              <textarea
                rows={3}
                value={config.messageTemplate}
                onChange={(e) => patch({ messageTemplate: e.target.value })}
                className={FIELD_CLASS}
              />
            </label>
          </>
        )}
      </div>

      <div className="mt-auto flex gap-2 border-t border-border p-3">
        <button
          type="button"
          onClick={() => duplicateNode(node.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => deleteNode(node.id)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Delete
        </button>
      </div>
    </aside>
  );
}
