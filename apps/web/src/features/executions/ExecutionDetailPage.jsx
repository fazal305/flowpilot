import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useExecution } from "./api/executions";
import { NODE_DEFINITIONS } from "@/features/workflows/nodeDefinitions";
import { NODE_STATUS_STYLES, EXECUTION_STATUS_STYLES, formatDuration, shortId } from "./statusStyles";

function NodeRow({ nodeExecution, selected, onSelect }) {
  const def = NODE_DEFINITIONS[nodeExecution.nodeType];
  const Icon = def?.icon;
  const status = NODE_STATUS_STYLES[nodeExecution.status];
  const StatusIcon = status.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors",
        selected ? "bg-surface-muted" : "hover:bg-surface-muted",
      ].join(" ")}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden="true" />}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{nodeExecution.nodeKey}</span>
      <span className={["flex items-center gap-1.5 text-xs font-medium", status.text].join(" ")}>
        <StatusIcon className={["h-3.5 w-3.5", status.spin ? "animate-spin" : ""].join(" ")} aria-hidden="true" />
        {status.label}
      </span>
      <span className="w-16 shrink-0 text-right font-mono-token text-xs text-foreground-muted">
        {formatDuration(nodeExecution.durationMs)}
      </span>
    </button>
  );
}

function JsonBlock({ label, value }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground-muted">{label}</h3>
      <pre className="max-h-64 overflow-auto rounded-md border border-border bg-surface-muted p-3 font-mono-token text-xs">
        {value === null || value === undefined ? "—" : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function NodeDetailPanel({ nodeExecution }) {
  if (!nodeExecution) {
    return (
      <aside className="flex w-96 shrink-0 flex-col border-l border-border bg-surface p-4">
        <p className="text-sm text-foreground-muted">Select a node to inspect its input, output, and timing.</p>
      </aside>
    );
  }

  return (
    <aside className="flex w-96 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-surface p-4">
      <div>
        <h2 className="text-sm font-semibold">{nodeExecution.nodeKey}</h2>
        <p className="text-xs text-foreground-muted">{nodeExecution.nodeType}</p>
      </div>

      {nodeExecution.status === "FAILED" && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium">{nodeExecution.errorType ?? "Error"}</p>
            <p className="mt-0.5">{nodeExecution.errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-foreground-muted">Status</p>
          <p className="font-medium">{nodeExecution.status}</p>
        </div>
        <div>
          <p className="text-foreground-muted">Duration</p>
          <p className="font-medium">{formatDuration(nodeExecution.durationMs)}</p>
        </div>
        <div>
          <p className="text-foreground-muted">Retries</p>
          <p className="font-medium">{nodeExecution.retryCount ?? 0}</p>
        </div>
        <div>
          <p className="text-foreground-muted">Started</p>
          <p className="font-medium">
            {nodeExecution.startedAt ? new Date(nodeExecution.startedAt).toLocaleTimeString() : "—"}
          </p>
        </div>
      </div>

      <JsonBlock label="Input" value={nodeExecution.input} />
      <JsonBlock label="Output" value={nodeExecution.output} />
    </aside>
  );
}

export function ExecutionDetailPage() {
  const { executionId } = useParams();
  const [selectedNodeKey, setSelectedNodeKey] = useState(null);
  const { data: execution, isLoading, isError, error } = useExecution(executionId);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-foreground-muted">Loading run…</div>;
  }

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
        <p className="text-sm text-destructive">Couldn't load this run.</p>
        <p className="max-w-sm text-xs text-foreground-muted">{error?.message}</p>
        <Link to="/executions" className="mt-2 text-sm text-accent hover:underline">
          Back to executions
        </Link>
      </div>
    );
  }

  const statusStyle = EXECUTION_STATUS_STYLES[execution.status] ?? EXECUTION_STATUS_STYLES.PENDING;
  const selectedNode = execution.nodeExecutions.find((n) => n.nodeKey === selectedNodeKey) ?? null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Link to="/executions" className="rounded-md p-1.5 text-foreground-muted hover:bg-surface-muted">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="font-mono-token text-lg font-semibold">RUN #{shortId(execution.id)}</h1>
          <p className="text-xs text-foreground-muted">
            {execution.triggeredBy} · started {new Date(execution.startedAt).toLocaleString()}
          </p>
        </div>
        <span className={["ml-auto rounded-full px-3 py-1 text-xs font-medium", statusStyle.bg, statusStyle.text].join(" ")}>
          {statusStyle.label}
        </span>
        <span className="font-mono-token text-sm text-foreground-muted">
          Total: {formatDuration(execution.durationMs)}
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto">
          {execution.nodeExecutions.length === 0 ? (
            <p className="p-6 text-sm text-foreground-muted">No nodes ran for this execution yet.</p>
          ) : (
            execution.nodeExecutions.map((n) => (
              <NodeRow
                key={n.id}
                nodeExecution={n}
                selected={n.nodeKey === selectedNodeKey}
                onSelect={() => setSelectedNodeKey(n.nodeKey)}
              />
            ))
          )}

          {execution.logs.length > 0 && (
            <div className="p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">Logs</h2>
              <ul className="flex flex-col gap-1 font-mono-token text-xs text-foreground-muted">
                {execution.logs.map((entry) => (
                  <li key={entry.id}>
                    [{entry.level}] {entry.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <NodeDetailPanel nodeExecution={selectedNode} />
      </div>
    </div>
  );
}
